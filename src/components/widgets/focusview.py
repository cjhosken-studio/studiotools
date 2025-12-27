from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QSizePolicy, QFrame, QPushButton
from PySide6.QtCore import Qt
from ..types.version import *
from .assetviewer import AssetViewer

class FocusView(QWidget):
    def __init__(self, asset):
        super().__init__()
        self.asset = asset
        self._build_ui()
    
    def _build_ui(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(16, 16, 16, 16)
        
        self.title = QLabel("Asset (v000)")
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title.setStyleSheet(
            "font-weight: bold; font-size: 16px;"
        )

        self.viewer = AssetViewer(self.asset)
        self.viewer.setSizePolicy(
            QSizePolicy.Policy.Expanding,
            QSizePolicy.Policy.Ignored
        )
        
        # --- Metadata ---
        self.meta_label = QLabel()
        self.meta_label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.meta_label.setStyleSheet("color: #888; font-size: 12px;")

        # Optional separator
        separator = QFrame()
        separator.setFrameShape(QFrame.HLine)
        separator.setFrameShadow(QFrame.Sunken)

        # --- Action button ---
        self.publish_button = QPushButton("Set as Published")
        self.publish_button.setFixedHeight(32)

        # --- Layout order ---
        layout.addWidget(self.title)
        layout.addWidget(self.viewer, stretch=1)
        layout.addWidget(separator)
        layout.addWidget(self.meta_label)
        layout.addWidget(self.publish_button, alignment=Qt.AlignmentFlag.AlignRight)

        self.setLayout(layout)
    
    def setAsset(self, asset):
        self.asset = asset
        self.title.setText(f"{strip_version(self.asset.name)} ({format_version(self.asset.version)})")
        self.viewer.refresh(asset)
        
    def getAsset(self):
        return self.asset if self.asset else None
    
    def hasAsset(self):
        return self.asset is not None