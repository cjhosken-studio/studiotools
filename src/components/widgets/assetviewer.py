from PySide6.QtWidgets import QWidget, QVBoxLayout, QSlider
from PySide6.QtCore import Qt
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
        
        self.timeline = QSlider(Qt.Orientation.Horizontal)
        self.timeline.setMinimum(0)
        self.timeline.setMaximum(100)  # update per asset
        self.timeline.setSingleStep(1)
        self.timeline.setPageStep(1)
        self.timeline.setTracking(True)

        self.timeline.valueChanged.connect(self._on_time_changed)
        
        layout.addWidget(self.timeline)

        self.setLayout(layout)
        
    def refresh(self, asset):
        self.asset = asset

        if asset.asset_type == "usd":
            self.usd_viewer.setVisible(True)
            self.image_viewer.setVisible(False)
            self.usd_viewer.refresh(self.asset.root)
            
            if self.usd_viewer.frames > 1:
                self.timeline.setVisible(True)
                self.timeline.setMaximum(self.usd_viewer.frames)
            else:
                self.timeline.setVisible(False)
            
            
        elif asset.asset_type == "images":
            self.usd_viewer.setVisible(False)
            self.image_viewer.setVisible(True)
            self.image_viewer.refresh(self.asset.root)
            
            if len(self.image_viewer.frames) > 1:
                self.timeline.setVisible(True)
                self.timeline.setMaximum(len(self.image_viewer.frames) - 1)
            else:
                self.timeline.setVisible(False)
            
            
    def setTime(self, time_value: float):
        if self.asset.asset_type == "usd":
            self.usd_viewer.setTime(time_value)
        elif self.asset.asset_type == "images":
            self.image_viewer.setTime(time_value)
            
    def _on_time_changed(self, value: int):
        self.setTime(value)
            
        
    def closeEvent(self, event):
        if self.usd_viewer:
            self.usd_viewer.closeRenderer()
        return super().closeEvent(event)
        