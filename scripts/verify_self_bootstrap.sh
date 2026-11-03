#!/bin/sh
# Verify the code-level self-bootstrap under the EXACT platform condition:
#   - NO DATABASE_URL in the environment (the repo .env is gitignored)
#   - NO pre-existing schema (fresh DB file)
# The app must default DATABASE_URL, create the db dir, run ensureSchema()
# (idempotent DDL), and serve /api/health = 200.
set -e
cd /home/z/my-project

pkill -f "standalone/server.js" 2>/dev/null || true
sleep 1

# Move the real DB aside so the bootstrap is exercised against a fresh file.
if [ -f db/custom.db ]; then
  mv db/custom.db db/custom.db.bak
  echo "[setup] moved existing db/custom.db aside"
fi
# Also clear any stale default-location db so the default path is fresh
rm -f db/custom.db

echo "=== boot standalone server with NO DATABASE_URL (env -i) ==="
env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
  bun .next/standalone/server.js > /tmp/bootserver.log 2>&1 &
PID=$!
echo "started pid $PID"

code=000
for i in $(seq 1 15); do
  sleep 2
  body=$(curl -s --max-time 4 http://localhost:3000/api/health 2>/dev/null || true)
  code=$(printf '%s' "$body" | grep -q '"status"' && echo 200 || echo "")
  if [ -n "$code" ]; then
    echo "[boot] health OK after $((i*2))s"
    echo "$body"
    break
  fi
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 http://localhost:3000/api/health 2>/dev/null || echo "?")
  echo "[boot] waiting… HTTP $code"
done

echo "=== did the default db file get created? ==="
ls -la db/custom.db 2>&1 || echo "db/custom.db NOT created"
echo "=== server log (last 8 lines) ==="
tail -8 /tmp/bootserver.log 2>/dev/null

# cleanup: kill the test server, restore the real DB
kill $PID 2>/dev/null || true
sleep 1
if [ -f db/custom.db.bak ]; then
  mv db/custom.db.bak db/custom.db
  echo "[cleanup] restored original db/custom.db"
fi
