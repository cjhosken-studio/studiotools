const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let pythonProcess = null
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the Vue app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'))
  }
}

app.whenReady().then(() => {
  const pythonPath = process.env.NODE_ENV === 'development' 
    ? 'python' // Use system Python in dev
    : path.join(process.resourcesPath, 'python', 'bin', 'python') // Packaged path
  // Start Python backend
  pythonProcess = spawn(pythonPath, ['main.py'], {
    cwd: path.join(__dirname, 'backend')
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (pythonProcess) pythonProcess.kill()
    app.quit()
  }
})