const { app, BrowserWindow } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Security best practice
      contextIsolation: true, // Security best practice
      preload: path.join(__dirname, 'preload.js'), // Optional
    },
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  // LOGIC FIX: Check if the app is packaged (Production) or not (Development)
  if (!app.isPackaged) {
    // DEVELOPMENT: Load from the local Vite server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Open debug console
    console.log("Loading in Development Mode: http://localhost:5173");
  } else {
    // PRODUCTION: Load the built file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    console.log("Loading in Production Mode");
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});