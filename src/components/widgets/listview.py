from PySide6.QtWidgets import QWidget, QListView, QVBoxLayout
from PySide6.QtGui import QStandardItemModel, QStandardItem
from PySide6.QtCore import Qt
import os
from ..types.project import *


class ListView(QWidget):
    def __init__(self, context):
        super().__init__()
        self.context = context

        self._build_ui()
        self.refresh(context)

    def _build_ui(self):
        layout = QVBoxLayout(self)

        self.view = QListView(self)
        self.model = QStandardItemModel(self)

        self.view.setModel(self.model)

        layout.addWidget(self.view)

    def refresh(self, context):
        self.context = context
        self.model.clear()

        cwd = self.context.cwd
        if not cwd or not os.path.isdir(cwd):
            return
        
        for entry in sorted(os.listdir(cwd)):
            full_path = os.path.join(cwd, entry)

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
    def acceptPath(self, path):
        if not os.path.isdir(path):
            return False
            
        type, _ = getTypeFromFolder(path)
        return type == "task"
        
    def buildItem(self, path: str):
        name = os.path.basename(path)
        item = QStandardItem(name)

        type, subtype = getTypeFromFolder(path)
        item.setIcon(getIconFromTypes(type, subtype))
        item.setData(path, role=Qt.UserRole)

        return item

class AssetListView(ListView):
    def acceptPath(self, path: str):
        return os.path.isfile(path)

    def buildItem(self, path: str):
        name = os.path.basename(path)
        item = QStandardItem(name)

        item.setIcon(QIcon.fromTheme("document"))
        item.setData(path, role=Qt.UserRole)

        return item