import React, { useRef, useState } from 'react';
import { db } from '../services/dbService';
import { Download, Upload, AlertTriangle, CheckCircle, Database, RefreshCw } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const dbState = db.getFullState();
    const fileName = `grant_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(dbState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // We look for 'appState' if it came from a diagnostic report, 
        // OR the root object if it came from a direct export.
        const dataToImport = json.appState || json;

        if (confirm("WARNING: This will overwrite your current data with the backup. Are you sure?")) {
          const success = db.importState(dataToImport);
          if (success) {
            setImportStatus('success');
            setMessage("Data restored successfully! The app will reload in 3 seconds.");
            setTimeout(() => window.location.reload(), 3000);
          } else {
            throw new Error("Invalid data structure");
          }
        } else {
            // User cancelled
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } catch (err) {
        setImportStatus('error');
        setMessage("Failed to import file. Ensure it is a valid .json backup from this app.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center space-x-3">
          <Database className="text-brand-400" size={24} />
          <div>
            <h2 className="text-xl font-bold">Data Management</h2>
            <p className="text-slate-400 text-sm">Backup your local database or migrate to a new version.</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Export Section */}
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-lg">
              <Download size={20} className="text-brand-600" />
              <h3>Export Backup</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Download a full copy of your grants, transactions, and templates. 
              Save this <code>.json</code> file to a secure location or Google Drive.
            </p>
            <button 
              onClick={handleExport}
              className="w-full py-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg font-bold flex justify-center items-center space-x-2 transition-colors"
            >
              <Download size={18} />
              <span>Download Full Backup</span>
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 md:pl-4">
             <div className="flex items-center space-x-2 text-slate-800 font-bold text-lg">
              <Upload size={20} className="text-indigo-600" />
              <h3>Import / Restore</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Restore data from a backup file. 
              <span className="block mt-1 font-semibold text-amber-600 flex items-center text-xs">
                <AlertTriangle size={12} className="mr-1" />
                Warning: This replaces all current data.
              </span>
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex justify-center items-center space-x-2 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Select Backup File...</span>
              </button>
            </div>

            {importStatus === 'success' && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center animate-pulse">
                <CheckCircle size={16} className="mr-2" />
                {message}
              </div>
            )}
            {importStatus === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};