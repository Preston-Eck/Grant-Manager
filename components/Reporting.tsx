import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, Transaction } from '../types';
import { HighContrastSelect, HighContrastInput } from './ui/Input';
import { Download, FileText, Edit2, Save, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Reporting: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  useEffect(() => {
    const g = db.getGrants();
    setGrants(g);
    if (g.length > 0) setSelectedGrantId(g[0].id);
  }, []);

  const refreshTransactions = () => {
    if (selectedGrantId) {
      setTransactions(db.getTransactions(selectedGrantId));
    }
  };

  useEffect(() => {
    refreshTransactions();
  }, [selectedGrantId]);

  const selectedGrant = grants.find(g => g.id === selectedGrantId);

  // Prepare Chart Data
  const expensesByCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({...t});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editForm.id) return;
    
    // Manual DB Update
    const allTransactions = db.getTransactions(); 
    const index = allTransactions.findIndex(t => t.id === editForm.id);
    
    if (index !== -1) {
       allTransactions[index] = { ...allTransactions[index], ...editForm };
       localStorage.setItem('eckerdt_transactions', JSON.stringify(allTransactions));
       
       // Update Grant totals
       const currentGrant = grants.find(g => g.id === editForm.grantId);
       if(currentGrant) {
         const grantTx = allTransactions.filter(t => t.grantId === currentGrant.id);
         currentGrant.spent = grantTx.reduce((sum, t) => sum + t.amount, 0);
         db.saveGrant(currentGrant);
       }
       
       refreshTransactions();
       setEditingId(null);
    }
  };

  const downloadCSV = () => {
    if (!transactions.length) return;
    // UPDATED: Added Purchaser and Notes to CSV
    const headers = ['Date', 'Vendor', 'Category', 'Purchaser', 'Notes', 'Amount', 'Status', 'ID'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.vendor.replace(/"/g, '""')}"`, 
      t.category,
      `"${(t.purchaser || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.status,
      t.id
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `grant_export_${selectedGrantId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center print:hidden">
        <h2 className="text-2xl font-bold text-slate-900">Reporting & Management Hub</h2>
        <div className="w-full md:w-64 mt-4 md:mt-0">
          <HighContrastSelect 
            options={grants.map(g => ({ value: g.id, label: g.name }))}
            value={selectedGrantId}
            onChange={(e) => setSelectedGrantId(e.target.value)}
          />
        </div>
      </div>

      {selectedGrant && (
        <>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
            <div className="border-b border-slate-300 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Federal Financial Report Format</h3>
                <p className="text-slate-500">Grant: {selectedGrant.name} ({selectedGrant.funder})</p>
              </div>
              <div className="flex space-x-2 print:hidden">
                <button onClick={printReport} className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium">
                  <FileText size={18} />
                  <span>Print PDF View</span>
                </button>
                 <button onClick={downloadCSV} className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded text-white font-medium">
                  <Download size={18} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <span className="block text-xs uppercase text-slate-500 font-semibold">Total Award</span>
                <span className="text-2xl font-mono font-bold text-slate-900">${selectedGrant.budget.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <span className="block text-xs uppercase text-slate-500 font-semibold">Cumulative Expenses</span>
                <span className="text-2xl font-mono font-bold text-slate-900">${selectedGrant.spent.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <span className="block text-xs uppercase text-slate-500 font-semibold">Unobligated Balance</span>
                <span className="text-2xl font-mono font-bold text-slate-900">${(selectedGrant.budget - selectedGrant.spent).toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-8 h-80 w-full print:break-inside-avoid">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Budget vs. Actuals by Category</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 border border-dashed rounded">No transaction data available for chart.</div>
              )}
            </div>

            <div className="overflow-x-auto">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Transaction Ledger</h4>
              <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Category</th>
                    {/* NEW COLUMNS */}
                    <th className="p-3">Purchaser</th>
                    <th className="p-3 w-48">Notes</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 print:hidden w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-slate-200">
                      {editingId === t.id ? (
                        <>
                          <td className="p-2"><HighContrastInput type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td>
                          <td className="p-2"><HighContrastInput value={editForm.vendor} onChange={e => setEditForm({...editForm, vendor: e.target.value})} /></td>
                          <td className="p-2"><HighContrastInput value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} /></td>
                          {/* NEW EDIT FIELDS */}
                          <td className="p-2"><HighContrastInput value={editForm.purchaser || ''} onChange={e => setEditForm({...editForm, purchaser: e.target.value})} /></td>
                          <td className="p-2"><HighContrastInput value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></td>
                          
                          <td className="p-2"><HighContrastInput type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})} /></td>
                          <td className="p-2 flex space-x-2">
                             <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><Save size={18} /></button>
                             <button onClick={cancelEdit} className="text-red-600 hover:text-red-800"><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3">{t.date}</td>
                          <td className="p-3 font-semibold">{t.vendor}</td>
                          <td className="p-3">{t.category}</td>
                          {/* NEW DATA CELLS */}
                          <td className="p-3">{t.purchaser || '-'}</td>
                          <td className="p-3 text-slate-500 truncate max-w-xs" title={t.notes}>{t.notes || '-'}</td>
                          
                          <td className="p-3 text-right font-mono">${t.amount.toFixed(2)}</td>
                          <td className="p-3 print:hidden">
                            <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-brand-600"><Edit2 size={16} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};