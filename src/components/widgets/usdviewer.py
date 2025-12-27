from PySide6.QtWidgets import QWidget, QVBoxLayout
from pxr import Usd
from pxr.Usdviewq.stageView import StageView

class USDViewer(QWidget):
    def __init__(self):
        super().__init__()
        
        self.build_ui()
        
        self.frames = 1
        
    def build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
                
        self.model = StageView.DefaultDataModel()

        self.view = StageView(dataModel=self.model)
        self.view.setVisible(False)

        layout.addWidget(self.view) 

    def refresh(self, stage):
        if self.view:
            self.view.closeRenderer()
            self.layout().removeWidget(self.view)
            self.view.deleteLater()
            self.view = None

        self.model = StageView.DefaultDataModel()
        self.model.stage = Usd.Stage.Open(stage)
        
        start = self.model.stage.GetStartTimeCode()
        end = self.model.stage.GetEndTimeCode()
        
        self.frames = int(end - start + 1)

        self.view = StageView(dataModel=self.model)
        self.layout().addWidget(self.view)

        self.view.setVisible(True)
        self.view.updateView(resetCam=True, forceComputeBBox=True)
        
    def setTime(self, time_value: float):
        """
        time_value: frame number or seconds, depending on your pipeline
        """
        # Example for USD
        if self.model.stage:
            self.model.stage.SetTime(time_value)
        self.update()