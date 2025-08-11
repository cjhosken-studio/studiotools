import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

let pythonProcess: ChildProcess | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the frontend
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
}

function startPythonBackend() {
  const isPackaged = app.isPackaged;
  
  if (isPackaged) {
    // In production - use the bundled Python executable
    const pythonPath = path.join(
      process.resourcesPath,
      'backend',
      process.platform === 'win32' ? 'main.exe' : 'main'
    );
    pythonProcess = spawn(pythonPath);
  } else {
    // In development - use local Python interpreter
    pythonProcess = spawn('python', [path.join(__dirname, '../../backend/main.py')]);
  }

  pythonProcess.stdout?.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr?.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
});

// Handle app closing
app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
});

// macOS specific behavior
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});