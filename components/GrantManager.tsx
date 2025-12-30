import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, GrantStatus, Deliverable, BudgetCategory, Expenditure, SubRecipient, ComplianceReport, Note } from '../types';
import { HighContrastInput, HighContrastCurrencyInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Plus, Edit2, Trash2, Save, ChevronRight, ChevronDown, Users, LayoutList, ArrowLeft, X, FileText, Calendar, MessageSquare, Paperclip, FileDigit, User, Eye } from 'lucide-react';
import { getGrantStats, getDeliverableStats, getSubRecipientStats, getCategoryStats, getSubAwardPotStats } from '../utils/financialCalculations';

interface GrantManagerProps {
  onNavigate?: (tab: string, data?: any) => void;
}

// --- SUB-COMPONENTS ---

const NotesSection = ({ 
    notes, 
    onAdd, 
    title = "Notes & Activity Log" 
}: { 
    notes?: Note[], 
    onAdd: (text: string) => void, 
    title?: string 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newNote, setNewNote] = useState('');

    const handleAdd = () => {
        if(!newNote.trim()) return;
        onAdd(newNote);
        setNewNote('');
    };

    return (
        <div className="mt-2 border rounded-lg overflow-hidden bg-slate-50 border-slate-200">
            <div 
                className="p-2 bg-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-200"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
                <div className="flex items-center text-xs font-bold text-slate-600 uppercase">
                    <MessageSquare size={14} className="mr-2"/> {title} ({notes?.length || 0})
                </div>
                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </div>
            
            {isExpanded && (
                <div className="p-3" onClick={e => e.stopPropagation()}>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                        {notes && notes.length > 0 ? (
                            notes.map(n => (
                                <div key={n.id} className="text-xs bg-white p-2 rounded border border-slate-200 shadow-sm">
                                    <div className="flex justify-between text-slate-400 mb-1">
                                        <span>{new Date(n.date).toLocaleString()}</span>
                                        <span>{n.author}</span>
                                    </div>
                                    <div className="text-slate-800 whitespace-pre-wrap">{n.text}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-400 italic">No notes yet.</div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <HighContrastInput 
                            className="flex-1 text-xs" 
                            placeholder="Add a note..." 
                            value={newNote} 
                            onChange={e => setNewNote(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">Add</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DeliverableModal = ({ 
    del, 
    isOpen, 
    onClose, 
    onSave 
}: { 
    del: Deliverable | null, 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (d: Deliverable) => void 
}) => {
    const [editingDel, setEditingDel] = useState<Deliverable | null>(null);

    useEffect(() => {
        if (del) setEditingDel({ ...del });
    }, [del]);

    if (!isOpen || !editingDel) return null;

    const isSubAward = editingDel.type === 'SubAward';

    const updateCat = (i: number, field: keyof BudgetCategory, val: any) => {
        const cats = [...(editingDel.budgetCategories || [])];
        cats[i] = { ...cats[i], [field]: val };
        setEditingDel({ ...editingDel, budgetCategories: cats });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0">
                    <h3 className="text-xl font-bold text-slate-800">Edit Deliverable Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <HighContrastInput label="Ref (e.g. 1.1)" value={editingDel.sectionReference} onChange={e => setEditingDel({...editingDel, sectionReference: e.target.value})} />
                        </div>
                        <div className="col-span-3">
                            <HighContrastInput label="Description" value={editingDel.description} onChange={e => setEditingDel({...editingDel, description: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <HighContrastCurrencyInput label="Allocated Value ($)" value={editingDel.allocatedValue} onChange={e => setEditingDel({...editingDel, allocatedValue: parseFloat(e.target.value) || 0})} />
                        <HighContrastSelect 
                            label="Status" 
                            options={['Pending','In Progress','Completed','Deferred'].map(s=>({value:s, label:s}))} 
                            value={editingDel.status} 
                            onChange={e => setEditingDel({...editingDel, status: e.target.value as any})} 
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <HighContrastInput label="Start Date" type="date" value={editingDel.startDate || ''} onChange={e => setEditingDel({...editingDel, startDate: e.target.value})} />
                        <HighContrastInput label="End Date" type="date" value={editingDel.endDate || ''} onChange={e => setEditingDel({...editingDel, endDate: e.target.value})} />
                        <HighContrastInput label="Completion Date" type="date" value={editingDel.completionDate || ''} onChange={e => setEditingDel({...editingDel, completionDate: e.target.value})} />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-xs text-slate-500 uppercase mb-3 flex justify-between items-center">
                            <span>Budget Categories</span>
                            {isSubAward && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">Draws from Community Distributions</span>}
                        </h4>
                        
                        {!isSubAward ? (
                            <div className="space-y-3">
                                {editingDel.budgetCategories?.map((cat, i) => (
                                    <div key={cat.id} className="flex gap-2 items-center">
                                        <div className="flex-1"><HighContrastInput placeholder="Category Name" value={cat.name} onChange={e => updateCat(i, 'name', e.target.value)} /></div>
                                        <div className="w-24"><HighContrastCurrencyInput placeholder="$" value={cat.allocation} onChange={e => updateCat(i, 'allocation', parseFloat(e.target.value) || 0)} /></div>
                                        <div className="flex-1"><HighContrastInput placeholder="Purpose" value={cat.purpose} onChange={e => updateCat(i, 'purpose', e.target.value)} /></div>
                                        <button onClick={() => {
                                            const c = [...editingDel.budgetCategories]; 
                                            c.splice(i, 1); 
                                            setEditingDel({ ...editingDel, budgetCategories: c });
                                        }} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                                    </div>
                                ))}
                                <button onClick={() => setEditingDel({
                                    ...editingDel,
                                    budgetCategories: [...(editingDel.budgetCategories || []), { id: crypto.randomUUID(), name: '', allocation: 0, purpose: '' }]
                                })} className="text-xs flex items-center text-brand-600 font-bold hover:underline mt-2">
                                    <Plus size={14} className="mr-1"/> Add Category
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Budget categories are disabled for the Sub-Award deliverable.</p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(editingDel)} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-md">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const DeliverablesListEditor = ({ deliverables, onChange, title }: { deliverables: Deliverable[], onChange: (d: Deliverable[]) => void, title?: string }) => {
    return (
        <div className="space-y-4">
            {title && <h4 className="text-sm font-bold text-slate-500 uppercase border-b border-slate-200 pb-2">{title}</h4>}
            {deliverables.map((del, idx) => (
                 <div key={del.id} className="bg-slate-50 p-4 rounded border flex gap-4 items-end">
                    <div className="w-20"><HighContrastInput label="Ref" value={del.sectionReference} onChange={e => {const d=[...deliverables]; d[idx].sectionReference=e.target.value; onChange(d)}} /></div>
                    <div className="flex-1"><HighContrastInput label="Description" value={del.description} onChange={e => {const d=[...deliverables]; d[idx].description=e.target.value; onChange(d)}} /></div>
                    <div className="w-32"><HighContrastCurrencyInput label="Allocated ($)" value={del.allocatedValue} onChange={e => {const d=[...deliverables]; d[idx].allocatedValue=parseFloat(e.target.value)||0; onChange(d)}} /></div>
                    <button onClick={() => {const d=[...deliverables]; d.splice(idx,1); onChange(d)}} className="text-slate-400 hover:text-red-500 mb-2"><Trash2 size={20}/></button>
                 </div>
            ))}
            <button onClick={() => onChange([...deliverables, {id:crypto.randomUUID(), type:'Standard', sectionReference:'', description:'', allocatedValue:0, dueDate:'', status:'Pending', budgetCategories:[]}])} className="text-brand-600 font-bold text-sm flex items-center"><Plus size={16} className="mr-1"/> Add Deliverable</button>
        </div>
    );
};

export const GrantManager: React.FC<GrantManagerProps> = ({ onNavigate }) => {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
    
    // Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [currentGrant, setCurrentGrant] = useState<Partial<Grant>>({});
    const [activeTab, setActiveTab] = useState<'details' | 'communities' | 'deliverables' | 'reports'>('details');

    // UI States
    const [expandedGrants, setExpandedGrants] = useState<Set<string>>(new Set());
    const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
    const [expandedSubRecipients, setExpandedSubRecipients] = useState<Set<string>>(new Set());
    const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    
    // Modals
    const [modalData, setModalData] = useState<{ del: Deliverable | null, isOpen: boolean, onSave: (d: Deliverable) => void }>({ del: null, isOpen: false, onSave: () => {} });
    const [editItem, setEditItem] = useState<{ type: string, id: string, name: string, amount: number, onSave: (n:string, a:number)=>void } | null>(null);
    const [addingCommunityTo, setAddingCommunityTo] = useState<string | null>(null);
    const [newCommunityForm, setNewCommunityForm] = useState({ name: '', allocation: 0 });
    const [receiptImage, setReceiptImage] = useState<string | null>(null);

    // Expenditure Selection
    const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
    const [isEditingExpenditure, setIsEditingExpenditure] = useState(false);

    useEffect(() => { refresh(); }, []);
    
    const refresh = () => { 
        setGrants([...db.getGrants()]); 
        setExpenditures([...db.getExpenditures()]); 
    };
    
    const toggle = (id: string, set: any) => set((prev: any) => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });

    // --- CRUD Handlers ---
    const handleAddNew = () => {
        const subAwardDel: Deliverable = { id: crypto.randomUUID(), type: 'SubAward', sectionReference: '0.0', description: 'Sub-Award Pool', allocatedValue: 0, dueDate: '', status: 'Pending', budgetCategories: [] };
        setCurrentGrant({ id: crypto.randomUUID(), status: 'Active', totalAward: 0, deliverables: [subAwardDel], subRecipients: [], reports: [], attachments: [], notes: [] });
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
        } else alert("Grant Name is required.");
    };

    const handleDeleteGrant = async (id: string, name: string) => {
        if(confirm(`Delete ${name}? This cannot be undone.`)) {
            await db.deleteGrant(id);
            refresh();
        }
    };

    // --- Attachments & Notes ---
    const addNote = (target: any, text: string) => {
        if (!target.notes) target.notes = [];
        target.notes.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), text, author: 'User' });
    };

    const handleAddGrantNote = async (text: string) => {
        const g = { ...currentGrant } as Grant; 
        addNote(g, text);
        setCurrentGrant(g); 
    };

    const handleAddLiveNote = async (grant: Grant, context: 'grant' | 'sub' | 'del', id: string, text: string) => {
        if (context === 'grant') addNote(grant, text);
        else if (context === 'sub') { const s = grant.subRecipients.find(s => s.id === id); if(s) addNote(s, text); }
        else if (context === 'del') { 
            let d = grant.deliverables.find(d => d.id === id);
            if (!d) {
                 grant.subRecipients.forEach(s => { const found = s.deliverables.find(sd => sd.id === id); if (found) d = found; });
            }
            if(d) addNote(d, text);
        }
        await db.saveGrant(grant);
        refresh();
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
        if (confirm("Delete this attachment?")) {
            const atts = [...(currentGrant.attachments || [])];
            atts.splice(index, 1);
            setCurrentGrant({...currentGrant, attachments: atts});
        }
    };

    const handleAddReportAttachment = async (rIdx: number) => {
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
                   const reports = [...(currentGrant.reports || [])];
                   if(!reports[rIdx].attachments) reports[rIdx].attachments = [];
                   reports[rIdx].attachments!.push(path);
                   setCurrentGrant({...currentGrant, reports});
               };
               reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // --- Sub-Recipient Management ---
    const openAddCommunityModal = (grantId: string) => {
        setNewCommunityForm({ name: '', allocation: 0 });
        setAddingCommunityTo(grantId);
    };
  
    const confirmAddCommunity = async () => {
        if (!addingCommunityTo || !newCommunityForm.name) return;
        const grantIndex = grants.findIndex(g => g.id === addingCommunityTo);
        if (grantIndex === -1) return;
  
        const grant = { ...grants[grantIndex] };
        if (!grant.subRecipients) grant.subRecipients = [];
  
        const newSub: SubRecipient = {
            id: crypto.randomUUID(),
            name: newCommunityForm.name,
            allocatedAmount: newCommunityForm.allocation || 0,
            deliverables: [],
            notes: []
        };
  
        grant.subRecipients.push(newSub);
        await db.saveGrant(grant);
        setAddingCommunityTo(null);
        refresh();
    };

    const deleteSubRecipient = async (grant: Grant, subId: string) => {
        if(confirm("Remove this community and all its data?")) {
            grant.subRecipients = grant.subRecipients.filter(s => s.id !== subId);
            await db.saveGrant(grant);
            refresh();
        }
    };

    // --- Report Management ---
    const updateReport = (idx: number, field: keyof ComplianceReport, val: any) => {
        const r = [...(currentGrant.reports || [])];
        r[idx] = { ...r[idx], [field]: val };
        setCurrentGrant({ ...currentGrant, reports: r });
    };

    // --- Quick Actions & In-Place Editing ---
    const openSimpleEditModal = (type: string, item: any, onSave: (n:string, a:number)=>void) => {
        setEditItem({ type, id: item.id, name: item.name || item.description, amount: item.allocatedAmount || item.allocatedValue || item.allocation || 0, onSave });
    };

    const saveSimpleEditItem = () => {
        if(editItem) { editItem.onSave(editItem.name, editItem.amount); setEditItem(null); }
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
            if(del.type === 'SubAward' || del.sectionReference === '0.0') return alert("Cannot add categories to Sub-Award.");
            
            if (!del.budgetCategories) del.budgetCategories = []; 
            del.budgetCategories.push({id: crypto.randomUUID(), name: 'New Category', allocation: 0, purpose: ''});
            
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
    
    // --- Expenditure Modal Helpers ---
    const handleSaveExpenditure = async () => {
        if (selectedExpenditure) {
            await db.saveExpenditure(selectedExpenditure);
            setIsEditingExpenditure(false);
            refresh();
        }
    };

    const handleDeleteExpenditure = async () => {
        if (selectedExpenditure && confirm("Delete expenditure?")) {
            await db.deleteExpenditure(selectedExpenditure.id);
            setSelectedExpenditure(null);
            setIsEditingExpenditure(false);
            refresh();
        }
    };

    const handleViewReceipt = async (path: string) => {
        if ((window as any).electronAPI) {
            try {
                if(path.endsWith('.pdf')) {
                    const dataUrl = await (window as any).electronAPI.readReceipt(path);
                    setReceiptImage(dataUrl);
                } else {
                    setReceiptImage(`receipt://${path}`);
                }
            } catch (e) {
                console.error(e);
                alert("Cannot load receipt.");
            }
        }
    };

    const closeReceiptViewer = () => setReceiptImage(null);

    // --- Helpers ---
    const getChildrenStatusSummary = (deliverables: Deliverable[]) => {
        if (!deliverables || deliverables.length === 0) return "No deliverables";
        const counts = deliverables.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ');
    };

    const openFullDeliverableModal = (del: Deliverable, onSave: (d: Deliverable) => void) => {
        setModalData({ del, isOpen: true, onSave });
    };

    // --- RENDERERS ---
    const renderDeliverableNode = (grant: Grant, del: Deliverable, subRecipientId?: string) => {
        const dStats = getDeliverableStats(del, expenditures);
        const isDelExpanded = expandedDeliverables.has(del.id);

        return (
            <div key={del.id} className="border-b border-slate-100 last:border-0 bg-white">
                <div className="p-3 pl-8 flex flex-col hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between items-center cursor-pointer" onClick={() => toggle(del.id, setExpandedDeliverables)}>
                        <div className="flex items-center space-x-3">
                            {isDelExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-sm text-slate-700">{del.sectionReference}: {del.description}</span>
                                    <select value={del.status} onClick={(e) => e.stopPropagation()} onChange={async (e) => { del.status = e.target.value as any; await db.saveGrant(grant); refresh(); }} className="text-[10px] px-2 py-0.5 rounded-full border-0 cursor-pointer focus:ring-1 focus:ring-brand-500 font-bold uppercase ml-2 bg-amber-50 text-amber-700">
                                        {['Pending', 'In Progress', 'Completed', 'Deferred'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="text-xs text-slate-500 flex space-x-3 mt-1 font-mono">
                                    <span>Allocated: ${del.allocatedValue.toLocaleString()}</span>
                                    <span className="text-slate-400">|</span>
                                    <span>Spent: ${dStats.spent.toLocaleString()}</span>
                                    <span className="text-slate-400">|</span>
                                    <span className={dStats.balance < -0.01 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>Remaining: ${dStats.balance.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button onClick={(e) => { e.stopPropagation(); openFullDeliverableModal(del, async (updatedDel) => { if (subRecipientId) { const s = grant.subRecipients.find(x=>x.id===subRecipientId); if(s) { const idx = s.deliverables.findIndex(x=>x.id===del.id); if(idx!==-1) s.deliverables[idx]=updatedDel; } } else { const idx = grant.deliverables.findIndex(x=>x.id===del.id); if(idx!==-1) grant.deliverables[idx]=updatedDel; } await db.saveGrant(grant); refresh(); setModalData({del:null, isOpen:false, onSave:()=>{}}); }); }} className="p-1 text-slate-300 hover:text-brand-600"><Edit2 size={14}/></button>
                            <button onClick={async (e) => { e.stopPropagation(); if(confirm('Delete?')) { if(subRecipientId) { const s=grant.subRecipients.find(x=>x.id===subRecipientId); if(s) s.deliverables=s.deliverables.filter(x=>x.id!==del.id); } else { grant.deliverables=grant.deliverables.filter(x=>x.id!==del.id); } await db.saveGrant(grant); refresh(); } }} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                     </div>
                     {/* Notes Section for Deliverable */}
                     {isDelExpanded && (
                         <div className="ml-8 mt-2 mb-2 pr-4">
                             <NotesSection notes={del.notes} onAdd={(txt) => handleAddLiveNote(grant, 'del', del.id, txt)} title="Goal Notes" />
                         </div>
                     )}
                </div>

                {isDelExpanded && (
                    <div className="bg-slate-50/50 pl-16 pr-4 py-2 border-t border-slate-100">
                        {del.budgetCategories?.map((cat) => {
                            const cStats = getCategoryStats(cat.id, del.id, expenditures);
                            return (
                                <div key={cat.id} className="mb-2 flex justify-between items-center text-sm py-1 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center">
                                        <span className="font-medium text-slate-600 mr-2">{cat.name}</span>
                                        <span className="text-xs text-slate-400">(${cat.allocation.toLocaleString()})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-slate-500">Spent: ${cStats.spent.toLocaleString()}</span>
                                        <button onClick={() => jumpToaddExpenditure(grant.id, del.id, cat.id, subRecipientId)} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200">+ Exp</button>
                                        <button onClick={() => openSimpleEditModal('cat', cat, async (n,a) => { cat.name=n; cat.allocation=a; await db.saveGrant(grant); refresh(); })} className="text-slate-300 hover:text-brand-600 ml-1"><Edit2 size={12}/></button>
                                    </div>
                                </div>
                            );
                        })}
                        {(del.type !== 'SubAward' && del.sectionReference !== '0.0') && (
                            <button onClick={() => quickAddCategory(grant, del.id, subRecipientId)} className="text-xs text-slate-400 hover:text-brand-600 flex items-center mt-2">
                                <Plus size={12} className="mr-1"/> Add Budget Category
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <button onClick={() => setIsEditing(false)} className="flex items-center text-slate-500 font-bold hover:text-slate-700"><ArrowLeft className="mr-2"/> Back to Portfolio</button>
                    <button onClick={handleSave} className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold flex items-center hover:bg-brand-700 shadow-sm"><Save className="mr-2"/> Save Changes</button>
                </div>
                <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
                    <div className="flex border-b bg-slate-50">
                        {['details','communities','deliverables','reports'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 font-bold uppercase text-sm transition-colors ${activeTab===t ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-6 max-w-2xl">
                                <HighContrastInput label="Grant Name" value={currentGrant.name} onChange={e => setCurrentGrant({...currentGrant, name: e.target.value})} />
                                <HighContrastInput label="Funder" value={currentGrant.funder} onChange={e => setCurrentGrant({...currentGrant, funder: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <HighContrastCurrencyInput label="Total Award" value={currentGrant.totalAward} onChange={e => setCurrentGrant({...currentGrant, totalAward: parseFloat(e.target.value)||0})} />
                                    <HighContrastSelect label="Status" options={['Draft','Active','Closed'].map(s => ({value:s, label:s}))} value={currentGrant.status} onChange={e => setCurrentGrant({...currentGrant, status: e.target.value as any})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <HighContrastInput type="date" label="Start Date" value={currentGrant.startDate || ''} onChange={e => setCurrentGrant({...currentGrant, startDate: e.target.value})} />
                                   <HighContrastInput type="date" label="End Date" value={currentGrant.endDate || ''} onChange={e => setCurrentGrant({...currentGrant, endDate: e.target.value})} />
                                 </div>
                                 <div className="border-t pt-4">
                                     <h4 className="font-bold text-sm text-slate-700 mb-2">Attachments</h4>
                                     <div className="space-y-2 mb-2">
                                         {currentGrant.attachments?.map((a, i) => (
                                             <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                                                 <span className="text-xs truncate max-w-[300px]">{a.split(/[/\\]/).pop()}</span>
                                                 <button onClick={() => handleDeleteAttachment(i)} className="text-red-500"><X size={14}/></button>
                                             </div>
                                         ))}
                                     </div>
                                     <button onClick={handleAddAttachment} className="text-xs text-brand-600 font-bold flex items-center"><Paperclip size={14} className="mr-1"/> Add File</button>
                                 </div>
                                 <NotesSection notes={currentGrant.notes} onAdd={handleAddGrantNote} title="Internal Grant Notes" />
                            </div>
                        )}
                        {activeTab === 'communities' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                  Manage sub-recipients here. You can assign specific deliverables and budgets to each community partner.
                                </div>
                                {currentGrant.subRecipients?.map((sub, i) => (
                                    <div key={sub.id} className="border border-slate-200 p-4 rounded-lg bg-slate-50 relative">
                                        <button onClick={() => { const s = [...(currentGrant.subRecipients||[])]; s.splice(i,1); setCurrentGrant({...currentGrant, subRecipients:s}) }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X/></button>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <HighContrastInput label="Community Name" value={sub.name} onChange={e => { const s = [...(currentGrant.subRecipients||[])]; s[i].name=e.target.value; setCurrentGrant({...currentGrant, subRecipients:s}) }} />
                                            <HighContrastCurrencyInput label="Allocated Amount ($)" value={sub.allocatedAmount} onChange={e => { const s = [...(currentGrant.subRecipients||[])]; s[i].allocatedAmount=parseFloat(e.target.value)||0; setCurrentGrant({...currentGrant, subRecipients:s}) }} />
                                        </div>
                                        {/* RE-USE DELIVERABLES EDITOR BUT WITH SUB CONTEXT */}
                                        <div className="bg-white p-4 rounded border border-slate-200">
                                            <DeliverablesListEditor 
                                                title={`Deliverables for ${sub.name}`}
                                                deliverables={sub.deliverables}
                                                onChange={d => {
                                                    const s = [...(currentGrant.subRecipients||[])];
                                                    s[i].deliverables = d;
                                                    setCurrentGrant({...currentGrant, subRecipients:s});
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setCurrentGrant({...currentGrant, subRecipients: [...(currentGrant.subRecipients||[]), {id:crypto.randomUUID(), name:'New Community', allocatedAmount:0, deliverables:[]}]})} className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl flex justify-center items-center hover:border-brand-500 hover:text-brand-600 transition-colors"><Plus size={20} className="mr-2"/> Add Sub-Recipient Community</button>
                            </div>
                        )}
                        {activeTab === 'deliverables' && (
                             <div className="space-y-8">
                                <div className="space-y-4">
                                    {/* Using the List Editor for better layout in Edit Mode */}
                                    <DeliverablesListEditor
                                        title="Primary Grant Deliverables"
                                        deliverables={(currentGrant.deliverables || []).filter(d => d.type !== 'SubAward')}
                                        onChange={updated => {
                                            const subAward = currentGrant.deliverables?.find(d => d.type === 'SubAward');
                                            const newDels = subAward ? [...updated, subAward] : updated;
                                            setCurrentGrant({...currentGrant, deliverables: newDels});
                                        }}
                                    />
                                </div>
                                
                                <div className="bg-amber-50 p-6 border border-amber-200 rounded-xl">
                                    <h4 className="font-bold text-amber-800 mb-2">Sub-Award Pool Configuration</h4>
                                    <p className="text-sm text-amber-700 mb-4">Set the total amount reserved for community distributions. This amount is subtracted from the Unassigned Balance.</p>
                                    <div className="max-w-sm">
                                        <HighContrastCurrencyInput 
                                            label="Total Sub-Award Allocation" 
                                            value={currentGrant.deliverables?.find(d => d.type === 'SubAward' || d.sectionReference === '0.0')?.allocatedValue || 0}
                                            onChange={(e: any) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const dels = [...(currentGrant.deliverables || [])];
                                                let subIdx = dels.findIndex(d => d.type === 'SubAward' || d.sectionReference === '0.0');
                                                
                                                if (subIdx >= 0) {
                                                    dels[subIdx].allocatedValue = val;
                                                } else {
                                                    dels.push({
                                                        id: crypto.randomUUID(), type: 'SubAward', sectionReference: '0.0', description: 'Sub-Award Pool',
                                                        allocatedValue: val, dueDate: '', status: 'Pending', budgetCategories: []
                                                    });
                                                }
                                                setCurrentGrant({...currentGrant, deliverables: dels});
                                            }}
                                        />
                                    </div>
                                </div>
                             </div>
                        )}
                        {activeTab === 'reports' && (
                            <div className="space-y-4">
                                {currentGrant.reports?.map((rep, idx) => (
                                    <div key={rep.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1"><HighContrastInput label="Report Title" value={rep.title} onChange={e => updateReport(idx, 'title', e.target.value)} /></div>
                                            <div className="w-40"><HighContrastInput type="date" label="Due Date" value={rep.dueDate} onChange={e => updateReport(idx, 'dueDate', e.target.value)} /></div>
                                            <div className="w-40"><HighContrastSelect label="Status" options={[{value:'Pending',label:'Pending'},{value:'Submitted',label:'Submitted'}]} value={rep.status} onChange={e => updateReport(idx, 'status', e.target.value)} /></div>
                                            <button onClick={() => { const r = [...(currentGrant.reports||[])]; r.splice(idx,1); setCurrentGrant({...currentGrant, reports: r}); }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Attachments</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {rep.attachments?.map((a, aid) => (
                                                    <span key={aid} className="text-xs bg-white border px-2 py-1 rounded flex items-center">{a.split(/[/\\]/).pop()} <button onClick={()=>{const r=[...currentGrant.reports!]; r[idx].attachments!.splice(aid,1); setCurrentGrant({...currentGrant, reports:r})}} className="ml-1 text-red-500">x</button></span>
                                                ))}
                                                <button onClick={() => handleAddReportAttachment(idx)} className="text-xs text-brand-600 font-bold bg-white border border-brand-200 px-2 py-1 rounded">+ File</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setCurrentGrant({...currentGrant, reports: [...(currentGrant.reports || []), { id: crypto.randomUUID(), title: '', dueDate: '', type: 'Financial', status: 'Pending', attachments: [] }]})} className="flex items-center font-bold text-brand-600 hover:bg-brand-50 px-4 py-2 rounded">
                                    <Plus size={20} className="mr-2"/> Add Compliance Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW MODE ---
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Grant Portfolio</h2>
                <button onClick={handleAddNew} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-brand-700 shadow-sm"><Plus className="mr-2"/> Add Grant</button>
            </div>
            
            <div className="space-y-4">
                {grants.map(grant => {
                    const stats = getGrantStats(grant, expenditures);
                    const subAwardStats = getSubAwardPotStats(grant, expenditures);
                    const isExpanded = expandedGrants.has(grant.id);

                    return (
                        <div key={grant.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="p-4 flex flex-col hover:bg-slate-50 transition-colors">
                                 <div className="flex items-center cursor-pointer" onClick={() => toggle(grant.id, setExpandedGrants)}>
                                     {isExpanded ? <ChevronDown className="mr-3 text-slate-400"/> : <ChevronRight className="mr-3 text-slate-400"/>}
                                     <div className="flex-1">
                                         <h3 className="font-bold text-lg text-slate-800">{grant.name}</h3>
                                         <div className="text-xs text-slate-500 flex gap-4 mt-1 font-mono">
                                             <span>Award: <strong className="text-slate-700">${grant.totalAward.toLocaleString()}</strong></span>
                                             <span>Spent: ${stats.totalSpent.toLocaleString()}</span>
                                             <span>To Allocate: ${stats.unassigned.toLocaleString()}</span>
                                             <span className={stats.balance < -0.01 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>Remaining Balance: ${stats.balance.toLocaleString()}</span>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <select className="text-xs uppercase font-bold border rounded px-2 py-1 bg-white text-slate-600 focus:ring-1 focus:ring-brand-500" value={grant.status} onClick={e => e.stopPropagation()} onChange={async e => { const g={...grant, status:e.target.value as any}; await db.saveGrant(g); refresh(); }}>
                                             {['Active','Pending','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                         <div className="border-l pl-2 ml-2 flex gap-1">
                                            <button onClick={e => {e.stopPropagation(); handleEdit(grant)}} className="p-2 text-slate-400 hover:text-brand-600"><Edit2 size={18}/></button>
                                            <button onClick={e => {e.stopPropagation(); handleDeleteGrant(grant.id, grant.name)}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                                         </div>
                                     </div>
                                 </div>
                                 {isExpanded && <div className="ml-8 mt-2 pr-4"><NotesSection notes={grant.notes} onAdd={(txt) => handleAddLiveNote(grant, 'grant', grant.id, txt)} title="Grant Log"/></div>}
                             </div>

                             {isExpanded && (
                                 <div className="border-t border-slate-200 bg-slate-50/30">
                                     <div className="p-2 pl-4 border-b border-slate-200">
                                         <div className="flex justify-between items-center mb-2 px-2 pt-2">
                                            <div className="font-bold text-xs text-slate-500 uppercase tracking-wide">Primary Deliverables</div>
                                            <button onClick={() => quickAddDeliverable(grant)} className="text-xs text-brand-600 font-bold flex items-center hover:underline"><Plus size={12} className="mr-1"/> Add</button>
                                         </div>
                                         {grant.deliverables.filter(d => d.type !== 'SubAward' && d.sectionReference !== '0.0').map(del => renderDeliverableNode(grant, del))}
                                     </div>

                                     <div className="p-3 pl-4 bg-blue-50 border-b border-blue-100 flex flex-col cursor-pointer hover:bg-blue-100" onClick={() => toggle(`${grant.id}-comm`, setExpandedContexts)}>
                                         <div className="flex justify-between items-center w-full">
                                             <div className="flex items-center gap-2">
                                                {expandedContexts.has(`${grant.id}-comm`) ? <ChevronDown size={14} className="text-blue-400"/> : <ChevronRight size={14} className="text-blue-400"/>}
                                                <Users size={16} className="text-blue-600"/>
                                                <span className="font-bold text-xs text-blue-800 uppercase">Community Distributions</span>
                                             </div>
                                             <div className="text-[10px] text-blue-700 flex gap-3 items-center mr-4 font-mono">
                                                 <span>Pool: ${subAwardStats.totalPot.toLocaleString()}</span>
                                                 <span>Allocated: ${subAwardStats.allocated.toLocaleString()}</span>
                                                 <span>Unallocated: ${subAwardStats.unallocated.toLocaleString()}</span>
                                                 <span className={subAwardStats.balance < -0.01 ? 'text-red-600 font-bold' : 'font-bold text-green-700'}>Pool Balance: ${subAwardStats.balance.toLocaleString()}</span>
                                                 <button onClick={async e => {e.stopPropagation(); openAddCommunityModal(grant.id); }} className="bg-white border border-blue-200 rounded p-1 hover:text-blue-900 hover:border-blue-400"><Plus size={14}/></button>
                                             </div>
                                         </div>
                                     </div>

                                     {expandedContexts.has(`${grant.id}-comm`) && (
                                         <div className="p-2 pl-8 space-y-2">
                                             {grant.subRecipients.map(sub => {
                                                 const sStats = getSubRecipientStats(sub, grant.id, expenditures);
                                                 return (
                                                     <div key={sub.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                         <div className="p-3 flex flex-col hover:bg-slate-50 cursor-pointer" onClick={() => toggle(sub.id, setExpandedSubRecipients)}>
                                                             <div className="flex justify-between items-center">
                                                                 <div className="flex items-center gap-2">
                                                                     {expandedSubRecipients.has(sub.id) ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                                                                     <span className="font-bold text-sm text-slate-700">{sub.name}</span>
                                                                 </div>
                                                                 <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                                                                     <span>Allocated: ${sub.allocatedAmount.toLocaleString()}</span>
                                                                     <span>To Alloc: ${sStats.unassigned.toLocaleString()}</span>
                                                                     <span className={sStats.balance < -0.01 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>Balance: ${sStats.balance.toLocaleString()}</span>
                                                                     <button onClick={e => {e.stopPropagation(); openSimpleEditModal('sub', sub, async(n,a)=>{sub.name=n; sub.allocatedAmount=a; await db.saveGrant(grant); refresh();})}} className="text-slate-400 hover:text-brand-600 ml-2"><Edit2 size={14}/></button>
                                                                     <button onClick={e => {e.stopPropagation(); deleteSubRecipient(grant, sub.id)}} className="text-red-300 hover:text-red-600"><Trash2 size={14}/></button>
                                                                 </div>
                                                             </div>
                                                             {expandedSubRecipients.has(sub.id) && (
                                                                 <div className="mt-2 pr-4 pl-4"><NotesSection notes={sub.notes} onAdd={(txt) => handleAddLiveNote(grant, 'sub', sub.id, txt)} title="Community Log" /></div>
                                                             )}
                                                         </div>
                                                         {expandedSubRecipients.has(sub.id) && (
                                                             <div className="pl-4 border-t border-slate-100 bg-slate-50">
                                                                 {sub.deliverables.map(del => renderDeliverableNode(grant, del, sub.id))}
                                                                 <div className="p-2">
                                                                     <button onClick={() => quickAddDeliverable(grant, sub.id)} className="text-xs text-slate-500 hover:text-brand-600 flex items-center font-medium"><Plus size={12} className="mr-1"/> Add Community Goal</button>
                                                                 </div>
                                                             </div>
                                                         )}
                                                     </div>
                                                 );
                                             })}
                                             {grant.subRecipients.length === 0 && <div className="text-xs text-slate-400 italic p-2 text-center">No communities added yet.</div>}
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    );
                })}
            </div>
            
            {/* GLOBAL MODALS */}
            <DeliverableModal del={modalData.del} isOpen={modalData.isOpen} onClose={() => setModalData({ ...modalData, isOpen: false })} onSave={modalData.onSave} />
            {editItem && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4"><h3 className="font-bold text-lg text-slate-800">Edit Item</h3><HighContrastInput label="Name" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} autoFocus /><HighContrastCurrencyInput label="Allocation ($)" value={editItem.amount} onChange={e => setEditItem({...editItem, amount: parseFloat(e.target.value)||0})} /><div className="flex gap-2 pt-2"><button onClick={() => setEditItem(null)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200">Cancel</button><button onClick={saveSimpleEditItem} className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700">Save</button></div></div></div>)}
            {addingCommunityTo && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setAddingCommunityTo(null)}><div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-slate-900 mb-4">Add Sub-Recipient</h3><div className="space-y-4"><HighContrastInput label="Community Name" value={newCommunityForm.name} onChange={e => setNewCommunityForm({...newCommunityForm, name: e.target.value})} autoFocus /><HighContrastCurrencyInput label="Allocation ($)" value={newCommunityForm.allocation} onChange={e => setNewCommunityForm({...newCommunityForm, allocation: parseFloat(e.target.value)||0})} /><button onClick={confirmAddCommunity} className="w-full bg-brand-600 text-white font-bold py-2 rounded-lg hover:bg-brand-700">Add Community</button></div></div></div>)}

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
                                <HighContrastInput label="Amount ($)" type="number" value={selectedExpenditure.amount} onChange={e => setSelectedExpenditure({...selectedExpenditure, amount: parseFloat(e.target.value) || 0})} />
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
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Date</label><div className="text-slate-800">{selectedExpenditure.date}</div></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Amount</label><div className="text-slate-800 font-mono font-bold">${(selectedExpenditure.amount || 0).toLocaleString()}</div></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Vendor</label><div className="text-slate-800 flex items-center"><FileDigit size={16} className="mr-2 text-slate-400"/> {selectedExpenditure.vendor}</div></div>
                             <div><label className="text-xs font-bold text-slate-500 uppercase">Purchaser</label><div className="text-slate-800 flex items-center"><User size={16} className="mr-2 text-slate-400"/> {selectedExpenditure.purchaser || 'N/A'}</div></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Justification</label><div className="text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">{selectedExpenditure.justification || 'No justification provided.'}</div></div>
                            {selectedExpenditure.notes && (<div><label className="text-xs font-bold text-slate-500 uppercase">Notes</label><div className="text-slate-600 text-sm italic">{selectedExpenditure.notes}</div></div>)}
                            {selectedExpenditure.receiptUrl ? (
                                <button onClick={() => handleViewReceipt(selectedExpenditure.receiptUrl!)} className="w-full py-3 mt-2 bg-brand-50 text-brand-700 font-bold rounded-lg border border-brand-200 hover:bg-brand-100 flex justify-center items-center"><Eye size={18} className="mr-2"/> View Receipt</button>
                            ) : (<div className="text-center py-3 bg-slate-50 text-slate-400 rounded-lg text-sm">No receipt attached</div>)}
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