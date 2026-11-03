#!/bin/sh
# Verify the local run path with a FRESH database (simulates a clean checkout):
#   /api/health  -> 200 (DB-free)
#   GET /api/seed -> creates schema + admin user in one step
#   /api/db-check -> db:ok with projects
# Then query the SQLite file to confirm the admin row exists.
set -e
cd /home/z/my-project

pkill -9 -f "standalone/server.js" 2>/dev/null || true
sleep 1

if [ -f db/custom.db ]; then mv db/custom.db db/custom.db.bak; fi
rm -f db/custom.db

echo "=== boot standalone, NO DATABASE_URL (fresh DB) ==="
env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
  bun .next/standalone/server.js > /tmp/bootserver.log 2>&1 &
PID=$!

ok=0
for i in $(seq 1 15); do
  sleep 2
  h=$(curl -s --max-time 4 http://localhost:3000/api/health 2>/dev/null || true)
  if echo "$h" | grep -q '"status"'; then echo "[health] $h"; ok=1; break; fi
done

if [ "$ok" = "1" ]; then
  echo "=== GET /api/seed (browser-friendly) ==="
  curl -s --max-time 15 http://localhost:3000/api/seed; echo
  echo "=== /api/db-check ==="
  curl -s --max-time 8 http://localhost:3000/api/db-check; echo
  echo "=== admin row in SQLite file ==="
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 db/custom.db "SELECT id,email,role FROM \"User\";" 2>/dev/null || echo "(sqlite3 not available)"
  else
    echo "(sqlite3 CLI not installed; checking file exists)"
    ls -la db/custom.db
  fi
fi

echo "=== server log tail ==="
tail -3 /tmp/bootserver.log 2>/dev/null

kill $PID 2>/dev/null || true
sleep 1
pkill -9 -f "standalone/server.js" 2>/dev/null || true
if [ -f db/custom.db.bak ]; then mv db/custom.db.bak db/custom.db; echo "[cleanup] restored db"; fi
