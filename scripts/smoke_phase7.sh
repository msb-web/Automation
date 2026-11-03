#!/usr/bin/env bash
# Phase 7 smoke test: publishing automation end-to-end (mock mode).
set -uo pipefail
BASE="http://localhost:3000"
KEY="demokey123"
CJ=/tmp/cj7.txt

echo "=== login ==="
curl -s -c "$CJ" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@aivideo.io","password":"demo1234"}' >/dev/null && echo "ok"

echo "=== 1. publish config (expect mock mode) ==="
curl -s -b "$CJ" "$BASE/api/publish/config" | python3 -m json.tool

echo "=== 2. mock publish project 13 (youtube + facebook) ==="
curl -s -b "$CJ" -X POST "$BASE/api/projects/13/publish" -H 'Content-Type: application/json' \
  -d '{"platforms":["youtube","facebook"]}' | python3 -m json.tool

echo "=== 3. list publish records for project 13 ==="
curl -s -b "$CJ" "$BASE/api/projects/13/publish" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for r in d.get('records',[]):
    print(f\"  #{r['id']} {r['platform']:9s} {r['status']:9s} url={r.get('url')} err={r.get('error')}\")
"

echo "=== 4. schedule a publish ~3s in the future, then tick ==="
WHEN=$(python3 -c "from datetime import datetime,timezone,timedelta;print((datetime.now(timezone.utc)+timedelta(seconds=3)).isoformat())")
echo "scheduleAt=$WHEN"
curl -s -b "$CJ" -X POST "$BASE/api/projects/13/publish" -H 'Content-Type: application/json' \
  -d "{\"platforms\":[\"youtube\"],\"scheduleAt\":\"$WHEN\"}" | python3 -m json.tool
echo "sleep 4s for schedule to become due..."
sleep 4
echo "--- tick (API key auth) ---"
curl -s -X POST "$BASE/api/publish/tick" -H "x-api-key: $KEY" | python3 -m json.tool
echo "--- records after tick ---"
curl -s -b "$CJ" "$BASE/api/projects/13/publish" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for r in d.get('records',[]):
    print(f\"  #{r['id']} {r['platform']:9s} {r['status']:9s} pub={r.get('publishedAt')} url={r.get('url')}\")
"

echo "=== 5. webhook run with API key (expect jobId) ==="
curl -s -X POST "$BASE/api/webhooks/run" -H "x-api-key: $KEY" -H 'Content-Type: application/json' \
  -d '{"projectId":13,"publish":false}' | python3 -m json.tool

echo "=== 6. webhook run WITHOUT key/cookie (expect 401) ==="
curl -s -o /dev/null -w "http_status=%{http_code}\n" -X POST "$BASE/api/webhooks/run" \
  -H 'Content-Type: application/json' -d '{"projectId":13}'

echo "=== 7. tick without key/cookie (expect 401) ==="
curl -s -o /dev/null -w "http_status=%{http_code}\n" -X POST "$BASE/api/publish/tick"

echo "=== 8. notify log entries (from dev.log) ==="
grep -E '\[notify\] (publish|approval|pipeline)' /home/z/my-project/dev.log 2>/dev/null | tail -6 || echo "(none in dev.log)"
echo "=== done ==="
