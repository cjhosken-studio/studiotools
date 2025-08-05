from flask import Flask, jsonify
from flask_cors import CORS  # Add this import
from PySide6.QtWidgets import QApplication, QFileDialog
import subprocess
import sys
import os
from launchers import init_launchers

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

qt_app = None

def init_qt_app():
    global qt_app
    if not QApplication.instance():
        qt_app = QApplication(sys.argv)

init_launchers(app)

def get_project_path():
    init_qt_app()
    dialog = QFileDialog()
    dialog.setWindowTitle("Set Project Folder")  # Custom title
    dialog.setFileMode(QFileDialog.Directory)
    dialog.setLabelText(QFileDialog.Accept, "Set Project")  # Only works on Linux!
    dialog.setOption(QFileDialog.ShowDirsOnly, True)
    
    if dialog.exec():
        folder = dialog.selectedFiles()[0]
    else:
        folder = None
    
    return folder

@app.route('/api/select-project', methods=['GET'])
def select_project():
    try:
        project_path = get_project_path()
        if not project_path:
            return jsonify({"error": "No project selected"}), 400
        
        print("TESTING")
        return jsonify({"projectPath": project_path})  # Consistent key name
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def main(port=5000):
    app.run(host="localhost", port=port, debug=True, use_reloader=False)

if __name__ == "__main__":
    main()