from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QIcon
from PySide6.QtCore import QCoreApplication

from components.widgets.mainwindow import MainWindow
import os

def main():
    app = QApplication([])

    QCoreApplication.setOrganizationName("Christopher Hosken")
    QCoreApplication.setOrganizationDomain("cjhosken.github.io")
    QCoreApplication.setApplicationName("studiotools")

    app.setWindowIcon(QIcon(os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "logo.png")))

    window = MainWindow()

    window.show()

    app.exec()

if __name__ == "__main__":
    main()