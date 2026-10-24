#!/usr/bin/env bash
# 遍历 curl_cffi 支持的全部浏览器引擎（TLS+HTTP2 指纹），逐个打 DDG alias API，
# 找是否有引擎能返回 201（创建成功）。与 check-ddg-egress.sh 相互独立。
#
# 用法：
#   ./scripts/check-ddg-engines.sh                    # 自动探测 .env.local / .env，否则交互输入
#   ./scripts/check-ddg-engines.sh --token-file ./.env
#
# 注意：某个引擎若命中 201，会真实生成一个 @duck.com 地址（消耗配额）。
# token 不打印、不进 argv（经环境变量下传）。
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN=""
TOKEN_FILE=""

pick_from_envfile() {
  local f="$1" line=""
  if grep -qE '^[A-Za-z_][A-Za-z0-9_]*=' "$f" 2>/dev/null; then
    line="$(grep -iE '^[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*=' "$f" | head -1 || true)"
    line="${line#*=}"
  else
    line="$(head -1 "$f" || true)"
  fi
  printf '%s' "$line" | tr -d ' \t\r\n"\x27'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token-file) TOKEN_FILE="${2:-}"; shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

if [[ -n "$TOKEN_FILE" ]]; then
  [[ -f "$TOKEN_FILE" ]] || { echo "文件不存在: $TOKEN_FILE" >&2; exit 1; }
  TOKEN="$(pick_from_envfile "$TOKEN_FILE")"
elif [[ -n "${DDG_TOKEN:-}" ]]; then
  TOKEN="$DDG_TOKEN"
else
  for f in .env.local .env; do
    [[ -f "$f" ]] || continue
    TOKEN="$(pick_from_envfile "$f")"
    [[ -n "$TOKEN" ]] && break
  done
fi

if [[ -z "$TOKEN" ]]; then
  read -r -s -p "DuckDuckGo Access Token: " TOKEN
  echo
fi

[[ -n "$TOKEN" ]] || { echo "token 为空，退出" >&2; exit 1; }

export DDG_TOKEN_INTERNAL="$TOKEN"
unset TOKEN

if ! command -v uv >/dev/null 2>&1; then
  echo "未找到 uv，请先安装（mise install uv）" >&2
  exit 1
fi

uv run --with curl_cffi python - <<'PY'
import os
from curl_cffi import requests

t = os.environ["DDG_TOKEN_INTERNAL"]
url = "https://quack.duckduckgo.com/api/email/addresses"

names = [e.value for e in requests.BrowserType]
print(f"引擎列表({len(names)}): {', '.join(names)}")
print("请求: POST /api/email/addresses  仅 Authorization 头（与官方扩展一致）")
print()

for n in names:
    try:
        r = requests.post(url, headers={"Authorization": f"Bearer {t}"}, impersonate=n, timeout=15)
        mark = " <<< 201 命中!" if r.status_code == 201 else ""
        print(f"  {n:<18} -> {r.status_code} {r.text[:60]!r}{mark}")
    except Exception as e:
        print(f"  {n:<18} -> ERROR {e}")
PY
