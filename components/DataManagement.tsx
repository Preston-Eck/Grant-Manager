import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Download, Upload, Database, FolderOpen, CheckCircle, AlertTriangle, ArchiveRestore, FileInput } from 'lucide-react';

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

  // Creates a NEW database file (overwrites or creates new)
  const handleCreateNew = async () => {
    if (confirm("Create a NEW database? This will prompt you to select a location for a new file.")) {
        const path = await window.electronAPI.selectDbPath();
        if (path) {
          await db.createNewDb(path);
          setCurrentPath(path);
          setStatus('New database created successfully. The app will reload.');
          setTimeout(() => window.location.reload(), 1500);
        }
    }
  };

  // Loads an EXISTING database file (switches context)
  const handleLoadExisting = async () => {
      const path = await window.electronAPI.openDbFile();
      if (path) {
          await db.switchDatabase(path);
          setCurrentPath(path);
          setStatus('Switched to existing database successfully. App reloading...');
          setTimeout(() => window.location.reload(), 1500);
      }
  };

  // Imports data from a JSON file into the CURRENT database
  const handleImportFile = async () => {
      const path = await window.electronAPI.openDbFile();
      if (path && window.electronAPI) {
          try {
              const data = await window.electronAPI.readDb(path);
              if (data) {
                  await db.mergeData(data);
                  setStatus(`Successfully merged data from ${path.split(/[/\\]/).pop()}`);
              } else {
                  alert("Could not read file or file is empty.");
              }
          } catch (e) {
              alert("Error importing file.");
          }
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

  // ... (Legacy Recovery function remains the same) ...
  const handleRecoverLegacyData = () => {
    try {
      const rawGrants = localStorage.getItem('eckerdt_grants');
      const rawExp = localStorage.getItem('eckerdt_expenditures');
      const rawTemplates = localStorage.getItem('eckerdt_templates');

      if (!rawGrants && !rawExp) {
        alert("No legacy data found in this browser/app instance.");
        return;
      }

      const legacyData = {
        grants: rawGrants ? JSON.parse(rawGrants) : [],
        expenditures: rawExp ? JSON.parse(rawExp) : [],
        templates: rawTemplates ? JSON.parse(rawTemplates) : [],
        timestamp: new Date().toISOString()
      };

      const countGrants = legacyData.grants.length;
      const countExp = legacyData.expenditures.length;

      if (confirm(`Found ${countGrants} Grants and ${countExp} Expenditures from the old version.\n\nDo you want to import them into your currently selected database file?`)) {
        db.importState(legacyData);
        setStatus('Legacy data successfully recovered and saved to file!');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      console.error(e);
      alert("Error recovering data. Check console for details.");
    }
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
            <h3 className="text-lg font-bold text-slate-800">Database Connection</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-4">
              <div className="overflow-hidden">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Active Database</label>
                <div className="text-sm font-mono text-slate-700 truncate" title={currentPath}>
                  {currentPath}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleLoadExisting}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium whitespace-nowrap shadow-sm"
                  >
                    <FolderOpen size={18} />
                    <span>Connect to Existing Database</span>
                  </button>

                  <button 
                    onClick={handleCreateNew}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
                  >
                    <Database size={18} />
                    <span>Create New Database</span>
                  </button>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              <span className="font-bold">Recommendation:</span> Select a folder in your <strong>Google Drive</strong> or <strong>Dropbox</strong> to enable automatic cloud backup.
            </p>
          </div>

          {/* Import / Export */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
             <h3 className="text-lg font-bold text-slate-800">Import & Export</h3>
             <div className="flex flex-wrap gap-3">
                 <button onClick={handleManualBackup} className="flex items-center text-brand-600 hover:text-brand-800 font-medium border border-brand-200 bg-brand-50 px-4 py-2 rounded-lg">
                   <Download size={18} className="mr-2"/> Export Full Backup (JSON)
                 </button>
                 
                 <button onClick={handleImportFile} className="flex items-center text-emerald-600 hover:text-emerald-800 font-medium border border-emerald-200 bg-emerald-50 px-4 py-2 rounded-lg">
                   <Upload size={18} className="mr-2"/> Import/Merge Data from JSON
                 </button>
             </div>
             <p className="text-xs text-slate-500">
               * <strong>Importing</strong> will merge data from the selected file into your current database. Duplicate IDs will be ignored.
             </p>
          </div>

          {/* Legacy Recovery Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
             <div className="flex items-center space-x-2">
                <ArchiveRestore size={20} className="text-amber-600"/>
                <h3 className="text-lg font-bold text-slate-800">Legacy Data Recovery</h3>
             </div>
             <p className="text-sm text-slate-600">
                If you recently updated the app and see empty data, your old data might still be in the browser cache. Use this to move it to your new file database.
             </p>
             <button onClick={handleRecoverLegacyData} className="flex items-center text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-200 bg-amber-50 px-4 py-2 rounded-lg transition-colors font-bold">
               <ArchiveRestore size={18} className="mr-2"/> Recover from LocalStorage
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