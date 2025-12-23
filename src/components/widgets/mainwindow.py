from PySide6.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QLabel
)
from PySide6.QtCore import Qt
from ..types.settings import *
from .navigation import NavigationBar
from .treeview import TreeView
from .listview import TaskListView, AssetListView

class MainWindow(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)

        self.context = loadContext()
        self.project_list = loadProjectList()

        self._setup_window()
        self._setup_ui()

    def _setup_window(self):
        self.setWindowTitle("Studio Tools")
        self.resize(1280, 720)

    def _setup_ui(self):
        central_widget = QWidget(self)
        layout = QVBoxLayout(central_widget)
        
        self.nav = NavigationBar(self.context, self.project_list)
        self.nav.setFixedHeight(280)

        self.nav.contextChanged.connect(self._on_context_changed)
        self.nav.projectListChanged.connect(self._on_project_list_changed)

        layout.addWidget(self.nav)

        main_widget = QWidget(self)
        main_layout = QHBoxLayout(main_widget)

        self.tree_view = TreeView(self.context)
        main_layout.addWidget(self.tree_view)
        
        list_widget = QWidget(self)
        list_layout = QVBoxLayout(list_widget)

        self.task_list_view = TaskListView(self.context)
        self.asset_list_view = AssetListView(self.context)

        list_layout.addWidget(self.task_list_view)
        list_layout.addWidget(self.asset_list_view)

        main_layout.addWidget(list_widget)

        layout.addWidget(main_widget)

        self.setCentralWidget(central_widget)

    def _on_context_changed(self, context):
        self.context = context
        self.tree_view.setContext(self.context)
        self.task_list_view.refresh(self.context)
        self.asset_list_view.refresh(self.context)
        self.save_state()

    def _on_project_list_changed(self, project_list):
        self.project_list = project_list
        self.save_state()

    def save_state(self):
        saveContext(self.context)
        saveProjectList(self.project_list)