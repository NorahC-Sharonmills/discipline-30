#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Checking Node.js and npm..."
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js was not found. Install Node.js 20 or newer."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm was not found."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if (( NODE_MAJOR < 20 )); then
  echo "Error: Node.js 20 or newer is required. Current version: $(node --version)"
  exit 1
fi

echo "[2/4] Preparing environment..."
if [[ ! -f .env ]]; then
  cp .env.example .env
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
  JWT_SECRET="$JWT_SECRET" node --input-type=module <<'NODE'
import fs from "node:fs";

const path = ".env";
const content = fs.readFileSync(path, "utf8")
  .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${process.env.JWT_SECRET}`);
fs.writeFileSync(path, content);
NODE
  echo "Created .env with a new JWT secret."
  echo "Review DATABASE_URL in .env if your PostgreSQL credentials differ."
else
  echo "Existing .env kept unchanged."
fi

echo "[3/4] Installing dependencies..."
npm install

echo "[4/4] Applying database schema..."
if ! command -v psql >/dev/null 2>&1; then
  echo "Warning: psql was not found."
  echo "On macOS with Homebrew: brew install postgresql@16"
  echo "Then run: psql \"DATABASE_URL\" -f database/schema.sql"
else
  DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env | head -n 1)"
  if [[ -z "$DATABASE_URL" ]]; then
    echo "Warning: DATABASE_URL is missing from .env. Schema was not applied."
  elif psql "$DATABASE_URL" -f database/schema.sql; then
    echo "Database schema applied."
  else
    echo "Warning: Could not apply schema. Check PostgreSQL and DATABASE_URL, then run ./install.sh again."
  fi
fi

chmod +x install.sh run-public-server.sh

echo
echo "Installation complete."
echo "Run: ./run-public-server.sh"
