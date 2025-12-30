const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'app-config.json');

// Helper: Read/Write App Config (stores the location of the DB)
function getAppConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) { console.error("Config read error", e); }
  return { dbPath: '', apiKey: '' };
}

function saveAppConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (e) { return false; }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // 1. REGISTER CUSTOM PROTOCOL for efficient image loading
  // Usage in React: <img src="receipt://path/to/file.png" />
  protocol.registerFileProtocol('receipt', (request, callback) => {
    const url = request.url.substr(10); // strip 'receipt://'
    const filePath = decodeURI(path.normalize(url));
    callback({ path: filePath });
  });

  const userDataPath = app.getPath('userData');
  const receiptsPath = path.join(userDataPath, 'receipts');
  if (!fs.existsSync(receiptsPath)) fs.mkdirSync(receiptsPath, { recursive: true });

  // 2. HANDLERS
  ipcMain.handle('select-db-path', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Choose Database Location (e.g. Google Drive)',
      defaultPath: 'grant_manager_db.json',
      filters: [{ name: 'JSON Database', extensions: ['json'] }]
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle('get-settings', () => getAppConfig());
  
  ipcMain.handle('save-settings', (event, settings) => {
    const current = getAppConfig();
    return saveAppConfig({ ...current, ...settings });
  });

  ipcMain.handle('read-db', async (event, dbPath) => {
    if (!dbPath || !fs.existsSync(dbPath)) return null;
    try {
      const data = await fs.promises.readFile(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) { return null; }
  });

  ipcMain.handle('write-db', async (event, dbPath, data) => {
    try {
      await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) { return false; }
  });

  ipcMain.handle('save-receipt', async (event, base64, filename) => {
    try {
      const safeName = filename.replace(/[^a-z0-9.]/gi, '_');
      const base64Data = base64.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(receiptsPath, `r_${Date.now()}_${safeName}`);
      await fs.promises.writeFile(filePath, buffer);
      return filePath; 
    } catch (error) { throw error; }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});