import sys
from PySide6.QtWidgets import (QApplication, QMainWindow, 
                               QPushButton, QLabel, QVBoxLayout, QWidget)
from PySide6.QtCore import Qt

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Simple PySide6 App")
        self.setGeometry(100, 100, 400, 300)
        
        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        # Create a label
        self.label = QLabel("Hello, PySide6!")
        self.label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.label.setStyleSheet("font-size: 20px; margin: 20px;")
        layout.addWidget(self.label)
        
        # Create a button
        self.button = QPushButton("Click Me!")
        self.button.setStyleSheet("""
            QPushButton {
                font-size: 16px;
                padding: 10px;
                min-width: 100px;
            }
            QPushButton:hover {
                background-color: #ddd;
            }
        """)
        self.button.clicked.connect(self.on_button_click)
        layout.addWidget(self.button, alignment=Qt.AlignmentFlag.AlignCenter)
        
        # Add stretch to push widgets to the center
        layout.addStretch()
    
    def on_button_click(self):
        self.label.setText("Button was clicked!")
        self.button.setText("Clicked!")
        self.button.setEnabled(False)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Set a modern style
    app.setStyle("Fusion")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())