from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QIcon
from PySide6.QtCore import QCoreApplication

from components.widgets.mainwindow import MainWindow

def main():
    app = QApplication([])

    QCoreApplication.setOrganizationName("Christopher Hosken")
    QCoreApplication.setOrganizationDomain("cjhosken.github.io")
    QCoreApplication.setApplicationName("studiotools")

    app.setWindowIcon(QIcon(""))

    window = MainWindow()

    window.show()

    app.exec()

if __name__ == "__main__":
    main()