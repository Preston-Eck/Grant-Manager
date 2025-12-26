const { app, BrowserWindow, ipcMain } = require('electron'); // Added ipcMain
const path = require('path');
const fs = require('fs'); // Added fs

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Ensure this is linked
    },
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    console.log("Loading in Development Mode: http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    console.log("Loading in Production Mode");
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Ensure user data directory exists for receipts
  const userDataPath = app.getPath('userData');
  const receiptsPath = path.join(userDataPath, 'receipts');
  if (!fs.existsSync(receiptsPath)) {
    fs.mkdirSync(receiptsPath, { recursive: true });
  }

  // IPC Handler to save files
  ipcMain.handle('save-receipt', async (event, base64, filename) => {
    try {
      // Remove header if present (e.g., "data:image/png;base64,")
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(receiptsPath, filename);
      
      await fs.promises.writeFile(filePath, buffer);
      return filePath; // Return the real path to save in DB
    } catch (error) {
      console.error("Failed to save receipt:", error);
      throw error;
    }
  });

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