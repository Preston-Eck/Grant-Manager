import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus, Deliverable, ComplianceReport, BudgetCategory } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Plus, Edit2, Trash2, X, Save, Calendar, CheckCircle, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';

export const GrantManager: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'deliverables' | 'reports'>('details');

  useEffect(() => { refreshGrants(); }, []);
  const refreshGrants = () => { setGrants(db.getGrants()); };

  const handleAddNew = () => {
    setCurrentGrant({ id: crypto.randomUUID(), status: GrantStatus.Active, totalAward: 0, deliverables: [], reports: [] });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleEdit = (grant: Grant) => {
    setCurrentGrant(JSON.parse(JSON.stringify(grant))); // Deep copy
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleSave = () => {
    if (currentGrant.name && currentGrant.id) {
      db.saveGrant(currentGrant as Grant);
      setIsEditing(false);
      refreshGrants();
    } else {
      alert("Grant Name is required.");
    }
  };

  // --- Sub-Component Logic for Deliverables ---
  const addDeliverable = () => {
    const newDel: Deliverable = {
      id: crypto.randomUUID(),
      sectionReference: '',
      description: '',
      allocatedValue: 0,
      dueDate: '',
      status: 'Pending',
      budgetCategories: []
    };
    setCurrentGrant({ ...currentGrant, deliverables: [...(currentGrant.deliverables || []), newDel] });
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
    const dels = [...(currentGrant.deliverables || [])];
    dels[index] = { ...dels[index], [field]: value };
    setCurrentGrant({ ...currentGrant, deliverables: dels });
  };

  // --- Sub-Component Logic for Budget Categories ---
  const addCategory = (delIndex: number) => {
    const newCat: BudgetCategory = { id: crypto.randomUUID(), name: '', allocation: 0, purpose: '' };
    const dels = [...(currentGrant.deliverables || [])];
    dels[delIndex].budgetCategories.push(newCat);
    setCurrentGrant({ ...currentGrant, deliverables: dels });
  };

  const updateCategory = (delIndex: number, catIndex: number, field: keyof BudgetCategory, value: any) => {
    const dels = [...(currentGrant.deliverables || [])];
    dels[delIndex].budgetCategories[catIndex] = { ...dels[delIndex].budgetCategories[catIndex], [field]: value };
    setCurrentGrant({ ...currentGrant, deliverables: dels });
  };

  // --- Sub-Component Logic for Reports ---
  const addReport = () => {
    const newRep: ComplianceReport = { id: crypto.randomUUID(), title: '', dueDate: '', type: 'Financial', status: 'Pending' };
    setCurrentGrant({ ...currentGrant, reports: [...(currentGrant.reports || []), newRep] });
  };
  
  const updateReport = (index: number, field: keyof ComplianceReport, value: any) => {
    const reps = [...(currentGrant.reports || [])];
    reps[index] = { ...reps[index], [field]: value };
    setCurrentGrant({ ...currentGrant, reports: reps });
  };

  // Allocation Checks
  const totalAllocated = (currentGrant.deliverables || []).reduce((sum, d) => sum + (d.allocatedValue || 0), 0);
  const unallocated = (currentGrant.totalAward || 0) - totalAllocated;

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Grant Portfolio</h2>
          <button onClick={handleAddNew} className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            <Plus size={20} /> <span>Add New Grant</span>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {grants.map(grant => (
            <div key={grant.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{grant.name}</h3>
                <p className="text-slate-500 text-sm">{grant.funder}</p>
                <div className="mt-2 flex space-x-4 text-sm text-slate-600">
                   <span className="font-mono bg-slate-100 px-2 py-1 rounded">Award: ${grant.totalAward.toLocaleString()}</span>
                   <span>Deliverables: {grant.deliverables?.length || 0}</span>
                </div>
              </div>
              <button onClick={() => handleEdit(grant)} className="p-2 text-slate-400 hover:text-brand-600"><Edit2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h3 className="text-xl font-bold text-slate-800">{currentGrant.id ? 'Edit Grant' : 'New Grant'}</h3>
        <div className="flex space-x-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center"><Save size={18} className="mr-2"/> Save Grant</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'details' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Grant Details</button>
        <button onClick={() => setActiveTab('deliverables')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'deliverables' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Deliverables & Budget</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'reports' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Required Reports</button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <HighContrastInput label="Grant Name" value={currentGrant.name || ''} onChange={e => setCurrentGrant({...currentGrant, name: e.target.value})} />
            <HighContrastInput label="Funder" value={currentGrant.funder || ''} onChange={e => setCurrentGrant({...currentGrant, funder: e.target.value})} />
            <HighContrastTextArea label="Purpose / Abstract" rows={3} value={currentGrant.purpose || ''} onChange={e => setCurrentGrant({...currentGrant, purpose: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <HighContrastInput label="Total Award ($)" type="number" value={currentGrant.totalAward || 0} onChange={e => setCurrentGrant({...currentGrant, totalAward: parseFloat(e.target.value)})} />
              <HighContrastSelect label="Status" options={[{value:'Active',label:'Active'},{value:'Pending',label:'Pending'},{value:'Closed',label:'Closed'}]} value={currentGrant.status || 'Draft'} onChange={e => setCurrentGrant({...currentGrant, status: e.target.value as any})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <HighContrastInput label="Start Date" type="date" value={currentGrant.startDate || ''} onChange={e => setCurrentGrant({...currentGrant, startDate: e.target.value})} />
              <HighContrastInput label="End Date" type="date" value={currentGrant.endDate || ''} onChange={e => setCurrentGrant({...currentGrant, endDate: e.target.value})} />
            </div>
          </div>
        )}

        {/* DELIVERABLES TAB */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg flex justify-between items-center ${unallocated < 0 ? 'bg-red-100 text-red-800' : unallocated > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
               <span className="font-bold">Grant Total: ${currentGrant.totalAward?.toLocaleString()}</span>
               <span className="font-bold">Allocated: ${totalAllocated.toLocaleString()}</span>
               <span className="font-bold">Remaining: ${unallocated.toLocaleString()}</span>
            </div>

            {currentGrant.deliverables?.map((del, dIdx) => {
              const catTotal = del.budgetCategories.reduce((sum, c) => sum + (c.allocation || 0), 0);
              const catDiff = del.allocatedValue - catTotal;

              return (
                <div key={del.id} className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end">
                    <div className="w-24"><HighContrastInput label="Ref" value={del.sectionReference} onChange={e => updateDeliverable(dIdx, 'sectionReference', e.target.value)} /></div>
                    <div className="flex-1 min-w-[200px]"><HighContrastInput label="Deliverable Description" value={del.description} onChange={e => updateDeliverable(dIdx, 'description', e.target.value)} /></div>
                    <div className="w-32"><HighContrastInput label="Allocated ($)" type="number" value={del.allocatedValue} onChange={e => updateDeliverable(dIdx, 'allocatedValue', parseFloat(e.target.value))} /></div>
                    <div className="w-32"><HighContrastInput label="Due Date" type="date" value={del.dueDate} onChange={e => updateDeliverable(dIdx, 'dueDate', e.target.value)} /></div>
                    <button onClick={() => {const d = [...currentGrant.deliverables!]; d.splice(dIdx, 1); setCurrentGrant({...currentGrant, deliverables: d})}} className="text-red-500 p-2"><Trash2 size={20}/></button>
                  </div>
                  
                  {/* Nested Budget Categories */}
                  <div className="p-4 bg-slate-50/50">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                      <span>Budget Categories</span>
                      <span className={catDiff !== 0 ? "text-red-600" : "text-green-600"}>{catDiff === 0 ? "Fully Allocated" : `Unallocated: $${catDiff.toLocaleString()}`}</span>
                    </h5>
                    {del.budgetCategories.map((cat, cIdx) => (
                      <div key={cat.id} className="flex gap-2 mb-2 items-center">
                        <ChevronRight size={16} className="text-slate-400" />
                        <div className="flex-1"><HighContrastInput placeholder="Category Name (e.g. Travel)" value={cat.name} onChange={e => updateCategory(dIdx, cIdx, 'name', e.target.value)} /></div>
                        <div className="w-32"><HighContrastInput type="number" placeholder="Amount" value={cat.allocation} onChange={e => updateCategory(dIdx, cIdx, 'allocation', parseFloat(e.target.value))} /></div>
                        <div className="flex-1"><HighContrastInput placeholder="Purpose/Justification" value={cat.purpose} onChange={e => updateCategory(dIdx, cIdx, 'purpose', e.target.value)} /></div>
                        <button onClick={() => {const d = [...currentGrant.deliverables!]; d[dIdx].budgetCategories.splice(cIdx, 1); setCurrentGrant({...currentGrant, deliverables: d})}} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => addCategory(dIdx)} className="text-xs flex items-center text-brand-600 font-bold mt-2 hover:underline"><Plus size={14} className="mr-1"/> Add Budget Category</button>
                  </div>
                </div>
              )
            })}
            <button onClick={addDeliverable} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-brand-500 hover:text-brand-600 font-bold flex justify-center items-center"><Plus size={24} className="mr-2"/> Add New Deliverable</button>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
             {currentGrant.reports?.map((rep, idx) => (
               <div key={rep.id} className="bg-white p-4 border border-slate-200 rounded-lg flex gap-4 items-end">
                 <div className="flex-1"><HighContrastInput label="Report Title" value={rep.title} onChange={e => updateReport(idx, 'title', e.target.value)} /></div>
                 <div className="w-32"><HighContrastInput label="Due Date" type="date" value={rep.dueDate} onChange={e => updateReport(idx, 'dueDate', e.target.value)} /></div>
                 <div className="w-32"><HighContrastSelect label="Type" options={[{value:'Financial',label:'Financial'},{value:'Programmatic',label:'Programmatic'},{value:'Audit',label:'Audit'}]} value={rep.type} onChange={e => updateReport(idx, 'type', e.target.value)} /></div>
                 <div className="w-32"><HighContrastSelect label="Status" options={[{value:'Pending',label:'Pending'},{value:'Submitted',label:'Submitted'}]} value={rep.status} onChange={e => updateReport(idx, 'status', e.target.value)} /></div>
                 <button onClick={() => {const r = [...currentGrant.reports!]; r.splice(idx, 1); setCurrentGrant({...currentGrant, reports: r})}} className="text-red-500 p-2"><Trash2 size={20}/></button>
               </div>
             ))}
             <button onClick={addReport} className="w-full py-3 bg-slate-100 rounded-lg text-slate-600 font-bold hover:bg-slate-200">Add Required Report</button>
          </div>
        )}
      </div>
    </div>
  );
};