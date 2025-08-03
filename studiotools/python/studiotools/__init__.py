#!/usr/bin/env python

import argparse
import subprocess
import threading
import webbrowser
import os
import time

def start_server(port=5000):
    import app
    app.main(port)
    
def start_client(port=5001):
    subprocess.call([
        "npm", "run", "dev", "--" , "--port", str(port),
    ], cwd=os.path.join(os.path.dirname(__file__), "..", "..", "source"))

def main():    
    port = 5000
    client_thread = threading.Thread(target=start_client, args=(port+1,))
    client_thread.daemon = True
    client_thread.start()

    client_thread = threading.Thread(target=start_server, args=(port,))
    client_thread.daemon = True
    client_thread.start()

    webbrowser.open(f"http://localhost:{port+1}")

    # Keep main thread alive
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == '__main__':
    main()