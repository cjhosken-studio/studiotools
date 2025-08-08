from flask import Flask, jsonify
from flask_cors import CORS

import threading
import signal
import sys

from routers import navigationbar

app = Flask(__name__)

# Configure CORS (equivalent to FastAPI's CORSMiddleware)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "allow_headers": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

navigationbar.navigationbar_routes(app)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)