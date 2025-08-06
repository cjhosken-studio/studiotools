import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null
let pythonProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    darkTheme: true,
  })

  mainWindow.setMenu(null);

  // Load the Vue app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  const pythonPath = process.env.NODE_ENV === 'development' 
    ? 'python3' // Use system Python in dev
    : path.join(process.resourcesPath, 'python', 'bin', 'python3') // Packaged path
  // Start Python backend
  pythonProcess = spawn(pythonPath, ['main.py'], {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'pipe'
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
  });

}).then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    process.exit(0);
  }
})
