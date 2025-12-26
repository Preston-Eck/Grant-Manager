import React, { useState } from 'react';
import { db } from '../services/dbService';
import { HighContrastInput, HighContrastTextArea, HighContrastSelect } from './ui/Input';
import { Download, Bug, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Feedback: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Bug Report');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const generateReport = () => {
    const dbState = db.getFullState();
    
    const report = {
      meta: {
        appName: "Eckerdt LLC Grant Management",
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      },
      userFeedback: {
        reporterName: name,
        type: type,
        description: description,
        reproductionSteps: steps
      },
      appState: dbState
    };

    const fileName = `eckerdt_debug_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 5000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-brand-500 p-2 rounded-lg text-white">
              <Bug size={24} />
            </div>
            <h2 className="text-xl font-bold">Beta Feedback & Diagnostics</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Help us improve. Submit your feedback and download a diagnostic report. 
            Send the downloaded file to the development team for rapid troubleshooting.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HighContrastInput 
              label="Your Name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <HighContrastSelect 
              label="Feedback Type"
              options={[
                { value: 'Bug Report', label: 'Bug Report' },
                { value: 'Feature Request', label: 'Feature Request' },
                { value: 'Usability Issue', label: 'Usability Issue' },
                { value: 'Other', label: 'Other' }
              ]}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>

          <HighContrastTextArea 
            label="Description"
            placeholder="Describe what happened or what you would like to see..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <HighContrastTextArea 
            label="Steps to Reproduce (if Bug)"
            placeholder="1. Go to Ingestion Tab&#10;2. Upload image&#10;3. Click Approve..."
            rows={4}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />

          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start space-x-3 text-sm text-slate-500 max-w-md">
              <AlertTriangle className="flex-shrink-0 text-amber-500" size={20} />
              <p>
                Downloading the report will include a copy of your local database (Grants, Transactions, Templates) so we can replicate the issue exactly.
              </p>
            </div>

            <button
              onClick={generateReport}
              disabled={!description}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                downloaded 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-slate-900 hover:bg-slate-800'
              } ${!description ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {downloaded ? <CheckCircle2 size={20} /> : <Download size={20} />}
              <span>{downloaded ? 'Report Downloaded' : 'Download Diagnostic Report'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 flex items-start space-x-4">
        <MessageSquare className="text-indigo-600 mt-1" size={24} />
        <div>
          <h3 className="font-bold text-indigo-900 mb-1">What happens next?</h3>
          <p className="text-indigo-700 text-sm leading-relaxed">
            Please email the downloaded <code>.json</code> file to your AI Studio developer contact. 
            We will feed this report into the AI to automatically analyze errors, update the code, 
            and fix the issues you encountered.
          </p>
        </div>
      </div>
    </div>
  );
};