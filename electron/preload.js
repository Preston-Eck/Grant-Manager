const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveReceipt: (base64, filename) => ipcRenderer.invoke('save-receipt', base64, filename),
  // FIX: This was missing in your .js file
  readReceipt: (path) => ipcRenderer.invoke('read-receipt', path)
});