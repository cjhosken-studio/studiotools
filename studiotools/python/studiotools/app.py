from flask import Flask, jsonify
from flask_cors import CORS  # Add this import
import subprocess
import sys
import os
from launchers import init_launchers

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

init_launchers(app)

def main(port=5001):
    app.run(host="localhost", port=port, debug=True, use_reloader=False)

if __name__ == "__main__":
    main()