#!/usr/bin/env bash
# PWA installability feedback loop.
# Drives the exact bug: Chrome won't show the install button if the manifest
# is missing, icons 404, or the service worker isn't served/registered.
set -u
cd "$(dirname "$0")/.."

PORT=3100
BASE="http://localhost:$PORT"
FAIL=0

# 1. Build first (pnpm start only serves the pre-built .next directory)
echo "==> Building..."
pnpm build >/tmp/pwa-build.log 2>&1
if [ $? -ne 0 ]; then
  echo "BUILD FAILED (see /tmp/pwa-build.log)"
  exit 1
fi

# 2. Start production server
pnpm start -p "$PORT" >/tmp/pwa-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

# Wait for server readiness
for i in $(seq 1 30); do
  if curl -sf -o /dev/null "$BASE/" 2>/dev/null; then break; fi
  sleep 0.5
done

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS  $name"
  else
    echo "FAIL  $name (expected $expected, got $actual)"
    FAIL=1
  fi
}

# 3. Manifest linked in HTML
MANIFEST_LINK=$(curl -s "$BASE/" | grep -o 'rel="manifest" href="[^"]*"' | head -1)
check "manifest linked in HTML" 'rel="manifest" href="/manifest.webmanifest"' "$MANIFEST_LINK"

# 4. Manifest served & valid JSON
MANIFEST=$(curl -s "$BASE/manifest.webmanifest")
check "manifest is valid JSON" "true" \
  "$(node -e "try{JSON.parse(process.argv[1]);console.log('true')}catch(e){console.log('false')}" "$MANIFEST")"

# 5. Icons resolve (HTTP 200) — read paths from the manifest
ICON_OK=true
for icon_src in $(node -e "
  const m = JSON.parse(process.argv[1]);
  for (const i of m.icons || []) console.log(i.src);
" "$MANIFEST" 2>/dev/null); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$icon_src")
  if [ "$CODE" != "200" ]; then
    echo "FAIL  icon $icon_src resolves (expected 200, got $CODE)"
    ICON_OK=false
    FAIL=1
  else
    echo "PASS  icon $icon_src resolves"
  fi
done
if [ "$ICON_OK" = "true" ]; then
  check "all manifest icons resolve" "200" "200"
fi

# 6. Service worker served
SW=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sw.js")
SW_OK=$([ "$SW" = "200" ] && echo "200" || echo "not-200")
check "service worker (sw.js) served" "200" "$SW_OK"

echo "---"
if [ "$FAIL" = "0" ]; then
  echo "RESULT: GREEN (PWA appears installable)"
  exit 0
else
  echo "RESULT: RED (PWA not installable — Chrome hides the install button)"
  exit 1
fi