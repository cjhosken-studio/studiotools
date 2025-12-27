from PySide6.QtWidgets import QWidget, QListView, QVBoxLayout, QHBoxLayout, QPushButton, QMenu, QApplication, QAbstractItemView
from PySide6.QtGui import QStandardItemModel, QStandardItem
from PySide6.QtCore import Qt
import os
import subprocess
import shutil
from ..types.project import *
from ..dialogs.applicationlauncherdialog import ApplicationLauncherDialog
from ..types.app import *
from ..types.asset import *

class ListView(QWidget):
    def __init__(self, context):
        super().__init__()
        self.context = context

        self._build_ui()
        self.refresh(context)

    def _build_ui(self):
        layout = QVBoxLayout(self)

        self.header, _ = self._build_header()
        layout.addWidget(self.header)

        self.view = QListView(self)
        self.model = QStandardItemModel(self)

        self.view.setModel(self.model)

        layout.addWidget(self.view)
        
        self.view.clicked.connect(self._on_item_clicked)
        self.view.setContextMenuPolicy(Qt.CustomContextMenu)
        self.view.customContextMenuRequested.connect(self._show_context_menu)
        self.view.setEditTriggers(QAbstractItemView.NoEditTriggers)
        
    def _on_item_clicked(self, item):
        pass
    
    def _show_context_menu(self, pos):
        pass
        
    def _build_header(self):
        widget = QWidget()
        layout = QHBoxLayout()
    
        refresh_button = QPushButton("Refresh")
        refresh_button.clicked.connect(lambda: self.refresh(self.context))
        layout.addWidget(refresh_button)
        
        widget.setLayout(layout)
    
        return widget, layout

    def refresh(self, context):
        self.context = context
        self.model.clear()

        cwd = self.context.cwd
        wip = os.path.join(cwd, "wip")
        
        if os.path.exists(wip):
            for appfolder in sorted(os.listdir(wip)):
                join_appfolder = os.path.join(wip, appfolder)
                if os.path.isdir(join_appfolder):
                    for appfile in sorted(os.listdir(join_appfolder)):
                        full_path = os.path.join(join_appfolder, appfile)

                        if not self.acceptPath(full_path):
                            continue

                        item = self.buildItem(full_path)
                        if item:
                            self.model.appendRow(item)


    def acceptPath(self, path):
        return True
    
    def buildItem(self, path):
        return QStandardItem(os.path.basename(path))

class TaskListView(ListView):
    
    def refresh(self, context):
        super().refresh(context)
        
        cwd_type, cwd_subtype = getTypeFromFolder(context.cwd)
        
        self.setVisible(cwd_type == "task")
        
    def _build_header(self):
        widget, layout = super()._build_header()
        
        self.create_button = QPushButton("Create +")
        self.create_button.clicked.connect(lambda: self._launch_app(file=None))
        
        layout.addWidget(self.create_button)
        
        
        return widget, layout
    
    def _show_context_menu(self, pos):
        index = self.view.indexAt(pos)
        if not index.isValid():
            return

        path = index.data(Qt.UserRole)
        if not path:
            return

        menu = QMenu(self)

        open_action = menu.addAction("Open")
        menu.addSeparator()
        delete_action = menu.addAction("Delete")

        action = menu.exec_(self.view.viewport().mapToGlobal(pos))

        if action == open_action:
            self._launch_app(path)
        elif action == delete_action:
            self._delete_asset(path)
    
    
    def _launch_app(self, file=None):
        dialog = ApplicationLauncherDialog(self.context, file)
        dialog.exec()
            
    def acceptPath(self, path):
        return isTaskFile(path)
        
    def buildItem(self, path: str):
        name = os.path.basename(path)
        item = QStandardItem(name)

        type, subtype = getTypeFromFolder(path)
        item.setIcon(getIconFromExtension(path))
        item.setData(path, role=Qt.UserRole)

        return item

class AssetListView(ListView):
    selected = Signal(object)
    
    def _post_build(self):
        self.view.clicked.connect(self._on_item_clicked)
        self.view.setContextMenuPolicy(Qt.CustomContextMenu)
        self.view.customContextMenuRequested.connect(self._show_context_menu)
    
    def refresh(self, context):
        self.context = context
        self.model.clear()
        
        cwd = self.context.cwd
        
        for dirpath, dirnames, filenames in os.walk(cwd):
            # Only process directories named exactly "versions"
            if os.path.basename(dirpath) != "versions":
                continue

            for versionfolder in sorted(dirnames):
                full_path = os.path.join(dirpath, versionfolder)

                if not self.acceptPath(full_path):
                    continue

                item = self.buildItem(full_path)
                if item:
                    self.model.appendRow(item)
    
    def acceptPath(self, path: str):
        metadata = os.path.join(path, "metadata.yaml")
        
        return os.path.exists(metadata)

    def buildItem(self, path: str):
        name = os.path.basename(path)
        item = QStandardItem(name)

        metadata = os.path.join(path, "metadata.yaml")
        with open(metadata, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        
        asset_type = data.get("type", None)
        asset_root = data.get("root", "")

        base_icon = getIconFromAssetType(asset_type)

        # Detect Houdini-only USD
        if asset_root.endswith(".usdnc"):
            item.setIcon(overlay_warning_icon(base_icon))
            item.setToolTip(
                "This file was exported from Houdini as a .usdnc.\n"
                "It will only load into Houdini sessions."
            )
        else:
            item.setIcon(base_icon)

        item.setData(path, role=Qt.UserRole)

        return item
    
    def _on_item_clicked(self, index):
        path = index.data(Qt.ItemDataRole.UserRole)
        if path:
            self.selected.emit(getAssetFromMetadata(os.path.join(path, "metadata.yaml")))
            
    def _show_context_menu(self, pos):
        index = self.view.indexAt(pos)
        if not index.isValid():
            return

        path = index.data(Qt.UserRole)
        if not path:
            return

        menu = QMenu(self)

        asset = getAssetFromMetadata(os.path.join(path, "metadata.yaml"))
    
        if asset.root.endswith(".usd"):
            usdview_action = menu.addAction("Open in USDView")
            
        open_action = menu.addAction("Open in File Browser")
            
        copy_path_action = menu.addAction("Copy Asset Path")
        publish_action = menu.addAction("Set as Published")
        
        menu.addSeparator()
        delete_action = menu.addAction("Delete")

        action = menu.exec_(self.view.viewport().mapToGlobal(pos))

        if action == publish_action:
            self._publish_asset(path)
        elif action == delete_action:
            self._delete_asset(path)
        elif action == copy_path_action:
            self._copy_path(path)
        elif action == open_action:
            self._open_path(path)
        
        if asset.root.endswith(".usd"):
            if action == usdview_action:
                self._open_usdview(path)    
        
    def _open_path(self, path):
        os.startfile(path)
        
    def _open_usdview(self, path):
        current_file = __file__
        app_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
        usd_dir = os.path.join(app_root, "plugins", "usd", "install")
        
        usdview_exe = os.path.join(usd_dir, "bin", "usdview")
        
        if sys.platform.startswith("win"):
            usdview_exe += ".cmd"
        
        asset = getAssetFromMetadata(os.path.join(path, "metadata.yaml"))
        
        subprocess.Popen([usdview_exe, asset.root]) 
            
            
    def _copy_path(self, path):
        clipboard = QApplication.clipboard()
        clipboard.setText(path)
            
    def _publish_asset(self, path):
        pass
            
    def _delete_asset(self, path):
        shutil.rmtree(path)
        self.refresh(self.context)