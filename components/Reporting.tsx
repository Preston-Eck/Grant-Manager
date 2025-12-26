import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, Expenditure } from '../types';
import { HighContrastSelect, HighContrastInput } from './ui/Input';
import { Download, FileText, Edit2, Save, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#e2e8f0'];

export const Reporting: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expenditure>>({});

  useEffect(() => {
    const g = db.getGrants();
    setGrants(g);
    if (g.length > 0) setSelectedGrantId(g[0].id);
  }, []);

  useEffect(() => {
    if (selectedGrantId) setExpenditures(db.getExpenditures(selectedGrantId));
  }, [selectedGrantId]);

  const selectedGrant = grants.find(g => g.id === selectedGrantId);

  // Helper to get names
  const getDeliverableName = (id: string) => selectedGrant?.deliverables.find(d => d.id === id)?.description || 'Unknown';
  const getCategoryName = (dId: string, cId: string) => selectedGrant?.deliverables.find(d => d.id === dId)?.budgetCategories.find(c => c.id === cId)?.name || 'Unknown';

  // Chart Data: Deliverable Balance Monitoring
  const deliverableData = (selectedGrant?.deliverables || []).map(d => {
    const spent = expenditures.filter(e => e.deliverableId === d.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: d.sectionReference, value: spent, total: d.allocatedValue };
  });

  const saveEdit = () => {
    if (!editForm.id) return;
    const all = db.getExpenditures();
    const index = all.findIndex(t => t.id === editForm.id);
    if (index !== -1) {
       all[index] = { ...all[index], ...editForm } as Expenditure;
       localStorage.setItem('eckerdt_expenditures', JSON.stringify(all));
       setExpenditures(db.getExpenditures(selectedGrantId));
       setEditingId(null);
    }
  };

  const downloadCSV = () => {
    if (!expenditures.length) return;
    const headers = ['Date', 'Vendor', 'Deliverable', 'Category', 'Justification', 'Amount'];
    const rows = expenditures.map(t => [
      t.date, t.vendor, getDeliverableName(t.deliverableId), getCategoryName(t.deliverableId, t.categoryId), t.justification, t.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenditures_${selectedGrantId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Grant Monitoring</h2>
        <div className="w-64"><HighContrastSelect options={grants.map(g => ({ value: g.id, label: g.name }))} value={selectedGrantId} onChange={(e) => setSelectedGrantId(e.target.value)} /></div>
      </div>

      {selectedGrant && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-700 mb-4">Budget vs. Actuals (By Deliverable)</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={deliverableData} cx="50%" cy="50%" label={({name, value}) => `${name}: $${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                       {deliverableData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>
             
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto h-80">
               <h3 className="font-bold text-slate-700 mb-4">Deliverable Status</h3>
               {selectedGrant.deliverables.map(d => {
                 const spent = expenditures.filter(e => e.deliverableId === d.id).reduce((sum, e) => sum + e.amount, 0);
                 const percent = Math.min(100, (spent / d.allocatedValue) * 100);
                 return (
                   <div key={d.id} className="mb-4">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-medium">{d.sectionReference}</span>
                       <span className="text-slate-500">${spent.toLocaleString()} / ${d.allocatedValue.toLocaleString()}</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                       <div className="bg-brand-600 h-2 rounded-full" style={{width: `${percent}%`}}></div>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-slate-800">Expenditure Ledger</h3>
              <button onClick={downloadCSV} className="text-sm bg-slate-100 px-3 py-2 rounded hover:bg-slate-200 flex items-center"><Download size={14} className="mr-2"/> Export CSV</button>
            </div>
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Deliverable</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Justification</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {expenditures.map(t => (
                  <tr key={t.id} className="border-b border-slate-100">
                    {editingId === t.id ? (
                        <>
                          <td className="p-2"><HighContrastInput type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td>
                          <td className="p-2"><HighContrastInput value={editForm.vendor} onChange={e => setEditForm({...editForm, vendor: e.target.value})} /></td>
                          <td className="p-2 text-slate-400 italic">Locked</td>
                          <td className="p-2 text-slate-400 italic">Locked</td>
                          <td className="p-2"><HighContrastInput value={editForm.justification} onChange={e => setEditForm({...editForm, justification: e.target.value})} /></td>
                          <td className="p-2"><HighContrastInput type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})} /></td>
                          <td className="p-2"><button onClick={saveEdit}><Save size={16} className="text-green-600"/></button></td>
                        </>
                    ) : (
                        <>
                          <td className="p-3">{t.date}</td>
                          <td className="p-3 font-medium">{t.vendor}</td>
                          <td className="p-3 truncate max-w-[150px]" title={getDeliverableName(t.deliverableId)}>{getDeliverableName(t.deliverableId)}</td>
                          <td className="p-3">{getCategoryName(t.deliverableId, t.categoryId)}</td>
                          <td className="p-3 truncate max-w-[200px]" title={t.justification}>{t.justification}</td>
                          <td className="p-3 text-right font-mono">${t.amount.toLocaleString()}</td>
                          <td className="p-3"><button onClick={() => {setEditingId(t.id); setEditForm(t)}}><Edit2 size={16} className="text-slate-400 hover:text-brand-600"/></button></td>
                        </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};