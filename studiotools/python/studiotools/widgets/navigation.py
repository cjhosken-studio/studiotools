from PySide6.QtWidgets import QFileDialog, QInputDialog, QDockWidget, QWidget, QHBoxLayout, QLineEdit, QSizePolicy, QComboBox, QPushButton
import os
import pathlib
from data.context import Context
from data.project import get_project_from_cwd, get_project, get_projects, create_project, Project


class NavigationWidget(QWidget):
    # we pass context as a [] so that it can be passed as reference
    def __init__(self, context=[]):
        super().__init__()
        self._context = context
        self._projects = []
        self.setup_ui()
        self.refresh()

    def setup_ui(self):
        layout = QHBoxLayout()
        layout.setContentsMargins(5, 5, 5, 5)
        layout.setSpacing(10)

        self.project_list = QComboBox()
        self.project_list.currentIndexChanged.connect(self.set_project)
        layout.addWidget(self.project_list)

        self.cwd_input = QLineEdit()
        self.cwd_input.setPlaceholderText("Enter Path...")
        self.cwd_input.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.cwd_input.returnPressed.connect(self.update_cwd)
        layout.addWidget(self.cwd_input)

        self.set_cwd_button = QPushButton("Set Current Working Directory")
        self.set_cwd_button.clicked.connect(self.set_cwd)
        layout.addWidget(self.set_cwd_button)
    
        self.create_project_button = QPushButton("Create New Project")
        self.create_project_button.clicked.connect(self.create_project)
        layout.addWidget(self.create_project_button)

        self.setLayout(layout)

    def set_context(self, context=[]):
        self._context = context
        self.refresh()

    def context(self):
        return self._context
    
    def update_cwd(self):
        cwd = self.cwd_input.text()

        project = get_project_from_cwd(cwd)
        if project.path():
            self._context[0].set_cwd(cwd)
            self.refresh()
    
    def set_cwd(self):
        cwd = QFileDialog.getExistingDirectory(
            self,
            "Select Project",
            os.path.join(pathlib.Path.home(), "projects")
        )

        if cwd:
            self.cwd_input.setText(cwd)
            self.update_cwd()

    def set_project(self):
        current_project_name = self.project_list.currentText()

        project = Project()

        for listed_project in self._projects:
            if listed_project.name() == current_project_name:
                project = get_project(listed_project.path())

        if project.exists():
            self._context[0].set_project(project)
            self.refresh()

    def create_project(self):
        project_name, ok = QInputDialog.getText(
            self,
            "Create New Project",
            "Project Name:",
            QLineEdit.EchoMode.Normal
        )
        
        if ok and project_name:
            project_path = os.path.join(pathlib.Path.home(), "projects", project_name)
            project = create_project(project_path)
            self._context[0].set_project(project)
            self.refresh()


    def refresh(self):
        self._projects = get_projects()

        self.cwd_input.setText(self._context[0].cwd())

        self.project_list.currentIndexChanged.disconnect(self.set_project)
        self.project_list.clear()
        self.project_list.addItems([project.name() for project in self._projects])
        self.project_list.setCurrentText(self._context[0].project().name())
        self.project_list.currentIndexChanged.connect(self.set_project)
        