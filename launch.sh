#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PYTHONPATH="$PYTHONPATH:$SCRIPT_DIR/usd/installs/lib/python"
PATH="$PATH:$SCRIPT_DIR/usd/installs/bin"

python "$SCRIPT_DIR/src/main.py"