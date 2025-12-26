import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { parseReceiptImage } from '../services/geminiService';
import { Grant, Transaction, IngestionItem } from '../types';
import { HighContrastInput, HighContrastSelect } from './ui/Input';
import { Loader2, Check, X, Upload } from 'lucide-react';

interface IngestionQueueProps {
  onNavigate?: (tab: string, data?: any) => void;
}

export const IngestionQueue: React.FC<IngestionQueueProps> = ({ onNavigate }) => {
  // ... existing state ...

  const handleReject = (item: IngestionItem) => {
    const vendor = item.parsedData?.vendor || "Unknown Vendor";
    const date = item.parsedData?.date || "Unknown Date";
    
    if (confirm(`Reject receipt from ${vendor}? This will open a correction email draft.`)) {
      setQueue(prev => prev.filter(q => q.id !== item.id));
      
      // Navigate to Communication tab with data
      if (onNavigate) {
        onNavigate('communication', {
          action: 'draft_rejection',
          vendor: vendor,
          date: date,
          templateId: 't-2' // The ID of your "Receipt Correction" template in dbService
        });
      }
    }
  };

export const IngestionQueue: React.FC = () => {
  const [queue, setQueue] = useState<IngestionItem[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGrants(db.getGrants());
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
      alert("Missing Gemini API Key. Please create a .env file with API_KEY=your_key");
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Review' } : q));
      return;
    }
    try {
      setLoading(true);
      const jsonString = await parseReceiptImage(item.rawImage);
      // Clean up json string if Gemini adds markdown
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setQueue(prev => prev.map(q => 
        q.id === item.id 
          ? { ...q, parsedData: parsed, status: 'Review' } 
          : q
      ));
    } catch (err) {
      console.error("Parsing failed", err);
      setQueue(prev => prev.map(q => 
        q.id === item.id 
          ? { ...q, status: 'Review' } // Move to review anyway to let user manually enter
          : q
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (item: IngestionItem, grantId: string) => {
    if (!item.parsedData || !grantId) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      grantId: grantId,
      date: item.parsedData.date || new Date().toISOString().split('T')[0],
      vendor: item.parsedData.vendor || 'Unknown',
      amount: item.parsedData.amount || 0,
      category: item.parsedData.category || 'Misc',
      receiptUrl: item.rawImage,
      status: 'Approved'
    };

    db.addTransaction(newTransaction);
    setQueue(prev => prev.filter(q => q.id !== item.id));
  };

  const handleReject = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    // In a real app, this might trigger the "Communication" tab to send a correction email
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Ingestion Engine</h2>
        <div className="relative">
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            <span>Upload Receipt</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queue.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-300 text-slate-500">
            <p className="text-lg">Review queue is empty.</p>
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
    </div>
  );
};

// Sub-component for individual review cards
const ReviewCard: React.FC<{
  item: IngestionItem;
  grants: Grant[];
  onApprove: (item: IngestionItem, grantId: string) => void;
  onReject: (id: string) => void;
}> = ({ item, grants, onApprove, onReject }) => {
  const [data, setData] = useState(item.parsedData || { vendor: '', amount: 0, date: '', category: '' });
  const [selectedGrant, setSelectedGrant] = useState(grants[0]?.id || '');

  // Keep local state in sync if parser finishes late
  useEffect(() => {
    if(item.parsedData) setData(item.parsedData as any);
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
        <HighContrastSelect
          label="Assign to Grant"
          value={selectedGrant}
          onChange={e => setSelectedGrant(e.target.value)}
          options={grants.map(g => ({ value: g.id, label: g.name }))}
        />
      </div>

      <div className="flex space-x-2 pt-2 border-t border-slate-100">
        <button 
          onClick={() => onReject(item.id)}
          className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium text-sm transition-colors"
        >
          Reject
        </button>
        <button 
          onClick={() => onApprove({ ...item, parsedData: data }, selectedGrant)}
          className="flex-1 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-md font-medium text-sm transition-colors"
        >
          Approve & Save
        </button>
      </div>
    </div>
  );
};