from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel
from ..types.version import *
from .assetviewer import AssetViewer

class FocusView(QWidget):
    def __init__(self, asset):
        super().__init__()
        self.asset = asset
        self._build_ui()
    
    def _build_ui(self):
        layout = QVBoxLayout()
        
        self.title = QLabel("Asset (v000)")
        
        self.viewer = AssetViewer(self.asset)
        
        layout.addWidget(self.title)
        layout.addWidget(self.viewer)
        
        self.setLayout(layout)
    
    def setAsset(self, asset):
        self.asset = asset
        self.title.setText(f"{strip_version(self.asset.name)} ({format_version(self.asset.version)})")
        self.viewer.refresh(asset)
        
    def getAsset(self):
        return self.asset if self.asset else None
    
    def hasAsset(self):
        return self.asset is not None