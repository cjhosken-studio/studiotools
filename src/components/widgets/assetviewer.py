from PySide6.QtWidgets import QWidget, QVBoxLayout
from pxr import Usd

from pxr.Usdviewq.stageView import StageView

class AssetViewer(QWidget):
    def __init__(self, asset):
        super().__init__()
        self.asset = asset
        
        self.build_ui()
        
    def build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
                
        self.model = StageView.DefaultDataModel()

        self.view = StageView(dataModel=self.model)
        self.view.setVisible(False)

        layout.addWidget(self.view) 

        self.setLayout(layout)
        
    def refresh(self, asset):
        self.asset = asset
        self.view.setVisible(False)
        
        if asset.asset_type == "usd":
            self.model.stage = Usd.Stage.Open(self.asset.root)
            self.view.setVisible(True)
            self.view.updateView(resetCam=True, forceComputeBBox=True)

        
    def closeEvent(self, event):
        if self.view:
            self.view.closeRenderer()
        return super().closeEvent(event)
        