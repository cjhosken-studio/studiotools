#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo $SCRIPT_DIR

ls $SCRIPT_DIR

ls $SCRIPT_DIR/usd

ls $SCRIPT_DIR/usd/install


PYTHONPATH="$PYTHONPATH:$SCRIPT_DIR/usd/install/lib/python"
PATH="$PATH:$SCRIPT_DIR/usd/install/bin"

python "$SCRIPT_DIR/src/main.py"