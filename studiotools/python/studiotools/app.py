from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def hello():
    return jsonify({"message": "Hello from Flask"})

def main(port=5000):
    app.run(host="http://localhost", port=port, debug=True, use_reloader=True)