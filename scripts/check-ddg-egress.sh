#!/usr/bin/env bash
# check-ddg-egress.sh —— 诊断 DDG alias 端点对不同客户端指纹 / 出口的响应。
#
# 目的：确认 DDG 的 403 拦截是"纯 IP 级"还是"IP × TLS 指纹"组合判断。
# 每组出口跑三次对照：系统 curl vs curl_cffi 默认指纹 vs curl_cffi chrome 指纹（impersonate）。
#
# 用法：
#   ./scripts/check-ddg-egress.sh                                        # 自动探测 .env.local，否则交互输入 token
#   ./scripts/check-ddg-egress.sh --token-file ~/ddg.token               # 从文件读 token（纯文本 或 KEY=value 行）
#   ./scripts/check-ddg-egress.sh socks5://127.0.0.1:1080                # 指定代理出口
#   ./scripts/check-ddg-egress.sh socks5://h1:1 socks5://h2:2 ...        # 逐个测多个节点
#
# Token 获取优先级：--token-file > 环境变量 DDG_TOKEN > .env.local/.env 探测 > 交互输入（不回显）。
# Token 只进子进程环境变量（DDG_TOKEN_INTERNAL），不打印、不落盘、不进 shell 历史、不进进程参数。
#
# 判读：
#   401 invalid_token            → 到达认证层（风控通过），卡在 token 有效性本身
#   curl 403 + curl_cffi 401     → 传输层指纹差异：curl 被对掉，curl_cffi 能过风控
#   全部 403 空 body             → 该出口 IP 被风控拒，换出口再看
#   返回 200 + address           → 完整成功，该出口+该客户端可直接用于生产

set -euo pipefail

TOKEN=""
TOKEN_FILE=""
PROXIES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token-file)
      TOKEN_FILE="${2:?--token-file 需要文件路径}"
      shift 2
      ;;
    *)
      PROXIES+=("$1")
      shift
      ;;
  esac
done

# 从 KEY=value 行取 token（只匹配键名含 TOKEN 的）
pick_from_envfile() {
  local f="$1"
  grep -iE '^[A-Za-z_][A-Za-z0-9_]*=' "$f" 2>/dev/null \
    | grep -iE '^[A-Za-z_]*TOKEN[A-Za-z_]*=' \
    | head -1 | cut -d= -f2- | tr -d ' \t\r\n"\x27'
}

# 1) 显式 --token-file
if [[ -n "$TOKEN_FILE" ]]; then
  [[ -f "$TOKEN_FILE" ]] || { echo "错误: token 文件不存在: $TOKEN_FILE" >&2; exit 1; }
  TOKEN="$(pick_from_envfile "$TOKEN_FILE")"
  [[ -z "$TOKEN" ]] && TOKEN="$(tr -d ' \t\r\n"\x27' < "$TOKEN_FILE")"
fi

# 2) 环境变量
if [[ -z "$TOKEN" && -n "${DDG_TOKEN:-}" ]]; then
  TOKEN="$DDG_TOKEN"
fi

# 3) 自动探测 .env.local / .env
if [[ -z "$TOKEN" ]]; then
  for f in .env.local .env; do
    [[ -f "$f" ]] || continue
    TOKEN="$(pick_from_envfile "$f")"
    if [[ -n "$TOKEN" ]]; then break; fi
  done
fi

# 4) 交互输入（不回显、不进历史）
if [[ -z "$TOKEN" ]]; then
  read -r -s -p "DuckDuckGo Access Token: " TOKEN
  echo
fi
[[ -z "$TOKEN" ]] && { echo "错误: 未能获取 token" >&2; exit 1; }
# 格式自查：官方扩展 isValidToken 规则是纯小写字母数字（duckduckgo-privacy-extension/.../email-autofill.js）
if ! printf '%s' "$TOKEN" | grep -qE '^[a-z0-9]+$'; then
  echo "警告: token 含小写字母数字之外的字符(如大写/+/=)，不符合官方扩展 isValidToken 规则，大概率无效" >&2
fi

export DDG_TOKEN_INTERNAL="$TOKEN"
unset TOKEN
# 可选：从 .env 读 COOKIE= 行（浏览器登录会话 cookie，验证是否与 token 配对使用）
COOKIE=""
for f in .env.local .env; do
  [[ -f "$f" ]] || continue
  COOKIE="$(grep -iE '^[A-Za-z_]*COOKIE[A-Za-z_]*=' "$f" | head -1 | cut -d= -f2- | tr -d '\r\n"')"
  if [[ -n "$COOKIE" ]]; then break; fi
done
if [[ -n "$COOKIE" ]]; then
  export DDG_COOKIE_INTERNAL="$COOKIE"
  unset COOKIE
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "错误: 需要 uv（Python 包管理器），请先安装" >&2
  exit 1
fi

uv run --with curl_cffi python - "${PROXIES[@]}" <<'PY'
import os
import shutil
import subprocess
import sys
from curl_cffi import requests

token = os.environ.get("DDG_TOKEN_INTERNAL", "")
cookie = os.environ.get("DDG_COOKIE_INTERNAL", "")
if not token:
    print("错误: 子进程未拿到 token", file=sys.stderr)
    sys.exit(1)

proxies_list = sys.argv[1:] or [None]
url = "https://quack.duckduckgo.com/api/email/addresses"


def probe(label: str, proxy: str | None, impersonate: str | None = None) -> None:
    kwargs: dict = {
        "headers": {"Authorization": f"Bearer {token}"},
        "timeout": 30,
    }
    if proxy:
        kwargs["proxies"] = {"http": proxy, "https": proxy}
    if impersonate:
        kwargs["impersonate"] = impersonate
    try:
        r = requests.post(url, **kwargs)
        print(f"  [{label}] status={r.status_code}  body={r.text[:200]!r}")
    except Exception as e:
        print(f"  [{label}] ERROR: {e}")
def probe_curl(label: str, proxy: str | None) -> None:
    if not shutil.which("curl"):
        print(f"  [{label}] SKIP: 未找到 curl 命令")
        return
    cmd = [
        "curl", "-sS", "--max-time", "30", "-X", "POST", url,
        "-H", f"Authorization: Bearer {token}",
        "-w", "\n[HTTP %{http_code}]",
    ]
    if proxy:
        cmd += ["--proxy", proxy]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=35).stdout
        print(f"  [{label}] {out[:300]!r}")
    except Exception as e:
        print(f"  [{label}] ERROR: {e}")
BROWSER_HEADERS = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.7",
    "authorization": f"Bearer {token}",
    "content-length": "0",
    "origin": "https://duckduckgo.com",
    "priority": "u=1, i",
    "referer": "https://duckduckgo.com/",
    "sec-ch-ua": '"Not:A-Brand";v="8", "Chromium";v="156", "Brave";v="156"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
}


def probe_browser(label: str, proxy: str | None, use_cookie: bool = False) -> None:
    headers = dict(BROWSER_HEADERS)
    if use_cookie:
        headers["cookie"] = cookie
    kwargs: dict = {"headers": headers, "impersonate": "chrome", "timeout": 30}
    if proxy:
        kwargs["proxies"] = {"http": proxy, "https": proxy}
    try:
        r = requests.post(url, **kwargs)
        print(f"  [{label}] status={r.status_code}  body={r.text[:200]!r}")
    except Exception as e:
        print(f"  [{label}] ERROR: {e}")


for proxy in proxies_list:
    print(f"出口: {proxy or '系统网络(TUN)'}")
    probe_curl("系统 curl 对照", proxy)
    probe("curl_cffi 默认指纹", proxy)
    probe("curl_cffi chrome 指纹", proxy, impersonate="chrome")
    probe_browser("浏览器 header 复刻", proxy)
    if cookie:
        probe_browser("浏览器 header + cookie", proxy, use_cookie=True)
    else:
        print("  [浏览器 header + cookie] SKIP: .env 无 COOKIE= 行")
    print()
PY