import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, Expenditure } from '../types';
import { HighContrastSelect, HighContrastInput, HighContrastTextArea } from './ui/Input';
import { Download, FileText, Edit2, Save, X, Eye, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#e2e8f0'];

export const Reporting: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expenditure>>({});
  
  // Viewer State
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  useEffect(() => {
    const g = db.getGrants();
    setGrants(g);
    if (g.length > 0) setSelectedGrantId(g[0].id);
  }, []);

  const refreshData = () => {
    if (selectedGrantId) {
      setExpenditures(db.getExpenditures(selectedGrantId));
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedGrantId]);

  const selectedGrant = grants.find(g => g.id === selectedGrantId);

  // Helper to look up names from IDs
  const getDeliverableName = (id: string) => selectedGrant?.deliverables.find(d => d.id === id)?.description || 'Unassigned';
  const getCategoryName = (dId: string, cId: string) => selectedGrant?.deliverables.find(d => d.id === dId)?.budgetCategories.find(c => c.id === cId)?.name || 'Unassigned';

  // Chart Logic
  const expendituresByCategory = expenditures.reduce((acc, t) => {
    const catName = getCategoryName(t.deliverableId, t.categoryId);
    acc[catName] = (acc[catName] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(expendituresByCategory).map(key => ({
    name: key,
    value: expendituresByCategory[key]
  }));
  
  // Calculate Remaining
  if (selectedGrant) {
    const totalSpent = expenditures.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, selectedGrant.totalAward - totalSpent);
    if(remaining > 0) chartData.push({ name: 'Remaining', value: remaining });
  }

  const startEdit = (t: Expenditure) => {
    setEditingId(t.id);
    setEditForm({...t});
  };

  const saveEdit = () => {
    if (!editForm.id) return;
    const all = db.getExpenditures();
    const index = all.findIndex(t => t.id === editForm.id);
    
    if (index !== -1) {
       all[index] = { ...all[index], ...editForm } as Expenditure;
       localStorage.setItem('eckerdt_expenditures', JSON.stringify(all));
       refreshData();
       setEditingId(null);
    }
  };

  const openReceipt = async (path?: string) => {
    if(!path) return alert("No receipt attached.");
    if ((window as any).electronAPI) {
        try {
           const base64 = await (window as any).electronAPI.readReceipt(path);
           setViewingReceipt(base64);
        } catch (e) {
           alert("Could not load image. File may be missing or corrupt.");
        }
    }
  };

  const downloadCSV = () => {
    if (!expenditures.length) return;
    const headers = ['Date', 'Vendor', 'Deliverable', 'Category', 'Purchaser', 'Justification', 'Notes', 'Amount'];
    const rows = expenditures.map(t => [
      t.date,
      `"${t.vendor}"`, 
      `"${getDeliverableName(t.deliverableId)}"`,
      `"${getCategoryName(t.deliverableId, t.categoryId)}"`,
      `"${t.purchaser || ''}"`,
      `"${t.justification || ''}"`,
      `"${t.notes || ''}"`,
      t.amount.toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grant_report_${selectedGrantId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-slate-900">Reporting & Management Hub</h2>
        <div className="w-64">
           <HighContrastSelect 
            options={grants.map(g => ({ value: g.id, label: g.name }))}
            value={selectedGrantId}
            onChange={(e) => setSelectedGrantId(e.target.value)}
          />
        </div>
      </div>

      {selectedGrant && (
        <div className="space-y-8">
           {/* Visuals */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64">
                 <h4 className="font-bold text-slate-700 mb-2 text-center">Budget Utilization</h4>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                       {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.name === 'Remaining' ? '#e2e8f0' : COLORS[index % (COLORS.length - 1)]} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36}/>
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center space-y-4">
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Total Award</span>
                    <span className="font-mono font-bold text-lg">${selectedGrant.totalAward.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Cumulative Expenditures</span>
                    <span className="font-mono font-bold text-lg text-brand-600">${expenditures.reduce((s,t)=>s+t.amount,0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-slate-500">Unobligated Balance</span>
                    <span className="font-mono font-bold text-lg text-emerald-600">${(selectedGrant.totalAward - expenditures.reduce((s,t)=>s+t.amount,0)).toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Ledger */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Expenditure Ledger</h3>
               <button onClick={downloadCSV} className="text-sm bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 flex items-center"><Download size={14} className="mr-2"/> CSV</button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                 <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                   <tr>
                     <th className="p-3">Date</th>
                     <th className="p-3">Vendor</th>
                     <th className="p-3">Purchaser</th>
                     <th className="p-3 w-48">Justification</th>
                     <th className="p-3">Deliverable/Cat</th>
                     <th className="p-3 text-right">Amount</th>
                     <th className="p-3 text-center">Receipt</th>
                     <th className="p-3 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {expenditures.map(t => (
                     <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                       {editingId === t.id ? (
                         <>
                           <td className="p-2"><HighContrastInput type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td>
                           <td className="p-2"><HighContrastInput value={editForm.vendor} onChange={e => setEditForm({...editForm, vendor: e.target.value})} /></td>
                           <td className="p-2"><HighContrastInput value={editForm.purchaser} onChange={e => setEditForm({...editForm, purchaser: e.target.value})} /></td>
                           <td className="p-2"><HighContrastTextArea rows={2} value={editForm.justification} onChange={e => setEditForm({...editForm, justification: e.target.value})} /></td>
                           <td className="p-2 text-xs text-slate-400">Locked for Audit</td>
                           <td className="p-2"><HighContrastInput type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})} /></td>
                           
                           {/* NEW: Receipt Upload/Replace Button */}
                           <td className="p-2 text-center">
                              <label className="cursor-pointer flex flex-col items-center justify-center text-xs text-brand-600 bg-brand-50 p-2 rounded hover:bg-brand-100">
                                  <Upload size={14} />
                                  <span>{editForm.receiptUrl ? 'Replace' : 'Add'}</span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={async (e) => {
                                      if(e.target.files?.[0]) {
                                          const file = e.target.files[0];
                                          const reader = new FileReader();
                                          reader.onload = async () => {
                                              const base64 = reader.result as string;
                                              if ((window as any).electronAPI) {
                                                  const path = await (window as any).electronAPI.saveReceipt(base64, `receipt_${Date.now()}.png`);
                                                  setEditForm(prev => ({ ...prev, receiptUrl: path }));
                                                  alert("Receipt attached to draft. Click Save to confirm.");
                                              }
                                          };
                                          reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                              </label>
                           </td>

                           <td className="p-2 flex justify-center space-x-1">
                              <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16}/></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16}/></button>
                           </td>
                         </>
                       ) : (
                         <>
                           <td className="p-3">{t.date}</td>
                           <td className="p-3 font-medium">{t.vendor}</td>
                           <td className="p-3">{t.purchaser || '-'}</td>
                           <td className="p-3 text-xs max-w-[200px] truncate" title={t.justification}>{t.justification || '-'}</td>
                           <td className="p-3 text-xs">
                             <div className="font-semibold">{getDeliverableName(t.deliverableId)}</div>
                             <div className="text-slate-500">{getCategoryName(t.deliverableId, t.categoryId)}</div>
                           </td>
                           <td className="p-3 text-right font-mono">${t.amount.toFixed(2)}</td>
                           <td className="p-3 text-center">
                             {t.receiptUrl && <button onClick={() => openReceipt(t.receiptUrl)} className="text-brand-600 hover:text-brand-800"><FileText size={16}/></button>}
                           </td>
                           <td className="p-3 text-center">
                             <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-brand-600"><Edit2 size={16}/></button>
                           </td>
                         </>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             {/* Receipt Viewer Modal */}
             {viewingReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewingReceipt(null)}>
                    <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setViewingReceipt(null)}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        <div className="overflow-auto max-h-[85vh] p-2">
                             <img src={viewingReceipt} alt="Receipt" className="max-w-full h-auto object-contain" />
                        </div>
                    </div>
                </div>
             )}

           </div>
        </div>
      )}
    </div>
  );
};