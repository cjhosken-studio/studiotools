#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/.venv/bin/activate"

PYTHONPATH="$PYTHONPATH:$SCRIPT_DIR/plugins/usd/installs/OpenUSD/lib/python"
PATH="$PATH:$SCRIPT_DIR/plugins/usd/installs/OpenUSD/bin"

python "$SCRIPT_DIR/src/main.py"