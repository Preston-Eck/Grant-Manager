const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

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

  // IPC Handler to READ files (Fixes the "Not allowed to load local resource" error)
  ipcMain.handle('read-receipt', async (event, filepath) => {
    try {
        const bitmap = await fs.promises.readFile(filepath);
        const base64 = Buffer.from(bitmap).toString('base64');
        
        // Simple extension check to set correct mime type
        const ext = path.extname(filepath).toLowerCase();
        let mime = 'image/png';
        if(ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        if(ext === '.webp') mime = 'image/webp';
        
        return `data:${mime};base64,${base64}`;
    } catch (e) {
        console.error("Failed to read receipt:", e);
        throw e;
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