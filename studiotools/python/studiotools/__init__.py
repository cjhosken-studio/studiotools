from PySide6.QtWidgets import QApplication, QWidget
from PySide6.QtGui import QIcon
from widgets.mainwindow import MainWindow

import sys

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Studio Tools")
    app.setApplicationDisplayName("Studio Tools")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("cjhosken")
    app.setOrganizationDomain("cjhosken.github.io")

    app.setWindowIcon(QIcon("studio.png"))

    window = MainWindow()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()