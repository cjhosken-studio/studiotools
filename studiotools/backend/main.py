from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import signal

app = FastAPI()

server = None

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def handle_exit(sig, frame):
    if server:
        server.should_exit = True
        asyncio.create_task(server.shutdown())

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

if __name__ == "__main__":
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    server.run()