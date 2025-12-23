from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QComboBox, QLineEdit,
    QHBoxLayout, QPushButton, QTabWidget, QWidget
)

class ProjectConfigurationDialog(QDialog):
    def __init__(self, project, parent=None):
        super().__init__(parent)
        
        self.project = project
        
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
        
        layout.addWidget(QLabel("App configuration goes here."))
        layout.addStretch()
        
        return widget
    
    def _build_archiving_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)   
        
        layout.addWidget(QLabel("Archiving and backup settings go here."))
        layout.addStretch()
        
        return widget