from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel
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
        layout.setSpacing(12)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.title = QLabel("Asset (v000)")
        
        self.title = QLabel("Asset (v000)")
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title.setStyleSheet(
            "font-weight: bold; font-size: 16px;"
        )

        self.viewer = AssetViewer(self.asset)
        self.viewer.setSizePolicy(
            self.viewer.sizePolicy().horizontalPolicy(),
            self.viewer.sizePolicy().verticalPolicy(),
        )

        layout.addWidget(self.title, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.viewer, alignment=Qt.AlignmentFlag.AlignCenter)

        self.setLayout(layout)
    
    def setAsset(self, asset):
        self.asset = asset
        self.title.setText(f"{strip_version(self.asset.name)} ({format_version(self.asset.version)})")
        self.viewer.refresh(asset)
        
    def getAsset(self):
        return self.asset if self.asset else None
    
    def hasAsset(self):
        return self.asset is not None