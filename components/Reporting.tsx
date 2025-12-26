import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Grant, Transaction } from '../types';
import { HighContrastSelect } from './ui/Input';
import { Download, FileText, Table } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Reporting: React.FC = () => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const g = db.getGrants();
    setGrants(g);
    if (g.length > 0) setSelectedGrantId(g[0].id);
  }, []);

  useEffect(() => {
    if (selectedGrantId) {
      setTransactions(db.getTransactions(selectedGrantId));
    }
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

  const downloadCSV = () => {
    if (!transactions.length) return;
    const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Status', 'ID'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.vendor}"`, // Escape commas
      t.category,
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
        <h2 className="text-2xl font-bold text-slate-900">Reporting Hub</h2>
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
          {/* Report Type A: Executive Summary Style */}
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

            {/* Report Type B: Visuals */}
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

            {/* Report Type C: Transaction Dump (Preview) */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-4">Transaction Ledger</h4>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-3">Date</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-slate-200">
                      <td className="p-3">{t.date}</td>
                      <td className="p-3 font-semibold">{t.vendor}</td>
                      <td className="p-3">{t.category}</td>
                      <td className="p-3 text-right font-mono">${t.amount.toFixed(2)}</td>
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