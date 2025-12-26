import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { parseReceiptImage } from '../services/geminiService';
import { Grant, Transaction, IngestionItem } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Loader2, Upload, Scan, FileInput, Save, Trash2 } from 'lucide-react';

interface ExpenseInputProps {
  onNavigate?: (tab: string, data?: any) => void;
}

export const ExpenseInput: React.FC<ExpenseInputProps> = ({ onNavigate }) => {
  const [queue, setQueue] = useState<IngestionItem[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');

  // Manual Entry State
  const [manualForm, setManualForm] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    vendor: '',
    category: '',
    purchaser: '',
    notes: ''
  });
  const [manualGrantId, setManualGrantId] = useState('');

  useEffect(() => {
    const g = db.getGrants();
    setGrants(g);
    if (g.length > 0) setManualGrantId(g[0].id);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const newItem: IngestionItem = {
          id: Date.now().toString(),
          rawImage: base64,
          parsedData: null,
          status: 'Scanning'
        };
        
        setQueue(prev => [...prev, newItem]);
        await processItem(newItem);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const processItem = async (item: IngestionItem) => {
    if (!process.env.API_KEY) {
      alert("Missing Gemini API Key in .env file.");
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Review' } : q));
      return;
    }
    try {
      setLoading(true);
      const jsonString = await parseReceiptImage(item.rawImage);
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setQueue(prev => prev.map(q => 
        q.id === item.id 
          ? { ...q, parsedData: parsed, status: 'Review' } 
          : q
      ));
    } catch (err) {
      console.error("Parsing failed", err);
      alert("AI could not read the receipt. Please enter details manually.");
      setQueue(prev => prev.map(q => 
        q.id === item.id 
          ? { ...q, status: 'Review' } 
          : q
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: IngestionItem, data: any, grantId: string) => {
    if (!grantId) return;

    // Save image to disk using our new Preload API
    let savedPath = '';
    try {
      // @ts-ignore - electronAPI comes from preload.js
      if (window.electronAPI) {
        const filename = `receipt_${item.id}.png`;
        // @ts-ignore
        savedPath = await window.electronAPI.saveReceipt(item.rawImage, filename);
      }
    } catch (e) {
      console.error("Failed to save file locally", e);
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      grantId: grantId,
      date: data.date || new Date().toISOString().split('T')[0],
      vendor: data.vendor || 'Unknown',
      amount: data.amount || 0,
      category: data.category || 'Misc',
      purchaser: data.purchaser || '',
      notes: data.notes || '',
      receiptUrl: savedPath || item.rawImage, // Fallback to base64 if save fails (or web mode)
      status: 'Approved'
    };

    db.addTransaction(newTransaction);
    setQueue(prev => prev.filter(q => q.id !== item.id));
  };

  const handleManualSubmit = () => {
    if(!manualGrantId || !manualForm.vendor || !manualForm.amount) {
        alert("Please fill in Vendor, Amount, and select a Grant.");
        return;
    }

    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        grantId: manualGrantId,
        date: manualForm.date!,
        vendor: manualForm.vendor!,
        amount: manualForm.amount!,
        category: manualForm.category || 'Misc',
        purchaser: manualForm.purchaser || '',
        notes: manualForm.notes || '',
        status: 'Approved'
    };

    db.addTransaction(newTransaction);
    alert("Expense added successfully!");
    setManualForm({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        vendor: '',
        category: '',
        purchaser: '',
        notes: ''
    });
  };

  const handleReject = (item: IngestionItem) => {
    const vendor = item.parsedData?.vendor || "Unknown Vendor";
    const date = item.parsedData?.date || "Unknown Date";
    
    if (confirm(`Reject receipt from ${vendor}? This will open a correction email draft.`)) {
      setQueue(prev => prev.filter(q => q.id !== item.id));
      if (onNavigate) {
        onNavigate('communication', {
          action: 'draft_rejection',
          vendor: vendor,
          date: date,
          templateId: 't-2' 
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Expense Input</h2>
            <p className="text-sm text-slate-500">Scan receipts or manually enter expenses.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setMode('scan')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'scan' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Scan size={18} /> <span>Receipt Scanner</span>
            </button>
            <button 
                onClick={() => setMode('manual')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileInput size={18} /> <span>Manual Entry</span>
            </button>
        </div>
      </div>

      {mode === 'scan' ? (
        <>
            <div className="flex justify-end">
                <div className="relative">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={loading}
                />
                <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-md">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    <span>Upload New Receipt</span>
                </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queue.length === 0 && (
                <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-slate-500">
                    <p className="text-lg">No receipts in queue.</p>
                    <p className="text-sm">Upload a receipt image to begin AI processing.</p>
                </div>
                )}
                
                {queue.map(item => (
                <ReviewCard 
                    key={item.id} 
                    item={item} 
                    grants={grants} 
                    onApprove={handleApprove} 
                    onReject={() => handleReject(item)} 
                />
                ))}
            </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Add Expense Manually</h3>
            <div className="space-y-4">
                <HighContrastSelect 
                    label="Assign to Grant"
                    options={grants.map(g => ({ value: g.id, label: g.name }))}
                    value={manualGrantId}
                    onChange={e => setManualGrantId(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                    <HighContrastInput 
                        label="Date" 
                        type="date" 
                        value={manualForm.date} 
                        onChange={e => setManualForm({...manualForm, date: e.target.value})}
                    />
                    <HighContrastInput 
                        label="Amount" 
                        type="number" 
                        value={manualForm.amount} 
                        onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value)})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <HighContrastInput 
                        label="Vendor" 
                        value={manualForm.vendor} 
                        onChange={e => setManualForm({...manualForm, vendor: e.target.value})}
                    />
                    <HighContrastInput 
                        label="Category" 
                        value={manualForm.category} 
                        onChange={e => setManualForm({...manualForm, category: e.target.value})}
                    />
                </div>
                <HighContrastInput 
                        label="Purchased By (Person)" 
                        value={manualForm.purchaser} 
                        onChange={e => setManualForm({...manualForm, purchaser: e.target.value})}
                />
                <HighContrastTextArea 
                    label="Notes / Description"
                    rows={3}
                    value={manualForm.notes}
                    onChange={e => setManualForm({...manualForm, notes: e.target.value})}
                />
                <div className="pt-4">
                    <button 
                        onClick={handleManualSubmit}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg flex justify-center items-center space-x-2"
                    >
                        <Save size={20} /> <span>Save Expense</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual review cards
const ReviewCard: React.FC<{
  item: IngestionItem;
  grants: Grant[];
  onApprove: (item: IngestionItem, data: any, grantId: string) => void;
  onReject: () => void;
}> = ({ item, grants, onApprove, onReject }) => {
  const [data, setData] = useState(item.parsedData || { vendor: '', amount: 0, date: '', category: '', purchaser: '', notes: '' });
  const [selectedGrant, setSelectedGrant] = useState(grants[0]?.id || '');

  // Keep local state in sync if parser finishes late
  useEffect(() => {
    if(item.parsedData) setData({ ...item.parsedData, purchaser: '', notes: '' } as any);
  }, [item.parsedData]);

  if (item.status === 'Scanning') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-brand-500 mb-4" size={32} />
        <p className="text-slate-500 font-medium">AI Analyzing Receipt...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex flex-col space-y-4">
      <div className="h-40 bg-slate-100 rounded-lg overflow-hidden flex justify-center items-center border border-slate-200">
        <img src={item.rawImage} alt="Receipt" className="max-h-full max-w-full object-contain" />
      </div>
      
      <div className="space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-2">
          <HighContrastInput 
            label="Vendor" 
            value={data.vendor} 
            onChange={e => setData({...data, vendor: e.target.value})} 
          />
          <HighContrastInput 
            label="Amount" 
            type="number"
            value={data.amount} 
            onChange={e => setData({...data, amount: parseFloat(e.target.value)})} 
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <HighContrastInput 
            label="Date" 
            type="date"
            value={data.date} 
            onChange={e => setData({...data, date: e.target.value})} 
          />
          <HighContrastInput 
            label="Category" 
            value={data.category} 
            onChange={e => setData({...data, category: e.target.value})} 
          />
        </div>
        <HighContrastInput 
            label="Purchaser" 
            placeholder="Who bought this?"
            value={data.purchaser || ''} 
            onChange={e => setData({...data, purchaser: e.target.value})} 
        />
        <HighContrastInput 
            label="Notes" 
            placeholder="Description..."
            value={data.notes || ''} 
            onChange={e => setData({...data, notes: e.target.value})} 
        />
        <HighContrastSelect
          label="Assign to Grant"
          value={selectedGrant}
          onChange={e => setSelectedGrant(e.target.value)}
          options={grants.map(g => ({ value: g.id, label: g.name }))}
        />
      </div>

      <div className="flex space-x-2 pt-2 border-t border-slate-100">
        <button 
          onClick={onReject}
          className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium text-sm transition-colors flex items-center justify-center space-x-1"
        >
          <Trash2 size={16} /> <span>Reject</span>
        </button>
        <button 
          onClick={() => onApprove(item, data, selectedGrant)}
          className="flex-1 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-md font-medium text-sm transition-colors flex items-center justify-center space-x-1"
        >
          <Save size={16} /> <span>Approve</span>
        </button>
      </div>
    </div>
  );
};