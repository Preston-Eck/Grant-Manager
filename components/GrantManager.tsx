import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus, Deliverable, ComplianceReport, BudgetCategory, Expenditure } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
// FIX: Added 'X' to imports
import { Plus, Edit2, Trash2, Save, Calendar, ChevronRight, ChevronDown, Paperclip, FileText, CheckCircle, X } from 'lucide-react';

interface GrantManagerProps {
  onNavigate?: (tab: string, data?: any) => void;
}

export const GrantManager: React.FC<GrantManagerProps> = ({ onNavigate }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'deliverables' | 'reports'>('details');

  const [expandedGrants, setExpandedGrants] = useState<Set<string>>(new Set());
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => { refreshData(); }, []);
  const refreshData = () => { 
      setGrants(db.getGrants());
      setExpenditures(db.getExpenditures());
  };

  // FIX: Properly typed the 'set' parameter so 'prev' is inferred correctly
  const toggleExpand = (id: string, set: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    set(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
  };

  const handleAddNew = () => {
    setCurrentGrant({ id: crypto.randomUUID(), status: GrantStatus.Active, totalAward: 0, deliverables: [], reports: [], attachments: [] });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleEdit = (grant: Grant) => {
    setCurrentGrant(JSON.parse(JSON.stringify(grant)));
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleSave = () => {
    if (currentGrant.name && currentGrant.id) {
      db.saveGrant(currentGrant as Grant);
      setIsEditing(false);
      refreshData();
    } else alert("Grant Name is required.");
  };

  const handleAddAttachment = async () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.onchange = async (e: any) => {
         const file = e.target.files[0];
         if(file && (window as any).electronAPI) {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                const path = await (window as any).electronAPI.saveReceipt(base64, file.name);
                setCurrentGrant(prev => ({...prev, attachments: [...(prev.attachments || []), path]}));
            };
            reader.readAsDataURL(file);
         }
     };
     input.click();
  };

  const getGrantStats = (g: Grant) => {
      const spent = expenditures.filter(e => e.grantId === g.id).reduce((s, e) => s + e.amount, 0);
      return { spent, remaining: (g.totalAward || 0) - spent };
  };

  const getDeliverableStats = (d: Deliverable) => {
      const spent = expenditures.filter(e => e.deliverableId === d.id).reduce((s, e) => s + e.amount, 0);
      return { spent, remaining: d.allocatedValue - spent };
  };

  const getCategoryStats = (cId: string, dId: string) => {
      const spent = expenditures.filter(e => e.categoryId === cId && e.deliverableId === dId).reduce((s, e) => s + e.amount, 0);
      return { spent };
  };

  const quickAddDeliverable = (g: Grant) => {
      const newDel: Deliverable = { id: crypto.randomUUID(), sectionReference: 'New Del', description: '', allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: [] };
      g.deliverables.push(newDel);
      db.saveGrant(g);
      refreshData();
      setExpandedGrants(new Set(expandedGrants.add(g.id)));
  };

  const quickAddCategory = (g: Grant, dIndex: number) => {
      const newCat: BudgetCategory = { id: crypto.randomUUID(), name: 'New Cat', allocation: 0, purpose: '' };
      g.deliverables[dIndex].budgetCategories.push(newCat);
      db.saveGrant(g);
      refreshData();
      setExpandedDeliverables(new Set(expandedDeliverables.add(g.deliverables[dIndex].id)));
  };

  const jumpToaddExpenditure = (gId: string, dId: string, cId: string) => {
      if(onNavigate) onNavigate('ingestion', { action: 'prefill', grantId: gId, deliverableId: dId, categoryId: cId });
  };

  const updateDeliverable = (idx:number, field: keyof Deliverable, val: any) => {
      const d = [...(currentGrant.deliverables || [])];
      d[idx] = { ...d[idx], [field]: val };
      setCurrentGrant({ ...currentGrant, deliverables: d });
  };

  const updateCategory = (dIdx:number, cIdx:number, field: keyof BudgetCategory, val: any) => {
      const d = [...(currentGrant.deliverables || [])];
      d[dIdx].budgetCategories[cIdx] = { ...d[dIdx].budgetCategories[cIdx], [field]: val };
      setCurrentGrant({ ...currentGrant, deliverables: d });
  };
  
  const updateReport = (idx:number, field: keyof ComplianceReport, val: any) => {
      const r = [...(currentGrant.reports || [])];
      r[idx] = { ...r[idx], [field]: val };
      setCurrentGrant({ ...currentGrant, reports: r });
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Grant Portfolio</h2>
          <button onClick={handleAddNew} className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            <Plus size={20} /> <span>Add New Grant</span>
          </button>
        </div>

        <div className="space-y-4">
          {grants.map(grant => {
            const gStats = getGrantStats(grant);
            const isExpanded = expandedGrants.has(grant.id);

            return (
              <div key={grant.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-center justify-between bg-slate-50 cursor-pointer hover:bg-slate-100" onClick={() => toggleExpand(grant.id, setExpandedGrants)}>
                   <div className="flex items-center space-x-3">
                       {isExpanded ? <ChevronDown size={20} className="text-slate-500"/> : <ChevronRight size={20} className="text-slate-500"/>}
                       <div>
                           <h3 className="font-bold text-lg text-slate-800">{grant.name}</h3>
                           <div className="text-xs text-slate-500">Award: ${grant.totalAward.toLocaleString()} • Spent: ${gStats.spent.toLocaleString()} • Remaining: ${gStats.remaining.toLocaleString()}</div>
                       </div>
                   </div>
                   <button onClick={(e) => {e.stopPropagation(); handleEdit(grant)}} className="p-2 text-slate-400 hover:text-brand-600"><Edit2 size={18}/></button>
                </div>

                {isExpanded && (
                    <div className="border-t border-slate-200">
                        {grant.deliverables.map((del, dIdx) => {
                            const dStats = getDeliverableStats(del);
                            const isDelExpanded = expandedDeliverables.has(del.id);

                            return (
                                <div key={del.id} className="border-b border-slate-100 last:border-0">
                                    <div className="p-3 pl-10 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(del.id, setExpandedDeliverables)}>
                                        <div className="flex items-center space-x-3">
                                            {isDelExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-sm text-slate-700">{del.sectionReference}: {del.description}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${del.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{del.status}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">Allocated: ${del.allocatedValue.toLocaleString()} • Spent: ${dStats.spent.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {isDelExpanded && (
                                        <div className="bg-slate-50/50 pl-20 pr-4 py-2">
                                            {del.budgetCategories.map((cat) => {
                                                const cStats = getCategoryStats(cat.id, del.id);
                                                const isCatExpanded = expandedCategories.has(cat.id);
                                                const catExpenditures = expenditures.filter(e => e.categoryId === cat.id && e.deliverableId === del.id);

                                                return (
                                                    <div key={cat.id} className="mb-2">
                                                        <div className="flex justify-between items-center text-sm py-1 cursor-pointer" onClick={() => toggleExpand(cat.id, setExpandedCategories)}>
                                                            <div className="flex items-center">
                                                                {isCatExpanded ? <ChevronDown size={14} className="text-slate-300 mr-2"/> : <ChevronRight size={14} className="text-slate-300 mr-2"/>}
                                                                <span className="font-medium text-slate-600">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <span className="text-xs text-slate-400 font-mono">${cStats.spent.toLocaleString()} / ${cat.allocation.toLocaleString()}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); jumpToaddExpenditure(grant.id, del.id, cat.id); }} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200">+ Exp</button>
                                                            </div>
                                                        </div>
                                                        
                                                        {isCatExpanded && (
                                                            <div className="pl-6 mt-1 space-y-1">
                                                                {catExpenditures.length === 0 && <div className="text-xs text-slate-400 italic">No expenditures yet.</div>}
                                                                {catExpenditures.map(e => (
                                                                    <div key={e.id} className="flex justify-between text-xs text-slate-500 border-l-2 border-slate-200 pl-2">
                                                                        <span>{e.date} - {e.vendor}</span>
                                                                        <span className="font-mono">${e.amount.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => quickAddCategory(grant, dIdx)} className="text-xs text-slate-400 hover:text-brand-600 flex items-center mt-2"><Plus size={12} className="mr-1"/> Add Budget Category</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="p-3 pl-10 bg-slate-50">
                             <button onClick={() => quickAddDeliverable(grant)} className="text-sm text-slate-500 hover:text-brand-600 flex items-center font-medium"><Plus size={16} className="mr-2"/> Add Deliverable</button>
                        </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h3 className="text-xl font-bold text-slate-800">{currentGrant.id ? 'Edit Grant' : 'New Grant'}</h3>
        <div className="flex space-x-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Close</button>
            <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center"><Save size={18} className="mr-2"/> Save</button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white">
        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'details' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Grant Details</button>
        <button onClick={() => setActiveTab('deliverables')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'deliverables' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Deliverables & Budget</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-3 font-medium text-sm ${activeTab === 'reports' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'}`}>Required Reports</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {activeTab === 'details' && (
          <div className="space-y-6 max-w-3xl mx-auto">
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
            
            <div className="pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-700 mb-2 flex items-center"><Paperclip size={18} className="mr-2"/> Attachments</h4>
                <div className="space-y-2 mb-3">
                    {currentGrant.attachments?.map((path, idx) => (
                        <div key={idx} className="flex items-center text-sm text-brand-600 bg-white p-2 border rounded">
                            <FileText size={16} className="mr-2"/>
                            <span className="truncate flex-1">{path.split(/[/\\]/).pop()}</span>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddAttachment} className="text-sm text-slate-500 hover:text-brand-600 underline">Add Document</button>
            </div>
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            {currentGrant.deliverables?.map((del, dIdx) => (
               <div key={del.id} className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end">
                    <div className="w-24"><HighContrastInput label="Ref" value={del.sectionReference} onChange={e => updateDeliverable(dIdx, 'sectionReference', e.target.value)} /></div>
                    <div className="flex-1 min-w-[200px]"><HighContrastInput label="Deliverable Description" value={del.description} onChange={e => updateDeliverable(dIdx, 'description', e.target.value)} /></div>
                    <div className="w-32"><HighContrastInput label="Allocated ($)" type="number" value={del.allocatedValue} onChange={e => updateDeliverable(dIdx, 'allocatedValue', parseFloat(e.target.value))} /></div>
                    <div className="w-32"><HighContrastSelect label="Status" options={[{value:'Pending',label:'Pending'},{value:'In Progress',label:'In Progress'},{value:'Completed',label:'Completed'}]} value={del.status} onChange={e => updateDeliverable(dIdx, 'status', e.target.value)} /></div>
                    <button onClick={() => {const d = [...currentGrant.deliverables!]; d.splice(dIdx, 1); setCurrentGrant({...currentGrant, deliverables: d})}} className="text-red-500 p-2"><Trash2 size={20}/></button>
                  </div>
                  <div className="p-4 bg-slate-50/50">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Budget Categories</h5>
                    {del.budgetCategories.map((cat, cIdx) => (
                      <div key={cat.id} className="flex gap-2 mb-2 items-center">
                        <ChevronRight size={16} className="text-slate-400" />
                        <div className="flex-1"><HighContrastInput placeholder="Category Name" value={cat.name} onChange={e => updateCategory(dIdx, cIdx, 'name', e.target.value)} /></div>
                        <div className="w-32"><HighContrastInput type="number" placeholder="Amount" value={cat.allocation} onChange={e => updateCategory(dIdx, cIdx, 'allocation', parseFloat(e.target.value))} /></div>
                        <div className="flex-1"><HighContrastInput placeholder="Purpose" value={cat.purpose} onChange={e => updateCategory(dIdx, cIdx, 'purpose', e.target.value)} /></div>
                        <button onClick={() => {const d = [...currentGrant.deliverables!]; d[dIdx].budgetCategories.splice(cIdx, 1); setCurrentGrant({...currentGrant, deliverables: d})}} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => {const d = [...currentGrant.deliverables!]; d[dIdx].budgetCategories.push({ id: crypto.randomUUID(), name: '', allocation: 0, purpose: '' }); setCurrentGrant({...currentGrant, deliverables: d})}} className="text-xs flex items-center text-brand-600 font-bold mt-2 hover:underline"><Plus size={14} className="mr-1"/> Add Budget Category</button>
                  </div>
               </div>
            ))}
            <button onClick={() => setCurrentGrant({...currentGrant, deliverables: [...(currentGrant.deliverables || []), { id: crypto.randomUUID(), sectionReference: '', description: '', allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: [] }]})} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-brand-500 hover:text-brand-600 font-bold flex justify-center items-center"><Plus size={24} className="mr-2"/> Add New Deliverable</button>
          </div>
        )}

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
             <button onClick={() => setCurrentGrant({...currentGrant, reports: [...(currentGrant.reports || []), { id: crypto.randomUUID(), title: '', dueDate: '', type: 'Financial', status: 'Pending' }]})} className="w-full py-3 bg-slate-100 rounded-lg text-slate-600 font-bold hover:bg-slate-200">Add Required Report</button>
          </div>
        )}
      </div>
    </div>
  );
};