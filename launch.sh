#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect if 'uv' package manager is available
if command -v uv &> /dev/null; then
    USE_UV=true
else
    USE_UV=false
fi

# Create virtual environment if missing
if [ ! -d "$SCRIPT_DIR/.venv" ]; then
    if [ "$USE_UV" = true ]; then
        echo "Creating Python virtual environment (.venv) using uv with Python 3.12..."
        uv venv --python 3.12 "$SCRIPT_DIR/.venv"
    else
        echo "Creating Python virtual environment (.venv) using standard python3..."
        python3 -m venv "$SCRIPT_DIR/.venv"
    fi
fi

# Activate virtual environment
source "$SCRIPT_DIR/.venv/bin/activate"

# Sync requirements
echo "Validating Python dependencies in (.venv)..."
if [ "$USE_UV" = true ]; then
    uv pip install -r "$SCRIPT_DIR/requirements.txt"
else
    # Upgrade pip and install
    python3 -m pip install --upgrade pip || true
    python3 -m pip install -r "$SCRIPT_DIR/requirements.txt"
fi

# Export paths in case USD library requires local paths
export PYTHONPATH="$PYTHONPATH:$SCRIPT_DIR/usd/install/lib/python"
export PATH="$PATH:$SCRIPT_DIR/usd/install/bin"

echo "--------------------------------------------------------"
echo "  Studio Tools VFX Web USD Server is starting!"
echo "  API docs available at: http://localhost:8000/docs"
echo "  Development frontend: http://localhost:8000/public/pipeline/studiotools/index.html"
echo "--------------------------------------------------------"

# Run FastAPI backend using uvicorn
python -m uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 --reload
