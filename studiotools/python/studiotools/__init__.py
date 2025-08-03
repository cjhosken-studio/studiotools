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

def start_client(port=5000):
    subprocess.call([
        "npm", "run", "dev", "--" , "--port", str(port),
    ], cwd=os.path.join(os.path.dirname(__file__), "..", "..", "source"))

def main():
    port = 5000

    # Now we're in the Rez environment, start the components
    server_thread = threading.Thread(target=start_server, args=(port,))
    server_thread.daemon = True
    server_thread.start()

    client_thread = threading.Thread(target=start_client, args=(port,))
    client_thread.daemon = True
    client_thread.start()

    time.sleep(1)

    webbrowser.open(f"http://localhost:{port}")

    # Keep main thread alive
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == '__main__':
    main()