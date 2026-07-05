#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Error: .env was not found."
  echo "Copy .env.example to .env and configure DATABASE_URL and JWT_SECRET."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm was not found. Install Node.js 20 or newer."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

API_PORT="$(sed -n 's/^PORT=//p' .env | head -n 1)"
API_PORT="${API_PORT:-3000}"
WEB_PORT=4173

stop_port() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "$port"/tcp 2>/dev/null || true)"
  else
    echo "Warning: lsof/fuser was not found; port $port could not be checked."
    return
  fi

  if [[ -z "$pids" ]]; then
    return
  fi

  echo "Stopping old listener on port $port: $pids"
  kill $pids 2>/dev/null || true
  sleep 1

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "$port"/tcp 2>/dev/null || true)"
  fi
  if [[ -n "$pids" ]]; then
    kill -9 $pids 2>/dev/null || true
  fi
}

echo "Stopping old listeners on ports $API_PORT and $WEB_PORT..."
stop_port "$API_PORT"
stop_port "$WEB_PORT"

echo "Web: http://localhost:4173/"
echo "API: http://localhost:$API_PORT/api/health"
echo "Press Ctrl+C to stop both processes."
echo
npm run dev
