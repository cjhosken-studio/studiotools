from PySide6.QtWidgets import QWidget, QTreeView, QVBoxLayout, QFileSystemModel
from PySide6.QtCore import QDir, QSortFilterProxyModel, Qt
from PySide6.QtGui import QIcon
from ..types.project import *
import os

class FolderFilterProxy(QSortFilterProxyModel):
    def __init__(self, parent=None, root_path=""):
        super().__init__(parent)

        self.root_path = root_path

    def filterAcceptsRow(self, source_row, source_parent):
        model = self.sourceModel()
        index = model.index(source_row, 0, source_parent)

        if not model.isDir(index):
            return False
        
        path = model.filePath(index)
        
        return path in self.root_path or self.root_path in path
    
    def data(self, index, role):
        if role == Qt.ItemDataRole.DecorationRole:
            source_index = self.mapToSource(index)
            model = self.sourceModel()

            path = model.filePath(source_index)

            type, subtype = getTypeFromFolder(path)

            return getIconFromTypes(type, subtype)
            
        return super().data(index, role)
    
    def hasChildren(self, parent):
        source_index = self.mapToSource(parent)
        model = self.sourceModel()

        path = model.filePath(source_index)

        type, subtype = getTypeFromFolder(path)

        if type == "task":
            return False
        
        if not any(
            os.path.isdir(os.path.join(path, entry))
            for entry in os.listdir(path)
        ):
            return False
        
        return super().hasChildren(parent)

class TreeView(QWidget):
    def __init__(self, context, parent=None):
        super().__init__(parent)
        self.context = context

        self._build_ui()

        self.setContext(context)


    def setContext(self, context):
        self.context = context

        project_path = context.project.path
        project_dir = os.path.dirname(project_path)

        self.proxy.root_path = project_path
        self.model.setRootPath(project_dir)

        source_root = self.model.index(project_dir)
        proxy_root = self.proxy.mapFromSource(source_root)

        self.tree.setRootIndex(proxy_root)
        self.proxy.invalidateFilter()

        self.expandFirstFolder()

    def expandFirstFolder(self):
        model = self.tree.model()
        root = self.tree.rootIndex()

        if not root.isValid():
            return

        if model.rowCount(root) == 0:
            return

        first_child = model.index(0, 0, root)

        if first_child.isValid():
            self.tree.expand(first_child)

    def _build_ui(self):
        layout = QVBoxLayout(self)

        self.model = QFileSystemModel(self)
        self.model.setRootPath(os.path.dirname(self.context.project.path))

        # Show folders only (optional but typical for project trees)
        self.model.setFilter(QDir.NoDotAndDotDot | QDir.AllDirs)

        self.proxy = FolderFilterProxy(self, self.context.project.path)
        self.proxy.setSourceModel(self.model)

        self.tree = QTreeView(self)
        self.tree.setModel(self.proxy)

        source_root = self.model.index(os.path.dirname(self.context.project.path))
        proxy_root = self.proxy.mapFromSource(source_root)
        self.tree.setRootIndex(proxy_root)

        # UI/UX refinements
        self.tree.setHeaderHidden(True)
        self.tree.setAnimated(True)
        self.tree.setIndentation(20)
        self.tree.setSortingEnabled(True)

        # Hide unnecessary columns (size, type, date)
        for column in range(1, self.model.columnCount()):
            self.tree.hideColumn(column)

        layout.addWidget(self.tree)
        self.setLayout(layout)
