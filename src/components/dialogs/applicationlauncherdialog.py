from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QComboBox, QLineEdit,
    QHBoxLayout, QPushButton, QTabWidget, QWidget, QScrollArea, QGridLayout
)

from ..types.app import *

class ApplicationLauncherDialog(QDialog):
    def __init__(self, context, file=None, parent=None):
        super().__init__(parent)
        
        self.setWindowTitle("Application Launcher")
        self.setModal(True)
        
        self.file = file
        self.context = context
    
        self._build_ui()
    
    def _build_ui(self):
        layout = QVBoxLayout()
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(False)
        
        self.container = QWidget()
        self.grid = QGridLayout(self.container)
        self.grid.setSpacing(8)
        
        self._populate_apps_grid()
    
        scroll.setWidget(self.container)
        layout.addWidget(scroll)
        
        self.setLayout(layout)
        
    def _populate_apps_grid(self):
        columns = 3
        for index, app in enumerate(getApplications(self.context.project, show_disabled=False)):
            row = index // columns
            col = index % columns
            appbox = AppBox(app, context=self.context, read_only=True, launch_file=self.file)
            appbox.closed.connect(self.close)
            
            if self.file is not None:
                ext = self.file.split(".")[-1]
                
                if ext not in app.extensions:
                    continue
                
            self.grid.addWidget(appbox, row, col)