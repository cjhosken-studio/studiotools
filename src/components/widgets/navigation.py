from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QComboBox,
    QLineEdit,
    QToolButton,
    QFileDialog,
)
from PySide6.QtCore import Signal
from PySide6.QtGui import QIcon
from pathlib import Path

from ..types.context import *
from ..types.project import *

class NavigationBar(QWidget):

    contextChanged = Signal(object)
    projectListChanged = Signal(list)

    def __init__(self, context : Context, project_list, parent=None):
        super().__init__(parent)

        self.context = context
        self.project_list = project_list

        self._setup_ui()
        self._sync_from_context()
        

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        self.project_select = QComboBox()
        self.project_select.currentIndexChanged.connect(self._on_project_changed)
        layout.addWidget(self.project_select)

        cwd_layout = QHBoxLayout()

        self.search_button = QToolButton()
        self.search_button.setIcon(QIcon.fromTheme("folder-open"))
        self.search_button.clicked.connect(self._choose_cwd)

        self.cwd_input = QLineEdit()
        self.cwd_input.setPlaceholderText("Current Working Directory")
        self.cwd_input.editingFinished.connect(self._on_cwd_changed)

        self.create_button = QToolButton()
        self.create_button.setIcon(QIcon.fromTheme("list-add"))
        self.create_button.clicked.connect(self._create_project)

        cwd_layout.addWidget(self.search_button)
        cwd_layout.addWidget(self.cwd_input)
        cwd_layout.addWidget(self.create_button)

        layout.addLayout(cwd_layout)
        

    def _sync_from_context(self):
        self.cwd_input.setText(self.context.cwd)

        self.project_select.blockSignals(True)
        self.project_select.clear()

        for project in self.project_list:
            self.project_select.addItem(project.name, project.path)

        self.project_select.setCurrentIndex(
            self.project_select.findData(self.context.project.path)
        )

        self.project_select.blockSignals(False)

    def _on_project_changed(self):
        path = self.project_select.currentData()
        
        project = getProjectFromCwd(path)

        if project:
            self.context = Context(project, project.path)
            self.contextChanged.emit(self.context)

        self._sync_from_context()

    def _on_cwd_changed(self):
        cwd = self.cwd_input.text().strip()

        if not cwd:
            return
        
        if isValidCwd(cwd):
            project = getProjectFromCwd(cwd)
            self.context = Context(project, cwd)

        self._sync_from_context()

    def _choose_cwd(self):
        directory = QFileDialog.getExistingDirectory(
            self,
            "Select Working Directory",
            str(Path.home())
        )

        if not directory:
            return
        
        if isValidCwd(directory):
            project = getProjectFromCwd(directory)
            self.context = Context(project, project.path)
            self.contextChanged.emit(self.context)
            self._update_project_list(project)
            self._sync_from_context()

    def _create_project(self):
        path, _ = QFileDialog.getSaveFileName(
            self,
            "Create project",
            str(Path.home())
        )

        if not path:
            return
            
        project = createProject(path)
        self.context = Context(project, project.path)
        self._update_project_list(project)
        self.contextChanged.emit(self.context)
        self._sync_from_context()

    def _update_project_list(self, project):
        self.project_list = [
            project,
            *[p for p in self.project_list if p.path != project.path],
        ]
        self.projectListChanged.emit(self.project_list)
        self._sync_from_context()

    