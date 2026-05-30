#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

get_lan_ip() {
  if command -v ipconfig >/dev/null 2>&1; then
    ipconfig getifaddr en0 2>/dev/null && return 0
    ipconfig getifaddr en1 2>/dev/null && return 0
  fi

  if command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | awk '{print $1}' && return 0
  fi

  echo "YOUR_COMPUTER_IP"
}

LAN_IP="$(get_lan_ip)"

cd "$ROOT_DIR"

echo "Serving: $ROOT_DIR"
echo "Local:   http://localhost:${PORT}/"
echo "Phone:   http://${LAN_IP}:${PORT}/"
echo
echo "Open the Phone URL on an iPhone connected to the same Wi-Fi."
echo "Press Ctrl+C to stop."
echo

python3 -m http.server "$PORT" --bind 0.0.0.0
