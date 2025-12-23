from PySide6.QtWidgets import QWidget

class ListView(QWidget):
    def __init__(self, context):
        super().__init__()
        self.context = context

class TaskListView(ListView):
    def __init__(self, context):
        super().__init__(context)

class AssetListView(ListView):
    def __init__(self, context):
        super().__init__(context)