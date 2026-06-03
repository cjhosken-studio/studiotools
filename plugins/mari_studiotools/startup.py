"""
Studio Tools — Mari Plugin
startup.py

Executed automatically at Mari launch when this directory is listed in
MARI_SCRIPT_PATH. Registers a "Studio Tools" menu and a background idle
callback for the Studio Tools web connection.

Environment variables set by the Studio Tools launcher:
  ST_CWD          — absolute path to the current task directory
  ST_TASK         — task name
  ST_TASKAREA     — task area name
  ST_PROJECT      — project root path
  ST_APP_VERSION  — Mari version string
  STUDIOTOOLS     — Studio Tools install root
"""

import os
import re
import sys

# ---------------------------------------------------------------------------
# Guard: only execute the UI registration when running inside Mari
# ---------------------------------------------------------------------------
try:
    import mari
    _IN_MARI = True
except ImportError:
    _IN_MARI = False

if not _IN_MARI:
    # Allow the module to be imported for unit-testing outside Mari
    raise SystemExit(0)

try:
    from PySide2 import QtWidgets, QtCore, QtGui
except ImportError:
    from PySide6 import QtWidgets, QtCore, QtGui  # Mari 8+ may use PySide6

# ---------------------------------------------------------------------------
# Pipeline helpers
# ---------------------------------------------------------------------------

def _get_context():
    """Returns pipeline context dict from environment variables."""
    return {
        "task_path":  os.environ.get("ST_CWD", ""),
        "task_name":  os.environ.get("ST_TASK", ""),
        "task_area":  os.environ.get("ST_TASKAREA", ""),
        "project":    os.environ.get("ST_PROJECT", ""),
    }


def _scan_published_assets(task_path):
    """
    Walks the project sandbox (two levels up from task_path) and collects all
    published USD/Alembic/OBJ files found in published/ subdirectories.

    Returns list of (display_label, absolute_path) sorted alphabetically.
    """
    assets = []
    sandbox_dir = os.path.dirname(os.path.dirname(task_path))
    if not os.path.isdir(sandbox_dir):
        return assets

    for root, _dirs, files in os.walk(sandbox_dir, followlinks=True):
        if os.path.basename(root) != "published":
            continue
        for f in sorted(files):
            if f.lower().endswith((".usd", ".usda", ".usdc", ".abc", ".obj", ".fbx")):
                full_path = os.path.abspath(os.path.join(root, f))
                rel_path  = os.path.relpath(full_path, sandbox_dir)
                assets.append((rel_path, full_path))

    return sorted(assets, key=lambda x: x[0])


def _import_geometry(filepath):
    """
    Imports or creates a project from the given geometry path.

    - If a project is already open: imports `filepath` as a new geo entity.
    - If no project is open: prompts the artist to create a new project using
      the file as the primary geometry.
    """
    if not os.path.exists(filepath):
        mari.utils.message(f"File not found:\n{filepath}")
        return

    ext = os.path.splitext(filepath)[1].lower()
    if ext not in (".usd", ".usda", ".usdc", ".abc", ".obj", ".fbx"):
        mari.utils.message(
            f"Unsupported format: {ext}\n\n"
            "Studio Tools supports: .usd, .usda, .usdc, .abc, .obj, .fbx"
        )
        return

    asset_name = os.path.splitext(os.path.basename(filepath))[0]
    clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", asset_name)

    if mari.projects.current():
        # Project is open — import as additional geo
        try:
            mari.geo.load(filepath)
            mari.app.log(f"[Studio Tools] Imported geometry: {filepath}")
        except Exception as e:
            mari.utils.message(f"Failed to import geometry:\n{e}")
    else:
        # No project open — offer to create one
        reply = QtWidgets.QMessageBox.question(
            None,
            "Studio Tools — Create Project",
            f"No project is currently open.\n\nCreate a new Mari project using:\n{os.path.basename(filepath)}\n\nas the base geometry?",
            QtWidgets.QMessageBox.Yes | QtWidgets.QMessageBox.Cancel,
        )
        if reply != QtWidgets.QMessageBox.Yes:
            return

        try:
            color_channel = mari.ChannelInfo("color")
            roughness_channel = mari.ChannelInfo(
                "roughness", 4096, 4096, mari.Image.DEPTH_HALF, mari.Color(0.5, 0.5, 0.5)
            )
            mari.projects.create(
                clean_name,       # project name
                filepath,         # geometry path (str or list)
                [color_channel, roughness_channel],  # channels
                [],               # no import images
                None,             # no camera
                None,             # no lights
            )
            mari.app.log(f"[Studio Tools] Created project '{clean_name}' from: {filepath}")
        except Exception as e:
            mari.utils.message(f"Failed to create project:\n{e}")


# ---------------------------------------------------------------------------
# Menu actions
# ---------------------------------------------------------------------------

def action_load_from_project():
    """Presents a dialog to pick a published asset from the current project."""
    ctx = _get_context()
    task_path = ctx["task_path"]
    if not task_path:
        mari.utils.message(
            "Studio Tools: Pipeline context not set.\n\n"
            "ST_CWD environment variable is missing.\n"
            "Please launch Mari from Studio Tools."
        )
        return

    assets = _scan_published_assets(task_path)
    if not assets:
        mari.utils.message("No published assets found in the current project.")
        return

    labels = [a[0] for a in assets]
    paths  = [a[1] for a in assets]

    # Build a simple selection dialog using PySide2
    dlg = QtWidgets.QDialog()
    dlg.setWindowTitle("Studio Tools — Load Asset")
    dlg.setMinimumWidth(560)
    layout = QtWidgets.QVBoxLayout(dlg)

    layout.addWidget(QtWidgets.QLabel("Select a published asset to import:"))

    list_widget = QtWidgets.QListWidget()
    list_widget.addItems(labels)
    list_widget.setCurrentRow(0)
    list_widget.setAlternatingRowColors(True)
    layout.addWidget(list_widget)

    buttons = QtWidgets.QDialogButtonBox(
        QtWidgets.QDialogButtonBox.Ok | QtWidgets.QDialogButtonBox.Cancel
    )
    buttons.accepted.connect(dlg.accept)
    buttons.rejected.connect(dlg.reject)
    layout.addWidget(buttons)

    if dlg.exec_() != QtWidgets.QDialog.Accepted:
        return

    row = list_widget.currentRow()
    if row < 0:
        return

    _import_geometry(paths[row])


def action_import_from_clipboard():
    """
    Reads a file path from the OS clipboard and imports it as geometry.
    Pair with the 'Copy Path' button on a Deliverable card in Studio Tools.
    """
    clipboard = QtWidgets.QApplication.clipboard()
    path = clipboard.text().strip().strip('"').strip("'")

    if not path:
        mari.utils.message("Clipboard is empty.\n\nCopy a file path from Studio Tools first.")
        return

    if not os.path.exists(path):
        mari.utils.message(f"Path from clipboard not found on disk:\n{path}")
        return

    _import_geometry(path)


def action_pipeline_context():
    """Shows a summary of the current pipeline environment."""
    ctx = _get_context()
    lines = [
        "Studio Tools — Pipeline Context",
        "",
        f"Task:       {ctx['task_name'] or '(not set)'}",
        f"Task Area:  {ctx['task_area'] or '(not set)'}",
        f"CWD:        {ctx['task_path'] or '(not set)'}",
        f"Project:    {ctx['project'] or '(not set)'}",
    ]
    mari.utils.message("\n".join(lines))


# ---------------------------------------------------------------------------
# Web connection polling
# ---------------------------------------------------------------------------

_LAST_POLL = 0.0

def _poll_web_connection():
    """
    Idle callback that polls the Studio Tools web server for load_usd commands
    queued from the UI (e.g. clicking → Mari on a deliverable card).
    """
    global _LAST_POLL
    import time
    now = time.time()
    if now - _LAST_POLL < 0.5:
        return
    _LAST_POLL = now

    task_path = os.environ.get("ST_CWD", "")
    if not task_path:
        return

    try:
        import urllib.request
        import urllib.parse
        import json

        url = (
            "http://localhost:8000/api/sessions/poll"
            f"?appType=mari&taskPath={urllib.parse.quote(task_path)}"
        )
        with urllib.request.urlopen(url, timeout=0.2) as resp:
            data = json.loads(resp.read().decode())
            for cmd in data.get("commands", []):
                if cmd.get("command") == "load_usd":
                    fp = cmd.get("argument", "")
                    if fp and os.path.exists(fp):
                        _import_geometry(fp)
                        mari.app.log(f"[Studio Tools] Web Connection: Loaded {fp}")
    except Exception:
        pass  # Server may not be running — silence


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

if mari.app.isRunning():
    _MENU_PATH = "MainWindow/Studio &Tools"

    # Load USD Asset from Project
    mari.menus.addAction(
        mari.actions.create(
            "Load USD Asset from Project...",
            "import mari_studiotools_startup; mari_studiotools_startup.action_load_from_project()"
        ),
        _MENU_PATH
    )

    # Import from Clipboard (Copy Path workflow)
    mari.menus.addAction(
        mari.actions.create(
            "Import from Clipboard (Copy Path)...",
            "import mari_studiotools_startup; mari_studiotools_startup.action_import_from_clipboard()"
        ),
        _MENU_PATH
    )

    mari.menus.addSeparator(_MENU_PATH)

    # Pipeline Context
    mari.menus.addAction(
        mari.actions.create(
            "Pipeline Context",
            "import mari_studiotools_startup; mari_studiotools_startup.action_pipeline_context()"
        ),
        _MENU_PATH
    )

    # Register idle poll for web connection
    try:
        mari.utils.connect(mari.app.idle, _poll_web_connection)
        mari.app.log("[Studio Tools] Web Connection active and listening for load actions...")
    except Exception as _e:
        mari.app.log(f"[Studio Tools] Warning: Failed to register idle callback: {_e}")

    print("------------------------------------------------------------------")
    print("  [Studio Tools Pipeline] Ready in Mari!")
    print("------------------------------------------------------------------")
