#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PYTHONPATH="$PYTHONPATH:$SCRIPT_DIR/usd/install/lib/python"
export PATH="$PATH:$SCRIPT_DIR/usd/install/bin"

python "$SCRIPT_DIR/src/main.py"