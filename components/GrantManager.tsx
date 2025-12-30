import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus, Deliverable, BudgetCategory, Expenditure, SubRecipient } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Plus, Edit2, Trash2, Save, ChevronRight, ChevronDown, Users, LayoutList, ArrowLeft, X } from 'lucide-react';
import { getGrantStats, getDeliverableStats, getSubRecipientStats, getCategoryStats, getSubAwardPotStats } from '../utils/financialCalculations';

interface GrantManagerProps {
  onNavigate?: (tab: string, data?: any) => void;
}

// --- Deliverables Modal Editor ---
const DeliverablesEditor = ({ deliverables, onChange, title, readOnly = false }: { deliverables: Deliverable[], onChange: (d: Deliverable[]) => void, title?: string, readOnly?: boolean }) => {
    const [editingDel, setEditingDel] = useState<Deliverable | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openEdit = (del: Deliverable) => { setEditingDel({ ...del }); setIsModalOpen(true); };
    
    const openNew = () => {
        setEditingDel({
            id: crypto.randomUUID(),
            type: 'Standard', 
            sectionReference: '',
            description: '',
            allocatedValue: 0,
            dueDate: '',
            status: 'Pending',
            budgetCategories: []
        });
        setIsModalOpen(true);
    };

    const save = () => {
        if (!editingDel) return;
        const idx = deliverables.findIndex(d => d.id === editingDel.id);
        const updated = [...deliverables];
        if (idx >= 0) updated[idx] = editingDel; else updated.push(editingDel);
        onChange(updated);
        setIsModalOpen(false);
    };

    const isSubAward = editingDel?.type === 'SubAward';

    return (
        <div className="space-y-4">
            {title && <h4 className="text-sm font-bold text-slate-500 uppercase border-b border-slate-200 pb-2">{title}</h4>}
            {deliverables.map(del => (
                <div key={del.id} className="bg-white border border-slate-200 rounded p-3 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-sm text-slate-700">{del.sectionReference}: {del.description}</div>
                        <div className="text-xs text-slate-500 flex gap-3">
                            <span>Allocated: ${del.allocatedValue.toLocaleString()}</span>
                            <span>Status: {del.status}</span>
                        </div>
                    </div>
                    {!readOnly && (
                        <div className="flex gap-1">
                            <button onClick={() => openEdit(del)} className="p-2 bg-slate-100 rounded hover:text-brand-600"><Edit2 size={16}/></button>
                            <button onClick={() => { if(confirm('Delete?')) onChange(deliverables.filter(d => d.id !== del.id)); }} className="p-2 bg-slate-100 rounded hover:text-red-600"><Trash2 size={16}/></button>
                        </div>
                    )}
                </div>
            ))}
            {!readOnly && (
                <button onClick={openNew} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 font-bold flex justify-center items-center hover:border-brand-500 hover:text-brand-600"><Plus size={18} className="mr-2"/> Add Deliverable</button>
            )}

            {isModalOpen && editingDel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="text-xl font-bold">Edit Deliverable</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1"><HighContrastInput label="Ref" value={editingDel.sectionReference} onChange={e => setEditingDel({...editingDel, sectionReference: e.target.value})} /></div>
                            <div className="col-span-3"><HighContrastInput label="Description" value={editingDel.description} onChange={e => setEditingDel({...editingDel, description: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <HighContrastInput label="Allocated ($)" type="number" value={editingDel.allocatedValue} onChange={e => setEditingDel({...editingDel, allocatedValue: parseFloat(e.target.value) || 0})} />
                            <HighContrastSelect label="Status" options={['Pending','In Progress','Completed','Deferred'].map(s=>({value:s, label:s}))} value={editingDel.status} onChange={e => setEditingDel({...editingDel, status: e.target.value as any})} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <HighContrastInput label="Start Date" type="date" value={editingDel.startDate||''} onChange={e => setEditingDel({...editingDel, startDate: e.target.value})} />
                            <HighContrastInput label="End Date" type="date" value={editingDel.endDate||''} onChange={e => setEditingDel({...editingDel, endDate: e.target.value})} />
                            <HighContrastInput label="Completion" type="date" value={editingDel.completionDate||''} onChange={e => setEditingDel({...editingDel, completionDate: e.target.value})} />
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded border">
                             <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Budget Categories</h4>
                             {isSubAward ? (
                                 <p className="text-sm text-slate-400 italic">Disabled for Sub-Awards.</p>
                             ) : (
                                 <div className="space-y-2">
                                     {editingDel.budgetCategories.map((cat, i) => (
                                         <div key={cat.id} className="flex gap-2">
                                             <div className="flex-1"><HighContrastInput placeholder="Name" value={cat.name} onChange={e => {const c=[...editingDel.budgetCategories]; c[i].name=e.target.value; setEditingDel({...editingDel, budgetCategories:c})}} /></div>
                                             <div className="w-24"><HighContrastInput type="number" value={cat.allocation} onChange={e => {const c=[...editingDel.budgetCategories]; c[i].allocation=parseFloat(e.target.value)||0; setEditingDel({...editingDel, budgetCategories:c})}} /></div>
                                             <button onClick={() => {const c=[...editingDel.budgetCategories]; c.splice(i,1); setEditingDel({...editingDel, budgetCategories:c})}}><X size={16}/></button>
                                         </div>
                                     ))}
                                     <button onClick={() => setEditingDel({...editingDel, budgetCategories: [...editingDel.budgetCategories, {id:crypto.randomUUID(), name:'', allocation:0, purpose:''}]})} className="text-xs text-brand-600 font-bold">+ Add Category</button>
                                 </div>
                             )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold">Cancel</button>
                            <button onClick={save} className="px-6 py-2 bg-brand-600 text-white font-bold rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const GrantManager: React.FC<GrantManagerProps> = ({ onNavigate }) => {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});
    const [activeTab, setActiveTab] = useState<'details' | 'communities' | 'deliverables'>('details');

    // UI States for Tree View
    const [expandedGrants, setExpandedGrants] = useState<Set<string>>(new Set());
    const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
    const [expandedSubRecipients, setExpandedSubRecipients] = useState<Set<string>>(new Set());
    const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    
    // Inline Edit State for View Mode
    const [editItem, setEditItem] = useState<{ type: string, id: string, name: string, amount: number, onSave: (n:string, a:number)=>void } | null>(null);

    useEffect(() => { refresh(); }, []);
    const refresh = () => { setGrants(db.getGrants()); setExpenditures(db.getExpenditures()); };
    const toggle = (id: string, set: any) => set((prev: any) => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });

    // --- Action Handlers ---
    const handleAddNew = () => {
        const subAwardDel: Deliverable = {
            id: crypto.randomUUID(),
            type: 'SubAward',
            sectionReference: '0.0',
            description: 'Sub-Award Pool',
            allocatedValue: 0,
            dueDate: '',
            status: 'Pending',
            budgetCategories: []
        };
        setCurrentGrant({ id: crypto.randomUUID(), status: 'Active', totalAward: 0, deliverables: [subAwardDel], subRecipients: [] });
        setIsEditing(true);
        setActiveTab('details');
    };

    const handleEdit = (grant: Grant) => {
        setCurrentGrant(JSON.parse(JSON.stringify(grant)));
        setIsEditing(true);
        setActiveTab('details');
    };

    const handleSave = async () => {
        if(currentGrant.name && currentGrant.id) {
            await db.saveGrant(currentGrant as Grant);
            setIsEditing(false);
            refresh();
        }
    };

    const handleDeleteGrant = async (id: string, name: string) => {
        if(confirm(`Delete ${name}?`)) {
            await db.deleteGrant(id);
            refresh();
        }
    };

    const openEditModal = (type: string, item: any, onSave: (n:string, a:number)=>void) => {
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
            editItem.onSave(editItem.name, editItem.amount);
            setEditItem(null);
        }
    };

    const deleteSubRecipient = async (grant: Grant, subId: string) => {
        if(confirm("Remove this community?")) {
            grant.subRecipients = grant.subRecipients.filter(s => s.id !== subId);
            await db.saveGrant(grant);
            refresh();
        }
    };

    const jumpToaddExpenditure = (gId: string, dId: string, cId: string, subId?: string) => {
        if(onNavigate) onNavigate('ingestion', { action: 'prefill', grantId: gId, subRecipientId: subId, deliverableId: dId, categoryId: cId });
    };

    const quickAddCategory = async (grant: Grant, dId: string, subRecipientId?: string) => {
        const targetDels = subRecipientId 
            ? grant.subRecipients.find(s => s.id === subRecipientId)?.deliverables 
            : grant.deliverables;
        
        const del = targetDels?.find(d => d.id === dId);
        if(del) {
            if(del.type === 'SubAward') return alert("Cannot add categories to Sub-Award.");
            del.budgetCategories.push({id: crypto.randomUUID(), name: 'New Cat', allocation: 0, purpose: ''});
            await db.saveGrant(grant);
            refresh();
            setExpandedDeliverables(prev => new Set(prev).add(dId));
        }
    };

    const quickAddDeliverable = async (grant: Grant, subRecipientId?: string) => {
        const newDel: Deliverable = {
            id: crypto.randomUUID(), type: 'Standard', sectionReference: 'New', description: 'New Deliverable',
            allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: []
        };
        
        if(subRecipientId) {
            const sub = grant.subRecipients.find(s => s.id === subRecipientId);
            if(sub) sub.deliverables.push(newDel);
        } else {
            grant.deliverables.push(newDel);
        }
        await db.saveGrant(grant);
        refresh();
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={() => setIsEditing(false)} className="flex items-center text-slate-500 font-bold"><ArrowLeft className="mr-2"/> Back</button>
                    <button onClick={handleSave} className="bg-brand-600 text-white px-6 py-2 rounded font-bold flex items-center"><Save className="mr-2"/> Save</button>
                </div>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="flex border-b bg-slate-50">
                        {['details','communities','deliverables'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 font-bold uppercase text-sm ${activeTab===t ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-500'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-4 max-w-2xl">
                                <HighContrastInput label="Name" value={currentGrant.name} onChange={e => setCurrentGrant({...currentGrant, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <HighContrastInput type="number" label="Total Award" value={currentGrant.totalAward} onChange={e => setCurrentGrant({...currentGrant, totalAward: parseFloat(e.target.value)||0})} />
                                    <HighContrastSelect label="Status" options={['Draft','Active','Closed'].map(s => ({value:s, label:s}))} value={currentGrant.status} onChange={e => setCurrentGrant({...currentGrant, status: e.target.value as any})} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'communities' && (
                            <div className="space-y-4">
                                {currentGrant.subRecipients?.map((sub, i) => (
                                    <div key={sub.id} className="border p-4 rounded bg-slate-50 relative">
                                        <button onClick={() => { const s = [...(currentGrant.subRecipients||[])]; s.splice(i,1); setCurrentGrant({...currentGrant, subRecipients:s}) }} className="absolute top-2 right-2"><X/></button>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <HighContrastInput label="Name" value={sub.name} onChange={e => { const s = [...(currentGrant.subRecipients||[])]; s[i].name=e.target.value; setCurrentGrant({...currentGrant, subRecipients:s}) }} />
                                            <HighContrastInput label="Allocation" type="number" value={sub.allocatedAmount} onChange={e => { const s = [...(currentGrant.subRecipients||[])]; s[i].allocatedAmount=parseFloat(e.target.value)||0; setCurrentGrant({...currentGrant, subRecipients:s}) }} />
                                        </div>
                                        <DeliverablesEditor 
                                            title="Community Deliverables" 
                                            deliverables={sub.deliverables} 
                                            onChange={d => { const s = [...(currentGrant.subRecipients||[])]; s[i].deliverables=d; setCurrentGrant({...currentGrant, subRecipients:s}) }}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => setCurrentGrant({...currentGrant, subRecipients: [...(currentGrant.subRecipients||[]), {id:crypto.randomUUID(), name:'New Community', allocatedAmount:0, deliverables:[]}]})} className="text-brand-600 font-bold">+ Add Community</button>
                            </div>
                        )}
                        {activeTab === 'deliverables' && (
                             <div className="space-y-8">
                                <DeliverablesEditor 
                                    title="Primary Grant Deliverables" 
                                    deliverables={(currentGrant.deliverables || []).filter(d => d.type !== 'SubAward')} 
                                    onChange={updated => {
                                        const subAward = currentGrant.deliverables?.find(d => d.type === 'SubAward');
                                        const newDels = subAward ? [...updated, subAward] : updated;
                                        setCurrentGrant({...currentGrant, deliverables: newDels});
                                    }}
                                />
                                <div className="bg-slate-50 p-4 border rounded">
                                    <h4 className="font-bold text-slate-700 mb-2">Sub-Award Pool Configuration</h4>
                                    <p className="text-sm text-slate-500 mb-4">Total amount set aside for community distributions.</p>
                                    <HighContrastInput 
                                        label="Total Sub-Award Allocation" 
                                        type="number"
                                        value={currentGrant.deliverables?.find(d => d.type === 'SubAward')?.allocatedValue || 0}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const dels = [...(currentGrant.deliverables || [])];
                                            const idx = dels.findIndex(d => d.type === 'SubAward');
                                            if (idx >= 0) dels[idx].allocatedValue = val;
                                            setCurrentGrant({...currentGrant, deliverables: dels});
                                        }}
                                    />
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold">Grant Portfolio</h2>
                <button onClick={handleAddNew} className="bg-brand-600 text-white px-4 py-2 rounded font-bold flex items-center"><Plus className="mr-2"/> Add Grant</button>
            </div>
            <div className="space-y-4">
                {grants.map(grant => {
                    const stats = getGrantStats(grant, expenditures);
                    const subAwardStats = getSubAwardPotStats(grant, expenditures);
                    const isExpanded = expandedGrants.has(grant.id);

                    return (
                        <div key={grant.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                             <div className="p-4 flex items-center cursor-pointer hover:bg-slate-50" onClick={() => toggle(grant.id, setExpandedGrants)}>
                                 {isExpanded ? <ChevronDown className="mr-3 text-slate-400"/> : <ChevronRight className="mr-3 text-slate-400"/>}
                                 <div className="flex-1">
                                     <h3 className="font-bold text-lg">{grant.name}</h3>
                                     <div className="text-xs text-slate-500 flex gap-4">
                                         <span>Award: ${grant.totalAward.toLocaleString()}</span>
                                         <span>Spent: ${stats.totalSpent.toLocaleString()}</span>
                                         <span className={stats.unassigned < 0 ? 'text-red-600 font-bold' : ''}>Unassigned: ${stats.unassigned.toLocaleString()}</span>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <select 
                                        className="text-xs uppercase font-bold border rounded px-2 py-1"
                                        value={grant.status} 
                                        onClick={e => e.stopPropagation()} 
                                        onChange={async e => { const g={...grant, status:e.target.value as any}; await db.saveGrant(g); refresh(); }}
                                     >
                                         {['Active','Pending','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                     <button onClick={e => {e.stopPropagation(); handleEdit(grant)}} className="p-2 text-slate-400 hover:text-brand-600"><Edit2 size={18}/></button>
                                     <button onClick={e => {e.stopPropagation(); handleDeleteGrant(grant.id, grant.name)}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                                 </div>
                             </div>

                             {isExpanded && (
                                 <div className="border-t bg-slate-50/50">
                                     {/* Primary Deliverables */}
                                     <div className="p-2 pl-4 border-b">
                                         <div className="flex justify-between items-center mb-2 px-2 pt-2">
                                            <div className="font-bold text-xs text-slate-500 uppercase">Primary Deliverables</div>
                                            <button onClick={() => quickAddDeliverable(grant)} className="text-xs text-brand-600 font-bold flex items-center"><Plus size={12}/> Add</button>
                                         </div>
                                         {grant.deliverables.filter(d => d.type !== 'SubAward').map(del => {
                                             const dStat = getDeliverableStats(del, expenditures);
                                             const isDelExpanded = expandedDeliverables.has(del.id);
                                             return (
                                                 <div key={del.id} className="mb-2">
                                                     <div className="flex justify-between items-center p-2 bg-white border rounded hover:bg-slate-50 cursor-pointer" onClick={() => toggle(del.id, setExpandedDeliverables)}>
                                                        <div className="flex items-center gap-2">
                                                            {isDelExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                                            <div className="text-sm font-medium">{del.sectionReference}: {del.description}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span>${dStat.spent.toLocaleString()} / ${del.allocatedValue.toLocaleString()}</span>
                                                            <select 
                                                                className="border rounded px-1 py-0.5"
                                                                value={del.status} 
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={async e => { 
                                                                    del.status = e.target.value as any; 
                                                                    await db.saveGrant(grant); 
                                                                    refresh(); 
                                                                }}
                                                            >
                                                                {['Pending','In Progress','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            <button onClick={e => {e.stopPropagation(); openEditModal('del', del, async (n,a) => {del.description=n; del.allocatedValue=a; await db.saveGrant(grant); refresh();})}} className="text-slate-400 hover:text-brand-600"><Edit2 size={14}/></button>
                                                        </div>
                                                     </div>
                                                     {isDelExpanded && (
                                                         <div className="pl-8 pr-2 py-2">
                                                             {del.budgetCategories.map(cat => {
                                                                 const cStat = getCategoryStats(cat.id, del.id, expenditures);
                                                                 return (
                                                                     <div key={cat.id} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                                                                         <span>{cat.name}</span>
                                                                         <div className="flex gap-2">
                                                                             <span className="text-slate-500">${cStat.spent.toLocaleString()} / ${cat.allocation.toLocaleString()}</span>
                                                                             <button onClick={()=>jumpToaddExpenditure(grant.id, del.id, cat.id)} className="text-brand-600 font-bold">+ Exp</button>
                                                                             <button onClick={()=>openEditModal('cat', cat, async(n,a)=>{cat.name=n;cat.allocation=a; await db.saveGrant(grant); refresh();})}><Edit2 size={12}/></button>
                                                                         </div>
                                                                     </div>
                                                                 );
                                                             })}
                                                             <button onClick={() => quickAddCategory(grant, del.id)} className="text-xs text-slate-400 mt-1 hover:text-brand-600 flex items-center"><Plus size={12}/> Add Category</button>
                                                         </div>
                                                     )}
                                                 </div>
                                             );
                                         })}
                                     </div>

                                     {/* Community Distributions Header */}
                                     <div className="p-2 pl-4 bg-blue-50 border-b flex justify-between items-center">
                                         <div className="flex items-center gap-2">
                                             <Users size={16} className="text-blue-600"/>
                                             <span className="font-bold text-xs text-blue-800 uppercase">Community Distributions</span>
                                         </div>
                                         <div className="text-[10px] text-blue-700 flex gap-3 items-center">
                                             <span>Pool: ${subAwardStats.totalPot.toLocaleString()}</span>
                                             <span>Allocated: ${subAwardStats.allocated.toLocaleString()}</span>
                                             <span className={subAwardStats.remainingToAllocate < 0 ? 'text-red-600 font-bold' : 'font-bold'}>Remaining: ${subAwardStats.remainingToAllocate.toLocaleString()}</span>
                                             <button onClick={async e => {e.stopPropagation(); if(confirm("Add Community?")){grant.subRecipients.push({id:crypto.randomUUID(), name:'New', allocatedAmount:0, deliverables:[]}); await db.saveGrant(grant); refresh();}}} className="bg-white border border-blue-200 rounded px-2 hover:text-blue-900">+</button>
                                         </div>
                                     </div>

                                     {/* Sub Recipients List */}
                                     <div className="p-2 pl-8">
                                         {grant.subRecipients.map(sub => (
                                             <div key={sub.id} className="mb-2 bg-white border rounded p-3">
                                                 <div className="flex justify-between mb-2 items-center">
                                                     <div className="flex items-center gap-2">
                                                         <span className="font-bold text-sm">{sub.name}</span>
                                                         <button onClick={()=>openEditModal('sub', sub, async(n,a)=>{sub.name=n; sub.allocatedAmount=a; await db.saveGrant(grant); refresh();})} className="text-slate-400 hover:text-brand-600"><Edit2 size={14}/></button>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <span className="text-xs text-slate-500">Allocated: ${sub.allocatedAmount.toLocaleString()}</span>
                                                         <button onClick={()=>deleteSubRecipient(grant, sub.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                     </div>
                                                 </div>
                                                 <div className="pl-2 border-l-2 border-slate-200">
                                                     {sub.deliverables.map(sd => (
                                                         <div key={sd.id} className="flex justify-between text-xs py-1 items-center">
                                                             <span>{sd.description}</span>
                                                             <div className="flex items-center gap-2">
                                                                 <select 
                                                                    className="border rounded px-1"
                                                                    value={sd.status}
                                                                    onChange={async e => {
                                                                        sd.status = e.target.value as any;
                                                                        await db.saveGrant(grant);
                                                                        refresh();
                                                                    }}
                                                                 >
                                                                     {['Pending','In Progress','Completed'].map(s=><option key={s} value={s}>{s}</option>)}
                                                                 </select>
                                                                 <button onClick={()=>quickAddCategory(grant, sd.id, sub.id)} className="text-brand-600">+ Cat</button>
                                                             </div>
                                                         </div>
                                                     ))}
                                                     <button onClick={()=>quickAddDeliverable(grant, sub.id)} className="text-xs text-slate-400 mt-1 hover:text-brand-600 flex items-center"><Plus size={12}/> Add Goal</button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                    );
                })}
            </div>
            
            {/* INLINE EDIT MODAL */}
            {editItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded p-6 w-full max-w-sm space-y-4">
                        <h3 className="font-bold text-lg">Edit {editItem.type === 'cat' ? 'Category' : editItem.type === 'sub' ? 'Recipient' : 'Deliverable'}</h3>
                        <HighContrastInput label="Name" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} autoFocus />
                        <HighContrastInput label="Allocation ($)" type="number" value={editItem.amount} onChange={e => setEditItem({...editItem, amount: parseFloat(e.target.value)||0})} />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setEditItem(null)} className="flex-1 bg-slate-100 py-2 rounded">Cancel</button>
                            <button onClick={saveEditItem} className="flex-1 bg-brand-600 text-white py-2 rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};