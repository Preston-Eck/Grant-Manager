const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDbPath: () => ipcRenderer.invoke('select-db-path'),
  openDbFile: () => ipcRenderer.invoke('open-db-file'), // NEW
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  readDb: (path) => ipcRenderer.invoke('read-db', path),
  writeDb: (path, data) => ipcRenderer.invoke('write-db', path, data),
  saveReceipt: (base64, filename) => ipcRenderer.invoke('save-receipt', base64, filename),
});