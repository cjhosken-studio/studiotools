from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QComboBox, QLineEdit,
    QHBoxLayout, QPushButton
)

class TaskFolderDialog(QDialog):
    def __init__(self, parent_type, parent_subtype, parent=None):
        super().__init__(parent)
        
        self.parent_type = parent_type
        self.parent_subtype = parent_subtype
        
        self.setWindowTitle("Create Item")
        self.setModal(True)
        self.resize(360, 220)
        
        self._build_ui()
        
        self._update_subtypes()
        
    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("Create:"))
        self.type_combo = QComboBox()
        
        type_combo_items = []
        
        if self.parent_type == "folder" or self.parent_type == "project":
            type_combo_items += ["Folder", "TaskArea"]
            
        if self.parent_type == "taskarea":
            type_combo_items += ["Task"]
        
        self.type_combo.addItems(type_combo_items)
        self.type_combo.currentIndexChanged.connect(self._update_subtypes)
        layout.addWidget(self.type_combo)
        
        self.subtype_combo_label = QLabel("Type:")
        layout.addWidget(self.subtype_combo_label)
        self.subtype_combo = QComboBox()
        self.subtype_combo.currentIndexChanged.connect(self._update_name_state)
        layout.addWidget(self.subtype_combo)
        
        self.name_label = QLabel("Name:")
        layout.addWidget(self.name_label)
        self.name_edit = QLineEdit()
        self.name_edit.textChanged.connect(self._update_text_state)
        layout.addWidget(self.name_edit)
        
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        self.ok_btn = QPushButton("OK")
        self.ok_btn.clicked.connect(self.accept)
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.clicked.connect(self.reject)
        
        btn_layout.addWidget(self.ok_btn)
        btn_layout.addWidget(self.cancel_btn)
        
        layout.addLayout(btn_layout)
        
    def _update_subtypes(self):
        self.subtype_combo.clear()
        self.subtype_combo.setVisible(True)
        self.subtype_combo_label.setVisible(True)
        
        current_type = self.type_combo.currentText()
        
        if current_type == "Folder":
            self.subtype_combo.addItems(["Custom"])
            self.subtype_combo_label.setVisible(False)
            self.subtype_combo.setVisible(False)
            if not self.name_edit.text():
                self.name_edit.setText("folder")
            
        if current_type == "TaskArea":
            self.subtype_combo.addItems([
                "Asset",
                "Shot",
                "Custom"
            ])
            
        if current_type == "Task":
            subtype_items = []
            
            if self.parent_subtype == "asset":
                subtype_items = [
                    "Scan",
                    "Model",
                    "Texture",
                    "Lookdev",
                    "Rig",
                    "Groom",
                    "Tool"
                ]
            elif self.parent_subtype == "":
                subtype_items = [
                    "Track",
                    "Layout",
                    "Animate",
                    "FX",
                    "Light",
                    "Comp"
                ]
            else:
                subtype_items = ["Custom"]
                
            self.subtype_combo.addItems(subtype_items)
                
        self._update_name_state()
        self._update_text_state()
            
    def _update_name_state(self):
        is_custom = self.parent_type != "Task" or self.subtype_combo.currentText() == "Custom"
        self.name_edit.setVisible(is_custom)
        self.name_label.setVisible(is_custom)
        
        self._update_text_state()
        
    def _update_text_state(self):
        if self.name_edit.isVisible():
            self.ok_btn.setEnabled(len(self.name_edit.text()))
        
    def get_result(self):
        return self.type_combo.currentText().lower(), self.subtype_combo.currentText().lower(), self.name_edit.text().lower()