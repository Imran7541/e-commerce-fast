#!/usr/bin/env bash
# Start Cloudflare Tunnel for Familio Bazar E-Commerce Platform
# Target: http://127.0.0.1:5050

set -euo pipefail

PORT="${PORT:-5050}"
TARGET_URL="http://127.0.0.1:${PORT}"
LOG_FILE="/tmp/cloudflared_quicktunnel.log"

echo "[INFO] Checking local server at ${TARGET_URL}..."
if ! curl -s --noproxy "*" -I "${TARGET_URL}/api/settings" >/dev/null 2>&1; then
  echo "[WARNING] Local server is not responding at ${TARGET_URL}."
  echo "[INFO] Starting local server in background..."
  PORT="${PORT}" node src/server.js > /tmp/familio_server.log 2>&1 &
  sleep 2
fi

echo "[INFO] Launching Cloudflare Quick Tunnel targeting ${TARGET_URL}..."
~/.local/bin/cloudflared tunnel --url "${TARGET_URL}" --logfile "${LOG_FILE}" > /dev/null 2>&1 &
TUNNEL_PID=$!

echo "[INFO] Cloudflare tunnel started with PID ${TUNNEL_PID}."
echo "[INFO] Waiting for Cloudflare Edge URL..."

TUNNEL_URL=""
for i in {1..30}; do
  if grep -o "https://[a-zA-Z0-9-]\+\.trycloudflare\.com" "${LOG_FILE}" 2>/dev/null | tail -n 1 | read -r URL; then
    if [ -n "${URL}" ]; then
      TUNNEL_URL="${URL}"
      break
    fi
  fi
  sleep 1
done

if [ -n "${TUNNEL_URL}" ]; then
  echo "=========================================================="
  echo "CLOUD FLARE LIVE TUNNEL ESTABLISHED"
  echo "Public HTTPS URL: ${TUNNEL_URL}"
  echo "Target Upstream:  ${TARGET_URL}"
  echo "Log file:         ${LOG_FILE}"
  echo "Tunnel PID:       ${TUNNEL_PID}"
  echo "=========================================================="
else
  echo "[ERROR] Failed to obtain Cloudflare tunnel URL within 30 seconds."
  echo "[INFO] Check log file: ${LOG_FILE}"
  exit 1
fi
