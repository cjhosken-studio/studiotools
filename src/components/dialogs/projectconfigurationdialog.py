from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QComboBox, QLineEdit,
    QHBoxLayout, QPushButton, QTabWidget, QWidget, QScrollArea, QGridLayout, QFileDialog
)

from .customappdialog import CustomAppDialog
from ..types.app import *

class ProjectConfigurationDialog(QDialog):
    def __init__(self, context, parent=None):
        super().__init__(parent)
        
        self.context = context
        
        self.setWindowTitle("Project Configuration")
        self.setModal(True)
        self.resize(680, 420)
        
        self._build_ui()
        
    def _build_ui(self):
        layout = QVBoxLayout(self)
        
        self.tabs = QTabWidget()
        self.tabs.addTab(self._build_general_tab(), "General")
        self.tabs.addTab(self._build_apps_tab(), "Apps")
        self.tabs.addTab(self._build_archiving_tab(), "Archiving")
        
        layout.addWidget(self.tabs)
        
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()

        ok_btn = QPushButton("OK")
        ok_btn.clicked.connect(self.accept)

        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)

        btn_layout.addWidget(ok_btn)
        btn_layout.addWidget(cancel_btn)
        
        layout.addLayout(btn_layout)
        
    def _build_general_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        layout.addWidget(QLabel("General project settings go here."))
        layout.addStretch()
        
        return widget
    
    def _build_apps_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        add_button = QPushButton()
        add_button.setIcon(qta.icon("fa6s.plus"))
        add_button.clicked.connect(self._add_custom_app)
        layout.addWidget(add_button)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        
        self._apps_container = QWidget()
        self._apps_grid = QGridLayout(self._apps_container)
        self._apps_grid.setSpacing(8)
                    
        scroll.setWidget(self._apps_container)
        layout.addWidget(scroll)
        
        self._populate_apps_grid()
        
        return widget
    
    def _remove_custom_app(self, app):
        removeCustomApplication(self.context.project, app)
        self._populate_apps_grid
    
    def _add_custom_app(self):
        exe_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Application Executable",
            "",
            "Executables (*.exe);;All Files(*)" if sys.platform.startswith("win") else "All Files (*)"
        )
        
        if not exe_path:
            return
        
        exe_path = os.path.normpath(exe_path)
        if not os.path.isfile(exe_path):
            return
        
        dialog = CustomAppDialog(self, exe_path)
        if dialog.exec() == QDialog.Accepted:
            addCustomApplication(self.context.project, dialog.get_application())
            self._populate_apps_grid()
    
    def _populate_apps_grid(self):
        self._clear_layout(self._apps_grid)
        
        columns = 3
        apps = getApplications(self.context.project)
        for index, app in enumerate(apps):
            row = index // columns
            col = index % columns
            self._apps_grid.addWidget(AppBox(app, self.context, read_only=False), row, col)
        
    def _clear_layout(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
    
    def _build_archiving_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)   
        
        layout.addWidget(QLabel("Archiving and backup settings go here."))
        layout.addStretch()
        
        return widget