from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QGroupBox,
    QScrollArea, QGridLayout, QFrame, QCheckBox, QComboBox, QPushButton, QLineEdit, QHBoxLayout, QFileDialog
)
from PySide6.QtGui import QIcon, QPixmap
from PySide6.QtCore import Qt, Signal
import os
import yaml
import glob
import sys
import subprocess
from .version import *
from .context import *
from .project import *
import qtawesome as qta

class Application():
    def __init__(self, name="", executable="", icon=None, app_type="", extensions=[], preload="", enabled=True, custom=False):
        self.name = name
        self.executable = executable
        self.icon = icon
        self.app_type = app_type
        self.extensions = extensions
        
        self.preload = preload
        self.enabled = enabled
        self.custom = custom
        
        self.launch_file = None
        
    def setLaunchFile(self, file):
        self.launch_file = file
    

class AppBox(QFrame):
    closed = Signal()
    deleted = Signal(object)
    
    def __init__(self, app: Application, context, read_only=False, launch_file=None, parent=None):
        super().__init__(parent)
        self.app = app
        self.context = context
        self.read_only = read_only
        self.launch_file = launch_file

        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setFrameShadow(QFrame.Shadow.Raised)

        self.setMinimumWidth(160)

        layout = QVBoxLayout(self)
        layout.setSpacing(4)
        
        if app.custom and not read_only:
            self.remove = QPushButton("x")
            self.remove.clicked.connect(self._remove_app)
            layout.addWidget(self.remove)
            

        name_label = QLabel(app.name)
        name_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(name_label)
        
        self.icon_label = QLabel()
        self.icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        if app.icon and os.path.isfile(app.icon):
            icon = QIcon(app.icon)
            pixmap = icon.pixmap(48, 48)
            self.icon_label.setPixmap(pixmap)
            
        layout.addWidget(self.icon_label)
        
        if app.custom and not self.read_only:
            self.app_type_combo = QComboBox()
            self.app_type_combo.addItems(["blender", "houdini", "nuke", "custom"])
            self.app_type_combo.setCurrentText(self.app.app_type)
            self.app_type_combo.currentIndexChanged.connect(self._on_app_type_changed)
            layout.addWidget(self.app_type_combo)
            
            self.extensions_input = QLineEdit()
            self.extensions_input.setPlaceholderText("hip hipnc blend nk")
            
            ext_text = ""
            for ext in self.app.extensions:
                ext_text += f"{ext} " 
            
            self.extensions_input.setText(ext_text)
            layout.addWidget(self.extensions_input)
            
            self.preload_label = QLabel("Preload Script:")
            self.preload_input = QLineEdit()
            self.preload_input.setText(self.app.preload)
            self.preload_btn = QPushButton("Browse…")
            self.preload_btn.clicked.connect(self._choose_preload)

            preload_row = QHBoxLayout()
            preload_row.addWidget(self.preload_input)
            preload_row.addWidget(self.preload_btn)
            
            layout.addWidget(self.preload_label)
            layout.addLayout(preload_row)
            

        if not read_only:
            self.enabled_checkbox = QCheckBox("Enabled")
            self.enabled_checkbox.setChecked(app.enabled)
            self.enabled_checkbox.toggled.connect(self._on_enabled_changed)
            layout.addWidget(self.enabled_checkbox)
        else:
            self.setCursor(Qt.CursorShape.PointingHandCursor)

        layout.addStretch()
        
    def _remove_app(self):
        self.deleted.emit(self.app)
        
    def _on_app_type_changed(self):
        app_type = self.app_type_combo.currentText()
        self.app.app_type = app_type
        
        is_visible = app_type == "custom"
        
        self.preload_label.setVisible(is_visible)
        self.preload_input.setVisible(is_visible)
        self.preload_btn.setVisible(is_visible)
        
        self.extensions_input.setVisible(is_visible)
        
        setAppTypeConfig(self.context.project, self.app.name, self.app.app_type)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            if self.read_only:
                self._launch_application()
                self.closed.emit()
        
        return super().mousePressEvent(event)

    def _choose_icon(self):
        path = choose_icon(self)

        if not path or not os.path.isfile(path):
            return

        self.app.icon = path
        pixmap = QPixmap(path).scaled(
            48, 48,
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation
        )
        self.icon_label.setPixmap(pixmap)

    def _choose_preload(self):
        path = choose_preload(self)
        if path:
            self.preload_input.setText(path)

    def _launch_application(self):
        exe = self.app.executable
    
        
        wip_dir = os.path.join(self.context.cwd, "wip")
    
        version = get_latest_task_vesion(self.context.cwd)
                
        file_name = f"scene_{format_version(version)}.{self.app.extensions[0]}"
        
        os.makedirs(wip_dir, exist_ok=True)
        
        app_dir = os.path.join(wip_dir, self.app.app_type)
        
        os.makedirs(app_dir, exist_ok=True)
        
        env = os.environ.copy()
        
        env["ST_PROJECT"] = self.context.project.path
        env["ST_TASK"] = os.path.basename(self.context.cwd)
        env["ST_TASKAREA"] = os.path.basename(os.path.dirname(self.context.cwd))
        env["ST_CWD"] = self.context.cwd
        
        if not exe or not os.path.isfile(exe):
            return
        
        if self.launch_file is None:
            self.launch_file = os.path.join(app_dir, file_name)
        
        if self.app.preload:
            command = [self.app.preload, self.app.executable, self.launch_file]
        else:
            command = [self.app.executable, self.launch_file]
        
        try:
            subprocess.Popen(
                command, 
                env=env,
                shell=False
            )
        except Exception as e:
            print(f"Failed to launch {exe}: {e}")

    def _on_enabled_changed(self, state):
        self.app.enabled = state
        
        if self.read_only:
            self.setVisible(self.app.enabled)
        else:
            setAppEnabledConfig(self.context.project, self.app.name, self.app.enabled)
            self.enabled_checkbox.setChecked(self.app.enabled)
        
def choose_icon(parent):
    path, _ = QFileDialog.getOpenFileName(
            parent,
            "Select Icon",
            "",
            "Images (*.png *.jpg *.jpeg *.svg);;All Files (*)"
    )

    return path
        
def choose_preload(parent):
    path, _ = QFileDialog.getOpenFileName(
            parent,
            "Select Preload Script",
            "",
            "Scripts (*.sh *.bash *.py);;All Files (*)"
    )

    return path
        
def getApplications(project, show_disabled=True):
    applications = []
    
    applications += getDefaultApplications(project)
    applications += getCustomApplications(project)
    
    apps_config = os.path.join(project.path, "apps.yaml")
    if not os.path.isfile(apps_config):
        return applications

    with open(apps_config, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
                
        app_list = data.get("app_list", {})
                
    for app in applications[:]:
        if app.name in app_list:
            app.enabled=app_list[app.name].get("enabled", False)
            
            app_type = app_list[app.name].get("app_type", None)
            if app_type is not None:
                app.app_type = app_type
            
            if not show_disabled and not app.enabled:
                applications.remove(app)
                
    return applications
                
def getDefaultApplications(project):
    applications = []
    if sys.platform.startswith("win"):
        applications.extend(_get_windows_apps())
    elif sys.platform.startswith("linux"):
        applications.extend(_get_linux_apps())
        
    return applications

def _get_windows_apps():
    apps = []
    current_file = __file__
    app_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    icons_dir = os.path.join(app_root, "public", "icons")
    plugins_dir = os.path.join(app_root, "plugins") 
    
    # Houdini
    sidefx_root = r"C:\Program Files\Side Effects Software"
    if os.path.isdir(sidefx_root):
        for path in sorted(glob.glob(os.path.join(sidefx_root, "Houdini*"))):
            exe = os.path.join(path, "bin", "houdini.exe")
            if os.path.isfile(exe):
                apps.append(Application(
                    name=os.path.basename(path),
                    executable=exe,
                    icon=os.path.join(icons_dir, "houdini.png"),
                    app_type="houdini",
                    preload=os.path.join(plugins_dir, "houdini_studiotools", "preload.bat"),
                    extensions=["hip", "hipnc"]
                ))

    # Blender
    blender_roots = [
        r"C:\Program Files\Blender Foundation",
        r"C:\Program Files"
    ]

    for root in blender_roots:
        for path in glob.glob(os.path.join(root, "Blender*")):
            exe = os.path.join(path, "blender.exe")
            folder_name = os.path.basename(path)
            if os.path.isfile(exe):
                apps.append(Application(
                    name=folder_name,
                    executable=exe,
                    app_type="blender",
                    icon=os.path.join(icons_dir, "blender.png"),
                    preload=os.path.join(plugins_dir, "blender_studiotools", "preload.bat"),
                    extensions=["blend"]
                ))

    # Nuke
    foundry_root = r"C:\Program Files"
    for path in glob.glob(os.path.join(foundry_root, "Nuke*")):
        exe = os.path.join(path, "Nuke*.exe")
        matches = glob.glob(exe)
        if matches:
            apps.append(Application(
                name=os.path.basename(path),
                executable=matches[0],
                app_type="nuke",
                icon=os.path.join(icons_dir, "nuke.png"),
                preload=os.path.join(plugins_dir, "nuke_studiotools", "preload.bat"),
                extensions=["nk"]
            ))

    return apps


def _get_linux_apps():
    apps = []
    current_file = __file__
    icons_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(current_file))), "public", "icons")

    # Houdini
    for path in sorted(glob.glob("/opt/hfs*")):
        exe = os.path.join(path, "bin", "houdini")
        if os.path.isfile(exe):
            apps.append(Application(
                name=os.path.basename(path),
                executable=exe,
                app_type="houdini",
                icon=os.path.join(icons_dir, "houdini.png"),
                extensions=["hip", "hipnc"]
            ))

    # Blender
    blender_paths = [
        "/usr/bin/blender",
        "/snap/bin/blender"
    ]

    for exe in blender_paths:
        if os.path.isfile(exe):
            apps.append(Application(
                name="Blender",
                executable=exe,
                app_type="blender",
                icon=os.path.join(icons_dir, "blender.png"),
                extensions=["blend"]
            ))

    # Nuke
    for path in sorted(glob.glob("/usr/local/Nuke*")) + sorted(glob.glob("/opt/Nuke*")):
        exe = os.path.join(path, "Nuke*")
        matches = glob.glob(exe)
        if matches:
            apps.append(Application(
                name=os.path.basename(path),
                executable=matches[0],
                app_type="nuke",
                icon=os.path.join(icons_dir, "nuke.png"),
                extensions=["nk"]
            ))

    return apps


def getCustomApplications(project):
    apps_config = os.path.join(project.path, "apps.yaml")
    
    if not os.path.isfile(apps_config):
        return []
    
    with open(apps_config, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    app_list = data.get("app_list", {})
    applications = []
    
    for app_name, app in app_list.items():
        if not app.get("executable"):
            continue
            
        new_app = Application(
            name=app_name,
            executable=app.get("executable", ""),
            icon=app.get("icon", ""),
            app_type=app.get("app_type", ""),
            preload=app.get("preload", ""),
            extensions=app.get("extension", []),
            enabled=app.get("enabled", False),
            custom=app.get("iscustom", False)
        )
                
        applications.append(new_app)
    
    return applications


def isTaskFile(path: str) -> bool:
    apps = getApplications(getProjectFromCwd(os.path.dirname(path)))

    ext = os.path.splitext(path)[-1]
    if not ext:
        return False

    ext = ext.lower().lstrip(".")

    for app in apps:
        if ext in app.extensions:
            return True

    return False


def getIconFromExtension(path: str):
    apps = getApplications(getProjectFromCwd(os.path.dirname(path)))
    
    ext = os.path.splitext(path)[-1]
    if not ext:
        return False
    
    ext = ext.lower().lstrip(".")
    
    for app in apps:
        if ext in app.extensions:
            return QIcon(app.icon)
        
    return qta.icon("qt6s.circle-question")
        

def setAppEnabledConfig(project, app_name: str, is_enabled: bool):
    apps_config = os.path.join(project.path, "apps.yaml")

    # Load existing config (if any)
    if os.path.isfile(apps_config):
        with open(apps_config, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    else:
        data = {}

    # Ensure structure exists
    app_list = data.setdefault("app_list", {})

    # Update / add app entry
    app_entry = app_list.setdefault(app_name, {})
    app_entry["enabled"] = bool(is_enabled)

    # Write back
    with open(apps_config, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            default_flow_style=False,
            sort_keys=True
        )
        
def setAppTypeConfig(project, app_name, app_type):
    apps_config = os.path.join(project.path, "apps.yaml")

    # Load existing config (if any)
    if os.path.isfile(apps_config):
        with open(apps_config, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    else:
        data = {}

    # Ensure structure exists
    app_list = data.setdefault("app_list", {})

    # Update / add app entry
    app_entry = app_list.setdefault(app_name, {})
    app_entry["app_type"] = app_type 

    # Write back
    with open(apps_config, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            default_flow_style=False,
            sort_keys=True
        )
        
def addCustomApplication(project, application):
    apps_config = os.path.join(project.path, "apps.yaml")

    # Load existing config (if any)
    if os.path.isfile(apps_config):
        with open(apps_config, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    else:
        data = {}

    # Ensure structure exists
    app_list = data.setdefault("app_list", {})

    # Update / add app entry
    app_entry = app_list.setdefault(application.name, {})
    app_entry["executable"] = application.executable
    app_entry["icon"] = application.icon
    app_entry["app_type"] = application.app_type
    app_entry["preload"] = application.preload
    app_entry["extensions"] = application.extensions
    app_entry["enabled"] = application.enabled
    app_entry["iscustom"] = True

    # Write back
    with open(apps_config, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            default_flow_style=False,
            sort_keys=True
        )
        
def removeCustomApplication(project, app):
    apps_config = os.path.join(project.path, "apps.yaml")

    # Load existing config (if any)
    if os.path.isfile(apps_config):
        with open(apps_config, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    else:
        data = {}

    # Ensure structure exists
    app_list = data.setdefault("app_list", {})

    del app_list[app.name]

    # Write back
    with open(apps_config, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            default_flow_style=False,
            sort_keys=True
        )