import React, { useEffect, useState } from 'react';
import { db } from '../services/dbService';
import { Grant, Expenditure } from '../types';
import { DollarSign, Activity, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);

  useEffect(() => {
    // FIX: Updated to use the new function names
    setGrants(db.getGrants());
    setExpenditures(db.getExpenditures());
  }, []);

  // Calculate totals dynamically from the new data structure
  const totalAwarded = grants.reduce((sum, g) => sum + (g.totalAward || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const totalBalance = totalAwarded - totalSpent;

  // Prepare chart data (Spending by Grant)
  const spendingByGrant = grants.map(g => {
    const grantSpent = expenditures.filter(e => e.grantId === g.id).reduce((sum, e) => sum + e.amount, 0);
    return {
      name: g.name.substring(0, 15) + '...', // Truncate for display
      Budget: g.totalAward,
      Spent: grantSpent
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate('grants')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:border-brand-500 transition-all"
        >
          <div className="p-3 bg-brand-100 rounded-full text-brand-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Active Funding</p>
            <p className="text-2xl font-bold text-slate-900">${totalAwarded.toLocaleString()}</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('reporting')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Expenditures</p>
            <p className="text-2xl font-bold text-slate-900">${totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
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
          <h3 className="text-lg font-bold text-slate-800 mb-4">Grant Utilization</h3>
          <div className="space-y-6">
            {grants.map(grant => {
              const grantSpent = expenditures.filter(e => e.grantId === grant.id).reduce((sum, e) => sum + e.amount, 0);
              const percent = grant.totalAward > 0 ? Math.min(100, Math.round((grantSpent / grant.totalAward) * 100)) : 0;
              
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
                    <span>${grantSpent.toLocaleString()}</span>
                    <span>${(grant.totalAward || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Burn Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Budget vs. Spent</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingByGrant} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="Budget" fill="#e2e8f0" barSize={20} />
                <Bar dataKey="Spent" fill="#0ea5e9" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};