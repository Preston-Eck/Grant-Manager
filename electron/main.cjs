const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    console.log("Loading in Development Mode: http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  const receiptsPath = path.join(userDataPath, 'receipts');
  
  if (!fs.existsSync(receiptsPath)) {
    fs.mkdirSync(receiptsPath, { recursive: true });
  }

  // --- SAVE HANDLER ---
  ipcMain.handle('save-receipt', async (event, base64, filename) => {
    try {
      const safeName = filename.replace(/[^a-z0-9.]/gi, '_');
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(receiptsPath, safeName);
      
      await fs.promises.writeFile(filePath, buffer);
      
      // Return path with forward slashes to prevent Windows path escaping issues in JS strings
      return filePath.replace(/\\/g, '/');
    } catch (error) {
      console.error("Failed to save receipt:", error);
      throw error;
    }
  });

  // --- READ HANDLER (MISSING IN YOUR UPLOAD) ---
  ipcMain.handle('read-receipt', async (event, filepath) => {
    try {
        const safePath = path.normalize(filepath);
        const bitmap = await fs.promises.readFile(safePath);
        const base64 = Buffer.from(bitmap).toString('base64');
        
        const ext = path.extname(safePath).toLowerCase();
        let mime = 'image/png';
        if(ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        if(ext === '.webp') mime = 'image/webp';
        if(ext === '.pdf') mime = 'application/pdf';
        
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