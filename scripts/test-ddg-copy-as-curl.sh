#!/usr/bin/env bash
# 复刻浏览器 Copy as cURL 的 POST 请求（完整浏览器 header 集，无 cookie），
# 用系统 curl（OpenSSL / HTTP1.1）测：仅靠 header 能否通过 DDG 风控。
# 与 check-ddg-egress.sh 相互独立，不改动它。
#
# 用法：
#   ./scripts/test-ddg-copy-as-curl.sh                    # 自动探测 / .env，否则交互输入
#   ./scripts/test-ddg-copy-as-curl.sh --token-file ./.env
#   DDG_TOKEN=xxx ./scripts/test-ddg-copy-as-curl.sh
#
# token 进 curl 的 argv 不可避免（实验本身就是复刻命令行 curl），
# 但本脚本不打印 token、不写入磁盘。
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
  for f in .env; do
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

# 与浏览器 Copy as cURL 的 POST 请求逐项对齐：POST、无 body、content-length: 0、
# same-site CORS header 全套；不含 cookie（Copy as cURL 默认也不含）。
curl_args=(
  --url 'https://quack.duckduckgo.com/api/email/addresses'
  -X POST
  -H 'accept: */*'
  -H 'accept-language: zh-CN,zh;q=0.7'
  -H "authorization: Bearer ${TOKEN}"
  -H 'content-length: 0'
  -H 'origin: https://duckduckgo.com'
  -H 'priority: u=1, i'
  -H 'referer: https://duckduckgo.com/'
  -H 'sec-ch-ua: "Not:A-Brand";v="8", "Chromium";v="156", "Brave";v="156"'
  -H 'sec-fetch-dest: empty'
  -H 'sec-fetch-mode: cors'
  -H 'sec-fetch-site: same-site'
  -H 'sec-gpc: 1'
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
)

tmp_body="$(mktemp)"
trap 'rm -f "$tmp_body"' EXIT

echo "POST https://quack.duckduckgo.com/api/email/addresses"
echo "  完整浏览器 header / 系统 curl(OpenSSL, HTTP/1.1) / 无 cookie"
status="$(curl "${curl_args[@]}" -sS --max-time 30 -o "$tmp_body" -w '%{http_code}')" || status="000"
echo "HTTP: ${status}"
echo "body:"
cat "$tmp_body"
echo
