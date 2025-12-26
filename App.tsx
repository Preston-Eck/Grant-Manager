import React, { useState } from 'react';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { IngestionQueue } from './components/IngestionQueue';
import { GrantWizard } from './components/GrantWizard';
import { Reporting } from './components/Reporting';
import { Communication } from './components/Communication';
import { Feedback } from './components/Feedback';

const GrantsPlaceholder = () => (
  <div className="p-10 text-center bg-white rounded-xl shadow-sm border border-slate-200">
    <h2 className="text-xl font-bold text-slate-800 mb-2">Grant Management</h2>
    <p className="text-slate-500">Full CRUD operations for grants are managed here in the production version.</p>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'ingestion': return <IngestionQueue />;
      case 'wizard': return <GrantWizard />;
      case 'reporting': return <Reporting />;
      case 'communication': return <Communication />;
      case 'feedback': return <Feedback />;
      case 'grants': return <GrantsPlaceholder />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;