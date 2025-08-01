from PySide6.QtWidgets import QMainWindow
from PySide6.QtGui import QAction

import os

class STMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.resize(1280, 720)
        self.load_envs()
        self.create_menu_bar()
    
    def load_envs(self):
        self.use_local_packages = bool(int(os.environ.get("ST_USE_LOCAL_PACKAGES", "0")))

    def create_menu_bar(self):
        menubar = self.menuBar()

        self.developer_menu = menubar.addMenu("&Developer")
        self.local_packages_action = QAction("Use Local Packages")
        self.local_packages_action.setCheckable(True)
        self.local_packages_action.setChecked(self.use_local_packages)
        self.local_packages_action.triggered.connect(self.toggle_local_packages)
        self.developer_menu.addAction(self.local_packages_action)

    def toggle_local_packages(self, checked):
        self.use_local_packages = checked
        print(f"Use Local Packages: {'Enabled' if checked else 'Disabled'}")
        os.environ["ST_USE_LOCAL_PACKAGES"] = "1" if checked else "0"
