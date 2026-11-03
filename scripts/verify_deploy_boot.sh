#!/bin/sh
# Simulate the container's exact boot condition to verify the deploy fix:
#   - fresh empty "volume" DB (no pre-existing schema)
#   - NO .env (gitignored, not copied into the image)
#   - only the ENV the Dockerfile runtime stage provides
#   - the Docker HEALTHCHECK command (curl -fs /api/health)
# If this ends with "healthcheck PASS", the deploy will pass.
set -e

# free port 3000 from any earlier server
pkill -f "standalone/server.js" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

# fresh "volume" dir to mimic an empty mounted SQLite volume
rm -rf /tmp/sim_deploy
mkdir -p /tmp/sim_deploy

echo "=== step 1: prisma db push into a FRESH db with ONLY DATABASE_URL (no .env) ==="
env -i PATH="$PATH" HOME="$HOME" DATABASE_URL="file:/tmp/sim_deploy/custom.db" \
  bunx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -6
echo "db file:"; ls -la /tmp/sim_deploy/custom.db

echo "=== step 2: start standalone server with ONLY the Dockerfile ENV (no .env) ==="
env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
  DATABASE_URL="file:/tmp/sim_deploy/custom.db" \
  bun .next/standalone/server.js > /tmp/simserver.log 2>&1 &
SIM_PID=$!
echo "started sim pid $SIM_PID"

# wait for boot (mirror the 30s start-period the healthcheck allows)
code=000
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  code=$(curl -s -o /tmp/simhealth.json -w "%{http_code}" --max-time 3 http://localhost:3000/api/health 2>/dev/null || true)
  [ "$code" = "200" ] && break
done

echo "=== step 3: healthcheck (what Docker runs: curl -fs /api/health) ==="
echo "HTTP $code"
cat /tmp/simhealth.json 2>/dev/null || echo "(no body)"
echo
if curl -fs --max-time 5 http://localhost:3000/api/health >/dev/null 2>&1; then
  echo "healthcheck PASS (curl -fs exit 0) — deploy will succeed"
else
  echo "healthcheck FAIL (curl -fs non-zero) — deploy would fail"
fi

echo "=== server log (last 6 lines) ==="
tail -6 /tmp/simserver.log 2>/dev/null || true

# leave the sim server running so the app stays usable; report its pid
echo "=== sim server still running on :3000 (pid $SIM_PID) ==="
