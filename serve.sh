#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${1:-8080}"

echo ""
echo "  RED VAN DAREDEVIL - local server"
echo "  Open: http://localhost:${PORT}"
echo "  Stop: Ctrl+C"
echo ""

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT"
else
  cat <<'EOF'
Python 3 was not found.

Install it first:
  macOS:        brew install python
  Ubuntu/Debian: sudo apt update && sudo apt install python3
  Fedora:       sudo dnf install python3

Then run this script again.
EOF
  exit 1
fi
