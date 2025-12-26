from PySide6.QtWidgets import QWidget, QVBoxLayout
from .usdviewer import USDViewer
from .imageviewer import ImageViewer

class AssetViewer(QWidget):
    def __init__(self, asset):
        super().__init__()
        self.asset = asset
        
        self.build_ui()
        
    def build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
                
        self.usd_viewer = USDViewer()

        self.image_viewer = ImageViewer()

        layout.addWidget(self.usd_viewer) 
        layout.addWidget(self.image_viewer)

        self.setLayout(layout)
        
    def refresh(self, asset):
        self.asset = asset

        if asset.asset_type == "usd":
            self.usd_viewer.setVisible(True)
            self.image_viewer.setVisible(False)
            self.usd_viewer.refresh(self.asset.root)
            
        elif asset.asset_type == "images":
            self.usd_viewer.setVisible(False)
            self.image_viewer.setVisible(True)
            self.image_viewer.refresh(self.asset.root)
            
        
    def closeEvent(self, event):
        if self.usd_viewer:
            self.usd_viewer.closeRenderer()
        return super().closeEvent(event)
        