export interface AppSettings {
  dbPath: string;
  apiKey?: string;
}

export interface ElectronAPI {
  // Settings & DB
  selectDbPath: () => Promise<string | null>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  
  // Database I/O
  readDb: (path: string) => Promise<any>;
  writeDb: (path: string, data: any) => Promise<boolean>;
  
  // Receipts
  saveReceipt: (base64: string, filename: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}