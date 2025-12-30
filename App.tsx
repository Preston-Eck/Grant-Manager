import React, { useState, useEffect } from 'react';
import { db } from './services/dbService';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenditureInput } from './components/ExpenditureInput';
import { GrantWizard } from './components/GrantWizard';
import { Reporting } from './components/Reporting';
import { Communication } from './components/Communication';
import { DataManagement } from './components/DataManagement';
import { GrantManager } from './components/GrantManager'; 
import { Feedback } from './components/Feedback';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sharedData, setSharedData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Initialize DB Service (checks for file path in settings)
      const hasDb = await db.init();
      if (hasDb) {
        setIsReady(true);
      } else {
        setNeedsSetup(true);
        setActiveTab('settings'); // Force settings view
        setIsReady(true);
      }
    };
    initApp();
  }, []);

  const handleNavigate = (tab: string, data?: any) => {
    if (data) setSharedData(data);
    setActiveTab(tab);
  };

  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-700">Loading Grant Database...</h2>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Guard Clause: If no DB is configured, show setup prompt
    if (needsSetup && activeTab !== 'settings') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to Grant Manager</h2>
          <p className="text-slate-600 mb-8 max-w-md">
            To get started, please select where you would like to store your data. 
            We recommend a folder synced with Google Drive for backup.
          </p>
          <button onClick={() => setActiveTab('settings')} className="bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 transition-colors">
            Go to Setup
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'ingestion': return <ExpenditureInput onNavigate={handleNavigate} initialData={sharedData} />;
      case 'wizard': return <GrantWizard />;
      case 'reporting': return <Reporting />;
      case 'communication': return <Communication initialData={sharedData} />;
      case 'grants': return <GrantManager onNavigate={handleNavigate} />;
      case 'settings': return <DataManagement />;
      case 'feedback': return <Feedback />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;