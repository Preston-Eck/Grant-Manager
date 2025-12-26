import React, { useState } from 'react';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenditureInput } from './components/ExpenditureInput'; // Updated Import
import { GrantWizard } from './components/GrantWizard';
import { Reporting } from './components/Reporting';
import { Communication } from './components/Communication';
import { DataManagement } from './components/DataManagement';
import { GrantManager } from './components/GrantManager'; 

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sharedData, setSharedData] = useState<any>(null);

  const handleNavigate = (tab: string, data?: any) => {
    if (data) setSharedData(data);
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'ingestion': return <ExpenditureInput onNavigate={handleNavigate} />;
      case 'wizard': return <GrantWizard />;
      case 'reporting': return <Reporting />;
      case 'communication': return <Communication initialData={sharedData} />;
      case 'grants': return <GrantManager />;
      case 'settings': return <DataManagement />;
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