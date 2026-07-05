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

echo "Web: http://localhost:4173/"
echo "API: http://localhost:3000/api/health"
echo "Press Ctrl+C to stop both processes."
echo
npm run dev
