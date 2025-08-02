from PySide6.QtWidgets import QApplication, QMainWindow
from PySide6.QtGui import QIcon
import os
import sys

from studiotools_ui.widgets.mainwindow import STMainWindow

def launch():
    name = "Studio Tools"
    version = "1.0.0"
    domain = "cjhosken"

    app = QApplication(sys.argv)

    window = STMainWindow()
    app.setApplicationName(name)
    app.setApplicationVersion(version)
    app.setOrganizationDomain(domain)
    app.setApplicationDisplayName(name)
    
    window.show()
    app.exec()

if __name__ == "__main__":
    launch()