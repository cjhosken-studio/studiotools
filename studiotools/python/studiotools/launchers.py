from flask import Flask, jsonify
from flask_cors import CORS  # Add this import
import subprocess
import sys
import os


def init_launchers(app):
    @app.route('/launch-blender', methods=['POST'])
    def launch_blender():
        try:
            print("Attempting to launch Blender...")

            subprocess.Popen([
                "gnome-terminal", "--wait", "--", 
                "bash", "-c", 
                "rez env blender -- blender; exit"
            ])
            
            return jsonify({"status": "success"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
        
    @app.route('/launch-houdini', methods=['POST'])
    def launch_houdini():
        try:
            print("Attempting to launch Houdini...")

            subprocess.Popen([
                "gnome-terminal", "--wait", "--", 
                "bash", "-c", 
                "rez env houdini -- houdini; exit"
            ])
            
            return jsonify({"status": "success"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
        
    @app.route('/launch-nuke', methods=['POST'])
    def launch_nuke():
        try:
            print("Attempting to launch Nuke...")

            subprocess.Popen([
                "gnome-terminal", "--wait", "--", 
                "bash", "-c", 
                "rez env nuke -- nuke; exit"
            ])
            
            return jsonify({"status": "success"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500