import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus } from '../types';
import { HighContrastInput, HighContrastSelect } from './ui/Input';
import { Plus, Edit2, Trash2, X, Save, Calendar } from 'lucide-react';

export const GrantManager: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});

  useEffect(() => {
    refreshGrants();
  }, []);

  const refreshGrants = () => {
    setGrants(db.getGrants());
  };

  const handleAddNew = () => {
    setCurrentGrant({
      id: crypto.randomUUID(),
      status: GrantStatus.Active,
      spent: 0,
      budget: 0
    });
    setIsEditing(true);
  };

  const handleEdit = (grant: Grant) => {
    setCurrentGrant({ ...grant });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this grant?")) {
      // Direct deletion logic since dbService is minimal
      const currentGrants = db.getGrants().filter(g => g.id !== id);
      localStorage.setItem('eckerdt_grants', JSON.stringify(currentGrants));
      refreshGrants();
    }
  };

  const handleSave = () => {
    if (currentGrant.name && currentGrant.id) {
      db.saveGrant(currentGrant as Grant);
      setIsEditing(false);
      refreshGrants();
    } else {
      alert("Please fill in at least the Grant Name.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Grant Portfolio</h2>
        {!isEditing && (
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add New Grant</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">
              {grants.find(g => g.id === currentGrant.id) ? 'Edit Grant' : 'New Grant Details'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <HighContrastInput 
              label="Grant Name" 
              value={currentGrant.name || ''} 
              onChange={e => setCurrentGrant({...currentGrant, name: e.target.value})} 
            />
            <HighContrastInput 
              label="Funder / Organization" 
              value={currentGrant.funder || ''} 
              onChange={e => setCurrentGrant({...currentGrant, funder: e.target.value})} 
            />
            <HighContrastInput 
              label="Total Budget" 
              type="number"
              value={currentGrant.budget || 0} 
              onChange={e => setCurrentGrant({...currentGrant, budget: parseFloat(e.target.value)})} 
            />
             <HighContrastSelect 
              label="Status" 
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Draft', label: 'Draft' }
              ]}
              value={currentGrant.status || 'Draft'}
              onChange={e => setCurrentGrant({...currentGrant, status: e.target.value as GrantStatus})} 
            />
             <HighContrastInput 
              label="Start Date" 
              type="date"
              value={currentGrant.startDate || ''} 
              onChange={e => setCurrentGrant({...currentGrant, startDate: e.target.value})} 
            />
             <HighContrastInput 
              label="End Date" 
              type="date"
              value={currentGrant.endDate || ''} 
              onChange={e => setCurrentGrant({...currentGrant, endDate: e.target.value})} 
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save Grant</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {grants.length === 0 && (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
               <p className="text-slate-500">No grants found. Click "Add New Grant" to get started.</p>
             </div>
          )}
          {grants.map(grant => (
            <div key={grant.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-brand-300 transition-all">
              <div className="flex-1 space-y-1 mb-4 md:mb-0">
                <div className="flex items-center space-x-3">
                  <h3 className="font-bold text-lg text-slate-800">{grant.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    grant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {grant.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-4">
                  <span>{grant.funder}</span>
                  <span className="flex items-center"><Calendar size={14} className="mr-1"/> {grant.startDate} — {grant.endDate}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right mr-4">
                  <div className="text-xs text-slate-400 uppercase font-bold">Budget</div>
                  <div className="font-mono font-bold text-slate-700">${grant.budget.toLocaleString()}</div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(grant)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(grant.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};