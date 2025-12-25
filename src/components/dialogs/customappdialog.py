from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QComboBox, QLineEdit,
    QHBoxLayout, QPushButton, QTabWidget, QWidget, QScrollArea, QGridLayout, QFileDialog
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QIcon, QPixmap

from ..types.app import *
import os
import sys

class CustomAppDialog(QDialog):
    def __init__(self, parent, exe_path):
        super().__init__(parent)
        self.setWindowTitle("Add Custom Application")
        
        self.app = Application()
        self.app.executable = exe_path
        self.app.enabled = True
        
        self.resize(640, 320)
        
        self._build_ui()
        
    def _build_ui(self):
        layout = QVBoxLayout(self)

        # App icon (editable)
        icon_label = QLabel("Icon:")
        layout.addWidget(icon_label)

        self.icon_preview = QLabel()
        self.icon_preview.setFixedSize(48, 48)
        self.icon_preview.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.icon_preview.setStyleSheet("border: 1px solid #444;")

        icon_btn = QPushButton("Choose Icon")
        icon_btn.clicked.connect(self._choose_icon)

        icon_row = QHBoxLayout()
        icon_row.addWidget(self.icon_preview)
        icon_row.addWidget(icon_btn)
        icon_row.addStretch()

        layout.addLayout(icon_row)
        
        # App name (editable)
        name_label = QLabel("Application Name:")
        self.name_edit = QLineEdit()
        self.name_edit.setText(
            os.path.splitext(os.path.basename(self.app.executable))[0]
        )
        layout.addWidget(name_label)
        layout.addWidget(self.name_edit)
        
        # Executable (read-only display)
        exe_label = QLabel("Executable:")

        self.exe_path_edit = QLineEdit(self.app.executable)
        self.exe_path_edit.setReadOnly(True)
        self.exe_path_edit.setCursorPosition(0)

        exe_browse_btn = QPushButton("Browse…")
        exe_browse_btn.clicked.connect(self._choose_executable)

        exe_row = QHBoxLayout()
        exe_row.addWidget(self.exe_path_edit)
        exe_row.addWidget(exe_browse_btn)

        layout.addWidget(exe_label)
        layout.addLayout(exe_row)
        
        type_label = QLabel("Application Type:")
        self.app_type_combo = QComboBox()
        self.app_type_combo.addItems(["blender", "houdini", "nuke", "custom"])
        self.app_type_combo.setCurrentText("custom")
        self.app_type_combo.currentIndexChanged.connect(self._on_app_type_changed)
        
        layout.addWidget(type_label)
        layout.addWidget(self.app_type_combo)
        
        self.ext_label = QLabel("File Extensions (space-separated):")
        self.extensions_input = QLineEdit()
        self.extensions_input.setPlaceholderText("hip hipnc blend nk")

        layout.addWidget(self.ext_label)
        layout.addWidget(self.extensions_input)
        
        preload_label = QLabel("Preload Script:")
        self.preload_input = QLineEdit()
        preload_btn = QPushButton("Browse…")
        preload_btn.clicked.connect(self._choose_preload)

        self.preload_row = QHBoxLayout()
        self.preload_row.addWidget(self.preload_input)
        self.preload_row.addWidget(preload_btn)

        layout.addWidget(preload_label)
        layout.addLayout(self.preload_row)

        # Buttons
        buttons = QHBoxLayout()
        buttons.addStretch()

        cancel_btn = QPushButton("Cancel")
        ok_btn = QPushButton("Add")

        cancel_btn.clicked.connect(self.reject)
        ok_btn.clicked.connect(self.accept)

        buttons.addWidget(cancel_btn)
        buttons.addWidget(ok_btn)

        layout.addLayout(buttons)
        
    def _choose_icon(self):
        path = choose_icon(self)

        if not path or not os.path.isfile(path):
            return

        self.app.icon = path
        pixmap = QPixmap(path).scaled(
            48, 48,
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation
        )
        self.icon_preview.setPixmap(pixmap)


    def _on_app_type_changed(self):
        self.app.app_type = self.app_type_combo.currentText()
        
        is_visible = self.app.app_type == "custom"
        
        self.preload_row.setVisible(is_visible)
        self.ext_label.setVisible(is_visible)
        self.extensions_input.setVisible(is_visible)
        
    def _choose_executable(self):
        if sys.platform.startswith("win"):
            filter_str = "Executables (*.exe);;All Files (*)"
        else:
            filter_str = "All Files (*)"

        path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Application Executable",
            "",
            filter_str
        )

        if not path or not os.path.isfile(path):
            return

        self.app.executable = os.path.normpath(path)
        self.exe_path_edit.setText(self.app.executable)

    def _choose_preload(self):
        path = choose_preload(self)
        if path:
            self.preload_input.setText(path)

        
    def get_application(self):
        self.app.name = self.name_edit.text().strip()
        
        raw = self.extensions_input.text()
        self.app.extensions = [
            ext.lower().replace(",", "").replace(".", "")
            for ext in raw.split()
            if ext.strip()
        ]
        
        self.app.preload = self.preload_input.text().strip()
        
        return self.app
