from PySide6.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QLabel
)
from PySide6.QtCore import Qt
from ..types.settings import *
from .navigation import NavigationBar

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

        self.setCentralWidget(central_widget)

    def _on_context_changed(self, context):
        self.context = context
        self.save_state()

    def _on_project_list_changed(self, project_list):
        self.project_list = project_list
        self.save_state()

    def save_state(self):
        saveContext(self.context)
        saveProjectList(self.project_list)