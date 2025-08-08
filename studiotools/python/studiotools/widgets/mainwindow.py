from PySide6.QtCore import QSettings
from PySide6.QtWidgets import QMainWindow, QApplication, QWidget, QVBoxLayout
from PySide6.QtGui import QPalette, QColor
from widgets.navigation import NavigationWidget
from data.context import Context
from style.palette import get_palette


class MainWindow(QMainWindow):
    
    def __init__(self):
        super().__init__()

        self._settings = QSettings("cjhosken", "StudioTools")
        self._context = [Context()]

        self.restore_settings()

        # UI Components
        self.resize(1920, 1080)
        self.setup_ui()

    def setup_theme(self):
        self.setPalette(get_palette())

    def setup_ui(self):
        container = QWidget()
        layout = QVBoxLayout(container)

        self.setup_theme()
        menubar = self.menuBar()

        dev_menu = menubar.addMenu("&Developer")
        dev_menu.addAction("Reload")

        self.navigation = NavigationWidget(context=self._context)
        layout.addWidget(self.navigation)

        self.setCentralWidget(container)

    def restore_settings(self):
        if self._settings.contains("projectName"):
            self._context[0].project().set_name(self._settings.value("projectName"))
        if self._settings.contains("projectPath"):
            self._context[0].project().set_path(self._settings.value("projectPath"))
        if self._settings.contains("cwd"):
            self._context[0].set_cwd(self._settings.value("cwd"))

        if self._settings.contains("windowGeometry"):
            self.restoreGeometry(self._settings.value("windowGeometry"))
        if self._settings.contains("windowState"):
            self.restoreState(self._settings.value("windowState"))

    def closeEvent(self, event):
        print(self._context[0].project().name())

        self._settings.setValue("projectName", self._context[0].project().name())
        self._settings.setValue("projectPath", self._context[0].project().path())
        self._settings.setValue("cwd", self._context[0].cwd())

        self._settings.setValue("windowState", self.saveState())
        self._settings.setValue("windowGeometry", self.saveGeometry())