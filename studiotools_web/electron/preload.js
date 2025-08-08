const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))    
  }
})

window.matchMedia('(prefers-color-scheme: dark)').addListener((event) => {
  ipcRenderer.send('theme-changed', event.matches ? 'dark' : 'light');
});