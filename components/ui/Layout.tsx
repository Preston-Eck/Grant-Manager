import React from 'react';
import { LayoutDashboard, FileText, PieChart, Mail, Wand2, UploadCloud, MessageSquareWarning } from 'lucide-react';
import { Settings as SettingsIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-brand-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Eckerdt LLC
            <span className="block text-brand-500 text-sm font-normal">Grant Management</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Grants" 
            active={activeTab === 'grants'} 
            onClick={() => setActiveTab('grants')} 
          />
          <SidebarItem 
            icon={UploadCloud} 
            label="Ingestion Queue" 
            active={activeTab === 'ingestion'} 
            onClick={() => setActiveTab('ingestion')} 
          />
          <SidebarItem 
            icon={PieChart} 
            label="Reporting Hub" 
            active={activeTab === 'reporting'} 
            onClick={() => setActiveTab('reporting')} 
          />
           <SidebarItem 
            icon={Wand2} 
            label="Wizard (AI)" 
            active={activeTab === 'wizard'} 
            onClick={() => setActiveTab('wizard')} 
          />
          <SidebarItem 
            icon={Mail} 
            label="Communication" 
            active={activeTab === 'communication'} 
            onClick={() => setActiveTab('communication')} 
          />
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem 
              icon={MessageSquareWarning} 
              label="Beta Feedback" 
              active={activeTab === 'feedback'} 
              onClick={() => setActiveTab('feedback')} 
            />
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
            <SidebarItem 
              icon={SettingsIcon} 
              label="Settings & Data" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
            <SidebarItem 
              icon={MessageSquareWarning} 
              label="Beta Feedback" 
              active={activeTab === 'feedback'} 
              onClick={() => setActiveTab('feedback')} 
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          v1.0.0 Local • Secure
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 relative">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};