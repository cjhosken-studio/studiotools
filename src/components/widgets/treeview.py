from PySide6.QtWidgets import QWidget, QTreeView, QVBoxLayout, QFileSystemModel, QMenu, QMessageBox, QDialog
from PySide6.QtCore import QDir, QSortFilterProxyModel, Qt, Signal
from PySide6.QtGui import QIcon, QAction
from ..types.project import *
from ..types.context import Context
from ..dialogs.taskfolderdialog import TaskFolderDialog
from ..dialogs.projectconfigurationdialog import ProjectConfigurationDialog
import os
import platform
import subprocess

class FolderFilterProxy(QSortFilterProxyModel):
    def __init__(self, parent, root_path):
        super().__init__(parent)
        self.root_path = root_path
        
    def filterAcceptsRow(self, source_row, source_parent):
        model = self.sourceModel()
        index = model.index(source_row, 0, source_parent)
        
        current_path = model.filePath(index)
        current_parent = os.path.dirname(current_path)
        
        root_parent = os.path.dirname(self.root_path)
        
        if current_parent == root_parent:
            if current_path != self.root_path:
                return False

        return super(FolderFilterProxy, self).filterAcceptsRow(source_row, source_parent)

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

        if not os.path.exists(path):
            return super().hasChildren(parent)

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
    
    contextChanged = Signal(object)
    
    def __init__(self, context, parent=None):
        super().__init__(parent)
        self.context = context

        self._build_ui()

        self.setContext(context)

    def setContext(self, context):
        self.context = context

        project_path = self.context.project.path
        project_parent = os.path.dirname(project_path)
        
        self.model.setRootPath(QDir.rootPath())
        
        self.proxy.root_path = project_path
        
        root_index = self.model.index(project_parent)
        proxy_root_index = self.proxy.mapFromSource(root_index)
        self.tree.setRootIndex(proxy_root_index)
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
        self.model.setFilter(QDir.NoDotAndDotDot | QDir.AllDirs)

        self.proxy = FolderFilterProxy(self, root_path=self.context.project.path)
        self.proxy.setSourceModel(self.model)

        self.tree = QTreeView(self)
        self.tree.setModel(self.proxy)
        
        self.tree.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.tree.customContextMenuRequested.connect(self._show_context_menu)
        self.tree.selectionModel().currentChanged.connect(
            self._on_current_changed
        )

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
        
    def _show_context_menu(self, position):
        index = self.tree.indexAt(position)
        
        if not index.isValid():
            return
        
        source_index = self.proxy.mapToSource(index)
        file_path = self.model.filePath(source_index)
        
        folder_type, subtype = getTypeFromFolder(file_path)
        
        menu = QMenu(self)
        
        if folder_type == "project":
            action_configure = QAction("Configure Project", self)
            action_configure.triggered.connect(lambda: self._configure_project())
            menu.addAction(action_configure)

        if folder_type == "task":
            pass
        else:
            action_create = QAction("Create", self)
            action_create.triggered.connect(lambda: self._create(file_path))
            menu.addAction(action_create)
        
        action_open = QAction("Open in File Browser", self)
        action_open.triggered.connect(lambda: self._open(file_path))
        menu.addAction(action_open)
        
        action_delete = QAction("Delete", self)
        action_delete.triggered.connect(lambda: self._delete(file_path))
        menu.addAction(action_delete)
        
        menu.exec(self.tree.viewport().mapToGlobal(position))
        
    def _configure_project(self):
        dialog = ProjectConfigurationDialog(self.context.project)
        dialog.exec()
    
    def _open(self, file_path):
        os.startfile(file_path)
    
    def _create(self, file_path):
        parent_type, parent_subtype = getTypeFromFolder(file_path)
        
        dialog = TaskFolderDialog(parent_type, parent_subtype)
        
        if dialog.exec() == QDialog.Accepted:
            dialog_type, dialog_subtype, dialog_name = dialog.get_result()
            
            item = {
                "name": dialog_name,
                "type": dialog_type,
                "subtype": dialog_subtype
            }
            
            createFolder(file_path, item)
            
        self._refresh_view()
    
    def _delete(self, file_path):
        short_name = file_path.replace(self.context.project.path, self.context.project.name)
        # Implement deletion logic with confirmation
        reply = QMessageBox.question(
            self, 
            f"Delete",
            f"Are you sure you want to delete {short_name}?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            try:
                # Delete the folder and its contents
                import shutil
                shutil.rmtree(file_path)
                self._refresh_view()
                QMessageBox.information(self, "Deleted", f"{file_path.capitalize()} deleted successfully.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to delete: {str(e)}")
                
        self._refresh_view()
                
                
    def _on_current_changed(self, current, previous):
        if not current.isValid():
            return

        # Map proxy index → source index
        source_index = self.proxy.mapToSource(current)
        if not source_index.isValid():
            return

        path = self.model.filePath(source_index)
        if not os.path.isdir(path):
            return

        context = Context(self.context.project, path)

        self.contextChanged.emit(context)
                
    def _get_expanded_paths(self):
        expanded = []

        def recurse(parent_index):
            model = self.tree.model()
            for row in range(model.rowCount(parent_index)):
                index = model.index(row, 0, parent_index)
                if self.tree.isExpanded(index):
                    source = self.proxy.mapToSource(index)
                    expanded.append(self.model.filePath(source))
                    recurse(index)

        recurse(self.tree.rootIndex())
        return expanded
    
    def _restore_expanded_paths(self, paths):
        model = self.tree.model()

        def recurse(parent_index):
            for row in range(model.rowCount(parent_index)):
                index = model.index(row, 0, parent_index)
                source = self.proxy.mapToSource(index)
                path = self.model.filePath(source)

                if path in paths:
                    self.tree.expand(index)
                    recurse(index)

        recurse(self.tree.rootIndex())
        
        
    def _refresh_view(self):
        expanded_paths = self._get_expanded_paths()
        
        self.proxy.invalidate()
        
        self._restore_expanded_paths(expanded_paths)

                
            
    
            
