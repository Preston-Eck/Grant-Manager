import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Download, Upload, Database, FolderOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      setCurrentPath(settings.dbPath || 'Not Configured');
    }
  };

  const handleSelectLocation = async () => {
    const path = await window.electronAPI.selectDbPath();
    if (path) {
      await db.createNewDb(path);
      setCurrentPath(path);
      setStatus('New database created successfully. The app will reload.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleManualBackup = () => {
    const state = db.getFullState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center space-x-3">
          <Database className="text-brand-400" size={24} />
          <div>
            <h2 className="text-xl font-bold">Settings & Data</h2>
            <p className="text-slate-400 text-sm">Manage storage location and backups.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Database Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Database Storage</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 overflow-hidden">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Location</label>
                <div className="text-sm font-mono text-slate-700 truncate" title={currentPath}>
                  {currentPath}
                </div>
              </div>
              <button 
                onClick={handleSelectLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
              >
                <FolderOpen size={18} />
                <span>Create/Select Database File</span>
              </button>
            </div>
            <p className="text-sm text-slate-500">
              <span className="font-bold">Recommendation:</span> Select a folder in your <strong>Google Drive</strong> or <strong>Dropbox</strong> to enable automatic cloud backup and sync across devices.
            </p>
          </div>

          {/* Manual Backup */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
             <h3 className="text-lg font-bold text-slate-800">Manual Backup</h3>
             <button onClick={handleManualBackup} className="flex items-center text-brand-600 hover:text-brand-800 font-medium border border-brand-200 bg-brand-50 px-4 py-2 rounded-lg">
               <Download size={18} className="mr-2"/> Download JSON Snapshot
             </button>
          </div>

          {status && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center animate-pulse border border-green-200">
              <CheckCircle size={20} className="mr-2"/> {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};