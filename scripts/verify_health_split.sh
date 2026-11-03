#!/bin/sh
# Verify the split: /api/health is DB-free (always 200), /api/db-check reports
# real DB status. Boots standalone with NO DATABASE_URL env against a fresh DB.
set -e
cd /home/z/my-project

pkill -9 -f "standalone/server.js" 2>/dev/null || true
sleep 1

if [ -f db/custom.db ]; then mv db/custom.db db/custom.db.bak; fi
rm -f db/custom.db

echo "=== boot standalone, NO DATABASE_URL (env -i) ==="
env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
  bun .next/standalone/server.js > /tmp/bootserver.log 2>&1 &
PID=$!

ok=0
for i in $(seq 1 15); do
  sleep 2
  h=$(curl -s --max-time 4 http://localhost:3000/api/health 2>/dev/null || true)
  if echo "$h" | grep -q '"status"'; then
    echo "[health] 200: $h"
    ok=1
    break
  fi
done

if [ "$ok" = "1" ]; then
  echo "=== /api/db-check ==="
  curl -s --max-time 8 http://localhost:3000/api/db-check 2>/dev/null; echo
fi

echo "=== server log tail ==="
tail -4 /tmp/bootserver.log 2>/dev/null

kill $PID 2>/dev/null || true
sleep 1
pkill -9 -f "standalone/server.js" 2>/dev/null || true
if [ -f db/custom.db.bak ]; then mv db/custom.db.bak db/custom.db; echo "[cleanup] restored db"; fi
