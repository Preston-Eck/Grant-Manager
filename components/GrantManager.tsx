import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus, Deliverable, ComplianceReport, BudgetCategory, Expenditure, SubRecipient } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Plus, Edit2, Trash2, Save, ChevronRight, ChevronDown, Paperclip, FileText, X, Eye, User, FileDigit, Users, AlertTriangle, Check } from 'lucide-react';

interface GrantManagerProps {
  onNavigate?: (tab: string, data?: any) => void;
}

export const GrantManager: React.FC<GrantManagerProps> = ({ onNavigate }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'communities' | 'deliverables' | 'reports'>('details');

  // Expansion States
  const [expandedGrants, setExpandedGrants] = useState<Set<string>>(new Set());
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
  const [expandedSubRecipients, setExpandedSubRecipients] = useState<Set<string>>(new Set());
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedEditCommunities, setExpandedEditCommunities] = useState<Set<string>>(new Set());

  // Modal States
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
  const [isEditingExpenditure, setIsEditingExpenditure] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  // "Add Community" Modal
  const [addingCommunityTo, setAddingCommunityTo] = useState<string | null>(null);
  const [newCommunityForm, setNewCommunityForm] = useState({ name: '', allocation: 0 });

  // "Universal Edit" Modal
  const [editItem, setEditItem] = useState<{ 
      type: 'grant' | 'sub' | 'del' | 'cat', 
      id: string, 
      parentId?: string, 
      name: string, 
      amount?: number,
      onSave: (name: string, amount: number) => void 
  } | null>(null);

  useEffect(() => { refreshData(); }, []);
  const refreshData = () => { 
      setGrants(db.getGrants());
      setExpenditures(db.getExpenditures());
  };

  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    set(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
  };

  // --- Helpers for Safe Number Input ---
  const safeParseFloat = (value: string): number => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
  };

  // --- CRUD Handlers ---
  const handleAddNew = () => {
    setCurrentGrant({ id: crypto.randomUUID(), status: 'Active', totalAward: 0, deliverables: [], subRecipients: [], reports: [], attachments: [] });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleEdit = (grant: Grant) => {
    setCurrentGrant(JSON.parse(JSON.stringify(grant)));
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleDeleteGrant = (id: string, name: string) => {
      if (window.confirm(`Delete grant "${name}"? This cannot be undone.`)) {
          db.deleteGrant(id);
          refreshData();
      }
  };

  const handleSave = () => {
    if (currentGrant.name && currentGrant.id) {
      db.saveGrant(currentGrant as Grant);
      setIsEditing(false);
      refreshData();
    } else alert("Grant Name is required.");
  };

  // --- Sub-Recipient Logic ---
  const openAddCommunityModal = (grantId: string) => {
      setNewCommunityForm({ name: '', allocation: 0 });
      setAddingCommunityTo(grantId);
  };

  const confirmAddCommunity = () => {
      if (!addingCommunityTo || !newCommunityForm.name) return;
      const grantIndex = grants.findIndex(g => g.id === addingCommunityTo);
      if (grantIndex === -1) return;

      const grant = { ...grants[grantIndex] };
      if (!grant.subRecipients) grant.subRecipients = [];

      const newSub: SubRecipient = {
          id: crypto.randomUUID(),
          name: newCommunityForm.name,
          allocatedAmount: newCommunityForm.allocation || 0,
          deliverables: []
      };

      grant.subRecipients.push(newSub);
      db.saveGrant(grant);
      setAddingCommunityTo(null);
      refreshData();
  };

  const deleteSubRecipient = (grant: Grant, subId: string) => {
      if(window.confirm("Remove this community and all its data?")) {
          grant.subRecipients = grant.subRecipients.filter(s => s.id !== subId);
          db.saveGrant(grant);
          refreshData();
      }
  };

  // --- Universal Edit Logic ---
  const openEditModal = (type: 'grant' | 'sub' | 'del' | 'cat', item: any, onSave: (n: string, a: number) => void) => {
      setEditItem({
          type,
          id: item.id,
          name: item.name || item.description,
          amount: item.allocatedAmount || item.allocatedValue || item.allocation || 0,
          onSave
      });
  };

  const saveEditItem = () => {
      if(editItem) {
          editItem.onSave(editItem.name, editItem.amount || 0);
          setEditItem(null);
      }
  };

  // --- Expenditure Logic (New) ---
  const handleSaveExpenditure = () => {
      if (selectedExpenditure) {
          db.saveExpenditure(selectedExpenditure);
          setIsEditingExpenditure(false);
          refreshData();
      }
  };

  const handleDeleteExpenditure = () => {
      if (selectedExpenditure && window.confirm("Are you sure you want to delete this expenditure record?")) {
          db.deleteExpenditure(selectedExpenditure.id);
          setSelectedExpenditure(null);
          setIsEditingExpenditure(false);
          refreshData();
      }
  };

  // --- Calculations ---
  const getGrantStats = (g: Grant) => {
      const spent = expenditures.filter(e => e.grantId === g.id).reduce((s, e) => s + e.amount, 0);
      const primaryAllocated = (g.deliverables || []).reduce((sum, d) => sum + (d.allocatedValue || 0), 0);
      const subsAllocated = (g.subRecipients || []).reduce((sum, s) => sum + (s.allocatedAmount || 0), 0);
      const unassigned = (g.totalAward || 0) - primaryAllocated - subsAllocated;
      return { spent, remaining: (g.totalAward || 0) - spent, unassigned };
  };

  const getSubRecipientStats = (sub: SubRecipient, grantId: string) => {
      const spent = expenditures.filter(e => e.grantId === grantId && e.subRecipientId === sub.id).reduce((s, e) => s + e.amount, 0);
      const allocatedToDeliverables = (sub.deliverables || []).reduce((sum, d) => sum + (d.allocatedValue || 0), 0);
      const unassigned = (sub.allocatedAmount || 0) - allocatedToDeliverables;
      return { spent, unassigned };
  };

  const getDeliverableStats = (d: Deliverable) => {
      const spent = expenditures.filter(e => e.deliverableId === d.id).reduce((s, e) => s + e.amount, 0);
      const allocatedToCategories = (d.budgetCategories || []).reduce((sum, c) => sum + (c.allocation || 0), 0);
      const unassigned = (d.allocatedValue || 0) - allocatedToCategories;
      return { spent, remaining: (d.allocatedValue || 0) - spent, unassigned };
  };

  const getCategoryStats = (cId: string, dId: string) => {
      const spent = expenditures.filter(e => e.categoryId === cId && e.deliverableId === dId).reduce((s, e) => s + e.amount, 0);
      return { spent };
  };

  // --- Actions ---
  const quickAddDeliverable = (grant: Grant, subRecipientId?: string) => {
      const newDel: Deliverable = { id: crypto.randomUUID(), sectionReference: 'New', description: 'New Deliverable', allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: [] };
      if (subRecipientId) {
          const sub = grant.subRecipients.find(s => s.id === subRecipientId);
          if(sub) sub.deliverables.push(newDel);
      } else {
          if (!grant.deliverables) grant.deliverables = [];
          grant.deliverables.push(newDel);
      }
      db.saveGrant(grant);
      refreshData();
  };

  const quickAddCategory = (grant: Grant, dId: string, subRecipientId?: string) => {
      const newCat: BudgetCategory = { id: crypto.randomUUID(), name: 'New Category', allocation: 0, purpose: '' };
      let targetDeliverables = subRecipientId ? grant.subRecipients.find(s => s.id === subRecipientId)?.deliverables : grant.deliverables;
      if (!targetDeliverables) targetDeliverables = [];

      const del = targetDeliverables.find(d => d.id === dId);
      if (del) {
          if(!del.budgetCategories) del.budgetCategories = [];
          del.budgetCategories.push(newCat);
          db.saveGrant(grant);
          refreshData();
          setExpandedDeliverables(new Set(expandedDeliverables.add(dId)));
      }
  };

  const jumpToaddExpenditure = (gId: string, dId: string, cId: string, subId?: string) => {
      if(onNavigate) onNavigate('ingestion', { action: 'prefill', grantId: gId, subRecipientId: subId, deliverableId: dId, categoryId: cId });
  };

  // --- Handlers ---
  const handleViewReceipt = async (path: string) => {
    if ((window as any).electronAPI) {
        try {
            const dataUrl = await (window as any).electronAPI.readReceipt(path);
            if (dataUrl.startsWith('data:application/pdf')) {
                const base64 = dataUrl.split(',')[1];
                const binaryStr = window.atob(base64);
                const len = binaryStr.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binaryStr.charCodeAt(i); }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                setReceiptImage(blobUrl);
            } else {
                setReceiptImage(dataUrl);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Failed to load document.\n\nSystem Error: ${e.message || String(e)}\n\nPath: ${path}`);
        }
    } else {
        alert("File viewing is only available in the desktop app.");
    }
  };

  const closeReceiptViewer = () => {
      if (receiptImage && receiptImage.startsWith('blob:')) {
          URL.revokeObjectURL(receiptImage);
      }
      setReceiptImage(null);
  };

  const handleAddAttachment = async () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = ".pdf,.png,.jpg,.jpeg,.webp";
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

  const handleDeleteAttachment = (index: number) => {
      if (window.confirm("Are you sure you want to delete this attachment?")) {
          const newAttachments = [...(currentGrant.attachments || [])];
          newAttachments.splice(index, 1);
          setCurrentGrant({ ...currentGrant, attachments: newAttachments });
      }
  };

  // --- Sub-Components ---
  const DeliverablesEditor = ({ deliverables, onChange, title }: { deliverables: Deliverable[], onChange: (d: Deliverable[]) => void, title?: string }) => {
      const updateDel = (idx: number, field: keyof Deliverable, val: any) => {
          const updated = [...deliverables];
          updated[idx] = { ...updated[idx], [field]: val };
          onChange(updated);
      };
      const updateCat = (dIdx: number, cIdx: number, field: keyof BudgetCategory, val: any) => {
          const updated = [...deliverables];
          updated[dIdx].budgetCategories[cIdx] = { ...updated[dIdx].budgetCategories[cIdx], [field]: val };
          onChange(updated);
      };
      const addDel = () => { onChange([...deliverables, { id: crypto.randomUUID(), sectionReference: '', description: '', allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: [] }]); };
      const removeDel = (idx: number) => { const updated = [...deliverables]; updated.splice(idx, 1); onChange(updated); };

      return (
          <div className="space-y-6">
            {title && <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2">{title}</h4>}
            {deliverables.map((del, dIdx) => (
               <div key={del.id} className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end">
                    <div className="w-24"><HighContrastInput label="Ref" value={del.sectionReference} onChange={e => updateDel(dIdx, 'sectionReference', e.target.value)} /></div>
                    <div className="flex-1 min-w-[200px]"><HighContrastInput label="Description" value={del.description} onChange={e => updateDel(dIdx, 'description', e.target.value)} /></div>
                    <div className="w-32"><HighContrastInput label="Allocated ($)" type="number" value={del.allocatedValue || 0} onChange={e => updateDel(dIdx, 'allocatedValue', safeParseFloat(e.target.value))} /></div>
                    <div className="w-32"><HighContrastSelect label="Status" options={[{value:'Pending',label:'Pending'},{value:'In Progress',label:'In Progress'},{value:'Completed',label:'Completed'}]} value={del.status} onChange={e => updateDel(dIdx, 'status', e.target.value)} /></div>
                    <button onClick={() => removeDel(dIdx)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                  </div>
                  <div className="p-4 bg-slate-50/50">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Budget Categories</h5>
                    {del.budgetCategories?.map((cat, cIdx) => (
                      <div key={cat.id} className="flex gap-2 mb-2 items-center">
                        <ChevronRight size={16} className="text-slate-400" />
                        <div className="flex-1"><HighContrastInput placeholder="Category Name" value={cat.name} onChange={e => updateCat(dIdx, cIdx, 'name', e.target.value)} /></div>
                        <div className="w-32"><HighContrastInput type="number" placeholder="Amount" value={cat.allocation || 0} onChange={e => updateCat(dIdx, cIdx, 'allocation', safeParseFloat(e.target.value))} /></div>
                        <div className="flex-1"><HighContrastInput placeholder="Purpose" value={cat.purpose} onChange={e => updateCat(dIdx, cIdx, 'purpose', e.target.value)} /></div>
                        <button onClick={() => {const u = [...deliverables]; u[dIdx].budgetCategories.splice(cIdx, 1); onChange(u);}} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={() => {const u = [...deliverables]; u[dIdx].budgetCategories.push({ id: crypto.randomUUID(), name: '', allocation: 0, purpose: '' }); onChange(u);}} className="text-xs flex items-center text-brand-600 font-bold mt-2 hover:underline"><Plus size={14} className="mr-1"/> Add Budget Category</button>
                  </div>
               </div>
            ))}
            <button onClick={addDel} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-brand-500 hover:text-brand-600 font-bold flex justify-center items-center"><Plus size={20} className="mr-2"/> Add Deliverable</button>
          </div>
      );
  };

  const updateSubRecipient = (idx: number, field: keyof SubRecipient, val: any) => {
      const subs = [...(currentGrant.subRecipients || [])];
      subs[idx] = { ...subs[idx], [field]: val };
      setCurrentGrant({ ...currentGrant, subRecipients: subs });
  };
  
  const updateReport = (idx:number, field: keyof ComplianceReport, val: any) => {
      const r = [...(currentGrant.reports || [])];
      r[idx] = { ...r[idx], [field]: val };
      setCurrentGrant({ ...currentGrant, reports: r });
  };

  const renderDeliverableNode = (grant: Grant, del: Deliverable, subRecipientId?: string) => {
      const dStats = getDeliverableStats(del);
      const isDelExpanded = expandedDeliverables.has(del.id);

      return (
        <div key={del.id} className="border-b border-slate-100 last:border-0 bg-white">
            <div className="p-3 pl-8 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => toggle(del.id, setExpandedDeliverables)}>
                <div className="flex items-center space-x-3">
                    {isDelExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-700">{del.sectionReference}: {del.description}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${del.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{del.status}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex space-x-2">
                            <span>Allocated: ${(del.allocatedValue || 0).toLocaleString()}</span>
                            <span className={dStats.unassigned < 0 ? 'text-red-600' : ''}>Unassigned: ${(dStats.unassigned || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-1">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal('del', del, (n, a) => {
                                del.description = n;
                                del.allocatedValue = a;
                                db.saveGrant(grant);
                                refreshData();
                            });
                        }} 
                        className="p-1 text-slate-300 hover:text-brand-600"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm("Delete deliverable?")) {
                                if(subRecipientId) {
                                    const sub = grant.subRecipients.find(s => s.id === subRecipientId);
                                    if(sub) sub.deliverables = sub.deliverables.filter(d => d.id !== del.id);
                                } else {
                                    grant.deliverables = grant.deliverables.filter(d => d.id !== del.id);
                                }
                                db.saveGrant(grant);
                                refreshData();
                            }
                        }} 
                        className="p-1 text-slate-300 hover:text-red-500"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isDelExpanded && (
                <div className="bg-slate-50/50 pl-16 pr-4 py-2 border-t border-slate-100">
                    {del.budgetCategories?.map((cat) => {
                        const cStats = getCategoryStats(cat.id, del.id);
                        const isCatExpanded = expandedCategories.has(cat.id);
                        const catExpenditures = expenditures.filter(e => e.categoryId === cat.id && e.deliverableId === del.id);

                        return (
                            <div key={cat.id} className="mb-2">
                                <div className="flex justify-between items-center text-sm py-1 cursor-pointer hover:bg-slate-100 rounded px-1" onClick={() => toggle(cat.id, setExpandedCategories)}>
                                    <div className="flex items-center">
                                        {isCatExpanded ? <ChevronDown size={14} className="text-slate-400 mr-2"/> : <ChevronRight size={14} className="text-slate-400 mr-2"/>}
                                        <span className="font-medium text-slate-600">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-slate-400 font-mono mr-2">${(cStats.spent || 0).toLocaleString()} / {(cat.allocation || 0).toLocaleString()}</span>
                                        <button onClick={(e) => { e.stopPropagation(); jumpToaddExpenditure(grant.id, del.id, cat.id, subRecipientId); }} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200">+ Exp</button>
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal('cat', cat, (n, a) => {
                                                    cat.name = n;
                                                    cat.allocation = a;
                                                    db.saveGrant(grant);
                                                    refreshData();
                                                });
                                            }} 
                                            className="text-slate-300 hover:text-brand-600 ml-1"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(window.confirm("Delete category?")) {
                                                    del.budgetCategories = del.budgetCategories.filter(c => c.id !== cat.id);
                                                    db.saveGrant(grant);
                                                    refreshData();
                                                }
                                            }} 
                                            className="text-slate-300 hover:text-red-500 ml-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                
                                {isCatExpanded && (
                                    <div className="pl-6 mt-1">
                                        {catExpenditures.map(e => (
                                            <div key={e.id} onClick={() => { setSelectedExpenditure(e); setIsEditingExpenditure(false); }} className="flex text-xs text-slate-600 border-l-2 border-slate-200 pl-2 cursor-pointer hover:bg-white hover:text-brand-600 transition-colors py-1 items-center">
                                                <div className="w-24">{e.date}</div>
                                                <div className="flex-1 truncate pr-2">{e.vendor}</div>
                                                <div className="flex-1 truncate pr-2">{e.purchaser || '-'}</div>
                                                <div className="w-20 text-right font-mono">${e.amount.toFixed(2)}</div>
                                            </div>
                                        ))}
                                        {catExpenditures.length === 0 && <div className="text-xs text-slate-400 italic">No expenditures yet.</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button onClick={() => quickAddCategory(grant, del.id, subRecipientId)} className="text-xs text-slate-400 hover:text-brand-600 flex items-center mt-2"><Plus size={12} className="mr-1"/> Add Budget Category</button>
                </div>
            )}
        </div>
      );
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
            const primaryContextId = `${grant.id}-primary`;
            const communityContextId = `${grant.id}-community`;

            return (
              <div key={grant.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Level 1: Grant Header */}
                <div className="p-4 flex items-center justify-between bg-slate-50 cursor-pointer hover:bg-slate-100" onClick={() => toggle(grant.id, setExpandedGrants)}>
                   <div className="flex items-center space-x-3">
                       {isExpanded ? <ChevronDown size={20} className="text-slate-500"/> : <ChevronRight size={20} className="text-slate-500"/>}
                       <div>
                           <h3 className="font-bold text-lg text-slate-800">{grant.name}</h3>
                           <div className="text-xs text-slate-500 flex space-x-3">
                                <span>Award: <strong>${(grant.totalAward || 0).toLocaleString()}</strong></span>
                                <span className={gStats.unassigned < 0 ? 'text-red-600 font-bold' : ''}>Unallocated: ${(gStats.unassigned || 0).toLocaleString()}</span>
                                <span>Total Spent: ${(gStats.spent || 0).toLocaleString()}</span>
                           </div>
                       </div>
                   </div>
                   <div className="flex space-x-1">
                        <button onClick={(e) => {e.stopPropagation(); handleEdit(grant)}} className="p-2 text-slate-400 hover:text-brand-600"><Edit2 size={18}/></button>
                        <button onClick={(e) => {e.stopPropagation(); handleDeleteGrant(grant.id, grant.name)}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                   </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/30">
                        <div className="border-b border-slate-200">
                            <div className="flex items-center p-3 bg-slate-100 cursor-pointer hover:bg-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wide" onClick={() => toggle(primaryContextId, setExpandedContexts)}>
                                {expandedContexts.has(primaryContextId) ? <ChevronDown size={14} className="mr-2"/> : <ChevronRight size={14} className="mr-2"/>}
                                Primary Grant Activities
                            </div>
                            {expandedContexts.has(primaryContextId) && (
                                <div className="pl-4">
                                    {grant.deliverables?.map(del => renderDeliverableNode(grant, del))}
                                    <div className="p-3">
                                        <button onClick={() => quickAddDeliverable(grant)} className="text-sm text-slate-500 hover:text-brand-600 flex items-center font-medium"><Plus size={16} className="mr-2"/> Add Primary Deliverable</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between p-3 bg-slate-100 cursor-pointer hover:bg-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wide" onClick={() => toggle(communityContextId, setExpandedContexts)}>
                                <div className="flex items-center">
                                    {expandedContexts.has(communityContextId) ? <ChevronDown size={14} className="mr-2"/> : <ChevronRight size={14} className="mr-2"/>}
                                    Community Distributions / Sub-Recipients
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); openAddCommunityModal(grant.id); }} className="text-brand-600 hover:text-brand-800"><Plus size={16}/></button>
                            </div>

                            {expandedContexts.has(communityContextId) && (
                                <div className="pl-4">
                                    {grant.subRecipients?.length === 0 && <div className="p-4 text-sm text-slate-400 italic">No communities added yet. Click '+' to add one.</div>}
                                    {grant.subRecipients?.map(sub => {
                                        const sStats = getSubRecipientStats(sub, grant.id);
                                        const isSubExpanded = expandedSubRecipients.has(sub.id);
                                        return (
                                            <div key={sub.id} className="border-b border-slate-200 bg-white m-2 rounded border overflow-hidden">
                                                <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggle(sub.id, setExpandedSubRecipients)}>
                                                    <div className="flex items-center space-x-3">
                                                        {isSubExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-700 flex items-center"><Users size={14} className="mr-2 text-brand-500"/> {sub.name}</div>
                                                            <div className="text-xs text-slate-400 flex space-x-3">
                                                                <span>Allocated: ${(sub.allocatedAmount || 0).toLocaleString()}</span>
                                                                <span className={sStats.unassigned < 0 ? 'text-red-500' : ''}>Unassigned: ${(sStats.unassigned || 0).toLocaleString()}</span>
                                                                <span>Spent: ${(sStats.spent || 0).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openEditModal('sub', sub, (n, a) => { sub.name = n; sub.allocatedAmount = a; db.saveGrant(grant); refreshData(); }); }} className="text-slate-300 hover:text-brand-600 p-1"><Edit2 size={16} /></button>
                                                        <button onClick={(e) => {e.stopPropagation(); deleteSubRecipient(grant, sub.id)}} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                                {isSubExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50 pl-4">
                                                        {sub.deliverables?.map(del => renderDeliverableNode(grant, del, sub.id))}
                                                        <div className="p-3">
                                                            <button onClick={() => quickAddDeliverable(grant, sub.id)} className="text-sm text-slate-500 hover:text-brand-600 flex items-center font-medium"><Plus size={16} className="mr-2"/> Add Community Deliverable</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- MODALS --- */}
        {addingCommunityTo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAddingCommunityTo(null)}>
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Add Sub-Recipient</h3>
                    <div className="space-y-4">
                        <HighContrastInput label="Community / Entity Name" value={newCommunityForm.name} onChange={e => setNewCommunityForm({...newCommunityForm, name: e.target.value})} autoFocus />
                        <HighContrastInput label="Allocated Funds ($)" type="number" value={newCommunityForm.allocation} onChange={e => setNewCommunityForm({...newCommunityForm, allocation: safeParseFloat(e.target.value)})} />
                        <button onClick={confirmAddCommunity} className="w-full bg-brand-600 text-white font-bold py-2 rounded-lg hover:bg-brand-700">Add Community</button>
                    </div>
                </div>
            </div>
        )}

        {editItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditItem(null)}>
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Item</h3>
                    <div className="space-y-4">
                        <HighContrastInput label="Name / Description" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} autoFocus />
                        <HighContrastInput label="Allocation ($)" type="number" value={editItem.amount} onChange={e => setEditItem({...editItem, amount: safeParseFloat(e.target.value)})} />
                        <div className="flex gap-2">
                            <button onClick={() => setEditItem(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200">Cancel</button>
                            <button onClick={saveEditItem} className="flex-1 bg-brand-600 text-white font-bold py-2 rounded-lg hover:bg-brand-700">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {selectedExpenditure && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedExpenditure(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{isEditingExpenditure ? 'Edit Expenditure' : 'Expenditure Details'}</h3>
                        <div className="flex gap-2">
                            {!isEditingExpenditure && (
                                <>
                                    <button onClick={() => setIsEditingExpenditure(true)} className="text-slate-400 hover:text-brand-600" title="Edit"><Edit2 size={18}/></button>
                                    <button onClick={handleDeleteExpenditure} className="text-slate-400 hover:text-red-600" title="Delete"><Trash2 size={18}/></button>
                                </>
                            )}
                            <button onClick={() => setSelectedExpenditure(null)} className="text-slate-400 hover:text-slate-600 ml-2"><X size={20}/></button>
                        </div>
                    </div>
                    
                    {isEditingExpenditure ? (
                        <div className="p-6 space-y-4">
                            <HighContrastInput label="Date" type="date" value={selectedExpenditure.date} onChange={e => setSelectedExpenditure({...selectedExpenditure, date: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <HighContrastInput label="Amount ($)" type="number" value={selectedExpenditure.amount} onChange={e => setSelectedExpenditure({...selectedExpenditure, amount: safeParseFloat(e.target.value)})} />
                                <HighContrastSelect label="Funding Source" options={[{value: 'Grant', label: 'Grant'}, {value: 'Match', label: 'Match'}, {value: 'Third-Party', label: 'Third-Party'}]} value={selectedExpenditure.fundingSource} onChange={e => setSelectedExpenditure({...selectedExpenditure, fundingSource: e.target.value as any})} />
                            </div>
                            <HighContrastInput label="Vendor" value={selectedExpenditure.vendor} onChange={e => setSelectedExpenditure({...selectedExpenditure, vendor: e.target.value})} />
                            <HighContrastInput label="Purchaser" value={selectedExpenditure.purchaser} onChange={e => setSelectedExpenditure({...selectedExpenditure, purchaser: e.target.value})} />
                            <HighContrastTextArea label="Justification" value={selectedExpenditure.justification} onChange={e => setSelectedExpenditure({...selectedExpenditure, justification: e.target.value})} />
                            <HighContrastTextArea label="Notes" value={selectedExpenditure.notes} onChange={e => setSelectedExpenditure({...selectedExpenditure, notes: e.target.value})} />
                            
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setIsEditingExpenditure(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-200">Cancel</button>
                                <button onClick={handleSaveExpenditure} className="flex-1 bg-brand-600 text-white font-bold py-2 rounded-lg hover:bg-brand-700">Save Changes</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                                    <div className="text-slate-800">{selectedExpenditure.date}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                                    <div className="text-slate-800 font-mono font-bold">${(selectedExpenditure.amount || 0).toLocaleString()}</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                                <div className="text-slate-800 flex items-center"><FileDigit size={16} className="mr-2 text-slate-400"/> {selectedExpenditure.vendor}</div>
                            </div>
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Purchaser</label>
                                <div className="text-slate-800 flex items-center"><User size={16} className="mr-2 text-slate-400"/> {selectedExpenditure.purchaser || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Justification</label>
                                <div className="text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">{selectedExpenditure.justification || 'No justification provided.'}</div>
                            </div>
                            {selectedExpenditure.notes && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                                    <div className="text-slate-600 text-sm italic">{selectedExpenditure.notes}</div>
                                </div>
                            )}
                            {selectedExpenditure.receiptUrl ? (
                                <button 
                                    onClick={() => handleViewReceipt(selectedExpenditure.receiptUrl!)}
                                    className="w-full py-3 mt-2 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 hover:bg-brand-100 flex justify-center items-center"
                                >
                                    <Eye size={18} className="mr-2"/> View Receipt
                                </button>
                            ) : (
                                <div className="text-center py-3 bg-slate-50 text-slate-400 rounded-lg text-sm">No receipt attached</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {receiptImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={closeReceiptViewer}>
                <div className="relative w-full max-w-5xl h-[85vh] flex flex-col justify-center" onClick={e => e.stopPropagation()}>
                     <button onClick={closeReceiptViewer} className="absolute -top-10 right-0 text-white hover:text-red-400"><X size={32}/></button>
                     {receiptImage.startsWith('blob:') || receiptImage.startsWith('data:application/pdf') ? (
                        <iframe src={receiptImage} className="w-full h-full bg-white rounded-lg shadow-2xl" title="Document Viewer" />
                     ) : (
                        <img src={receiptImage} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl mx-auto" />
                     )}
                </div>
            </div>
        )}
    </div>
  );
};