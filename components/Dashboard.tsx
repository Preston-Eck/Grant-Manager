import React, { useEffect, useState } from 'react';
import { db } from '../services/dbService';
import { Grant, Transaction } from '../types';
import { PieChart, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setGrants(db.getGrants());
    setTransactions(db.getTransactions());
  }, []);

  const totalBudget = grants.reduce((sum, g) => sum + g.budget, 0);
  const totalSpent = grants.reduce((sum, g) => sum + g.spent, 0);
  const totalBalance = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate('grants')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-brand-300 transition-all group"
        >
          <div className="p-3 bg-brand-100 rounded-full text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Active Funding</p>
            <p className="text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('reporting')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:emerald-300 transition-all group"
        >
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-slate-900">${totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('reporting')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:amber-300 transition-all group"
        >
          <div className="p-3 bg-amber-100 rounded-full text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Unobligated Balance</p>
            <p className="text-2xl font-bold text-slate-900">${totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Grants Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Active Grant Performance</h3>
          <div className="space-y-6">
            {grants.map(grant => {
              const percent = Math.min(100, Math.round((grant.spent / grant.budget) * 100));
              return (
                <div key={grant.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{grant.name}</span>
                    <span className="text-sm text-slate-500">{percent}% Used</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-brand-500'}`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>${grant.spent.toLocaleString()}</span>
                    <span>${grant.budget.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(-5).reverse().map(t => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-600">{t.date}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{t.vendor}</td>
                    <td className="px-3 py-2 text-right text-slate-800">${t.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};