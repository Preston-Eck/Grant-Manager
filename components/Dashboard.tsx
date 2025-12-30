import React, { useEffect, useState } from 'react';
import { db } from '../services/dbService';
import { Grant, Expenditure } from '../types';
import { DollarSign, Activity, PieChart, TrendingDown, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);

  useEffect(() => {
    setGrants(db.getGrants());
    setExpenditures(db.getExpenditures());
  }, []);

  const totalAwarded = grants.reduce((sum, g) => sum + (g.totalAward || 0), 0);
  const totalSpent = expenditures.filter(e => e.fundingSource === 'Grant').reduce((sum, e) => sum + e.amount, 0);
  const totalBalance = totalAwarded - totalSpent;

  const spendingByGrant = grants.map(g => {
    const grantSpent = expenditures.filter(e => e.grantId === g.id && e.fundingSource === 'Grant').reduce((sum, e) => sum + e.amount, 0);
    return {
      name: g.name.substring(0, 15) + '...',
      Budget: g.totalAward,
      Spent: grantSpent
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => onNavigate('grants')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:border-brand-500 transition-all">
          <div className="p-3 bg-brand-100 rounded-full text-brand-600"><DollarSign size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Total Active Funding</p><p className="text-2xl font-bold text-slate-900">${totalAwarded.toLocaleString()}</p></div>
        </div>
        <div onClick={() => onNavigate('reporting')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:border-emerald-500 transition-all">
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><Activity size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Total Grant Expenditures</p><p className="text-2xl font-bold text-slate-900">${totalSpent.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600"><PieChart size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Remaining Balance</p><p className="text-2xl font-bold text-slate-900">${totalBalance.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grant Health & Forecast */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Grant Health & Forecasting</h3>
          <div className="space-y-6">
            {grants.map(grant => {
              const grantExps = expenditures.filter(e => e.grantId === grant.id);
              const grantSpent = grantExps.filter(e => e.fundingSource === 'Grant').reduce((sum, e) => sum + e.amount, 0);
              const matchSpent = grantExps.filter(e => e.fundingSource === 'Match').reduce((sum, e) => sum + e.amount, 0);
              const percent = grant.totalAward > 0 ? Math.min(100, Math.round((grantSpent / grant.totalAward) * 100)) : 0;
              
              // Forecasting Logic
              const start = new Date(grant.startDate || new Date());
              const now = new Date();
              const monthsElapsed = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
              const monthlyBurnRate = grantSpent / monthsElapsed;
              const monthsRemaining = grant.totalAward > 0 && monthlyBurnRate > 0 ? (grant.totalAward - grantSpent) / monthlyBurnRate : 0;

              return (
                <div key={grant.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{grant.name}</span>
                    <span className="text-sm text-slate-500">{percent}% Used</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                    <div className={`h-2.5 rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-brand-500'}`} style={{ width: `${percent}%` }}></div>
                  </div>

                  {/* Forecast & Match Stats */}
                  <div className="flex justify-between items-start text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      <div className="flex flex-col">
                          <span className="flex items-center gap-1 font-semibold text-slate-600"><TrendingDown size={12}/> Burn Rate</span>
                          <span>${monthlyBurnRate.toLocaleString(undefined, {maximumFractionDigits:0})}/mo</span>
                          <span className={monthsRemaining < 3 ? "text-red-500 font-bold" : "text-emerald-600"}>
                              ~{monthsRemaining.toFixed(1)} months funding left
                          </span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 font-semibold text-slate-600"><Scale size={12}/> Cost Share</span>
                          <span>Required: ${(grant.requiredMatchAmount || 0).toLocaleString()}</span>
                          <span className={matchSpent < (grant.requiredMatchAmount || 0) * (percent/100) ? "text-amber-600 font-bold" : "text-green-600"}>
                              Actual: ${matchSpent.toLocaleString()}
                          </span>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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