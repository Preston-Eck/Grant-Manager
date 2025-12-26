import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { parseReceiptImage } from '../services/geminiService';
import { Grant, Expenditure, IngestionItem, Deliverable, BudgetCategory } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Loader2, Upload, Scan, FileInput, Save, Trash2, Check } from 'lucide-react';

interface ExpenditureInputProps {
  onNavigate?: (tab: string, data?: any) => void;
  initialData?: any; // NEW PROP
}

export const ExpenditureInput: React.FC<ExpenditureInputProps> = ({ onNavigate, initialData }) => {
  const [queue, setQueue] = useState<IngestionItem[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');

  // Manual Form
  const [manualForm, setManualForm] = useState<Partial<Expenditure>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    vendor: '',
    purchaser: '',
    justification: '',
    notes: '',
    grantId: '',
    deliverableId: '',
    categoryId: ''
  });

  useEffect(() => { 
    setGrants(db.getGrants()); 
    // Handle Pre-fill
    if (initialData && initialData.action === 'prefill') {
        setMode('manual');
        setManualForm(prev => ({
            ...prev,
            grantId: initialData.grantId,
            deliverableId: initialData.deliverableId,
            categoryId: initialData.categoryId
        }));
    }
  }, [initialData]);

  // Filter logic for manual form
  const selectedGrant = grants.find(g => g.id === manualForm.grantId);
  const availableDeliverables = selectedGrant?.deliverables || [];
  const selectedDeliverable = availableDeliverables.find(d => d.id === manualForm.deliverableId);
  const availableCategories = selectedDeliverable?.budgetCategories || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newItem: IngestionItem = { id: Date.now().toString(), rawImage: reader.result as string, parsedData: null, status: 'Scanning' };
        setQueue(prev => [...prev, newItem]);
        await processScan(newItem);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const processScan = async (item: IngestionItem) => {
    try {
      setLoading(true);
      const jsonString = await parseReceiptImage(item.rawImage);
      const parsed = JSON.parse(jsonString);
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, parsedData: parsed, status: 'Review' } : q));
    } catch (err) {
      alert("AI scan failed. Please enter details manually.");
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Review' } : q));
    } finally { setLoading(false); }
  };

  const saveExpenditure = async (data: any, receiptBase64?: string) => {
    if(!data.grantId || !data.deliverableId || !data.categoryId) {
        alert("Please select a Grant, Deliverable, and Budget Category.");
        return false;
    }

    let savedPath = '';
    if (receiptBase64 && (window as any).electronAPI) {
      try {
        savedPath = await (window as any).electronAPI.saveReceipt(receiptBase64, `receipt_${Date.now()}.png`);
      } catch (e) { console.error("Save failed", e); }
    }

    const newTx: Expenditure = {
      id: crypto.randomUUID(),
      grantId: data.grantId,
      deliverableId: data.deliverableId,
      categoryId: data.categoryId,
      date: data.date,
      vendor: data.vendor,
      amount: parseFloat(data.amount),
      purchaser: data.purchaser,
      justification: data.justification,
      receiptUrl: savedPath || receiptBase64,
      status: 'Approved'
    };

    db.addExpenditure(newTx);
    return true;
  };

  const handleManualSubmit = async () => {
    if (await saveExpenditure(manualForm)) {
        alert("Expenditure Saved!");
        // Reset form but keep context if bulk adding
        setManualForm(prev => ({ 
            ...prev, 
            date: new Date().toISOString().split('T')[0], 
            amount: 0, 
            vendor: '', 
            justification: '' 
        }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Expenditure Input</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setMode('scan')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${mode === 'scan' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><Scan size={18} /> <span>Scanner</span></button>
          <button onClick={() => setMode('manual')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${mode === 'manual' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><FileInput size={18} /> <span>Manual</span></button>
        </div>
      </div>

      {mode === 'manual' ? (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HighContrastSelect label="Grant" options={grants.map(g => ({ value: g.id, label: g.name }))} value={manualForm.grantId} onChange={e => setManualForm({...manualForm, grantId: e.target.value, deliverableId: '', categoryId: ''})} />
                <HighContrastSelect label="Deliverable" options={availableDeliverables.map(d => ({ value: d.id, label: d.description }))} value={manualForm.deliverableId} onChange={e => setManualForm({...manualForm, deliverableId: e.target.value, categoryId: ''})} />
                <HighContrastSelect label="Category" options={availableCategories.map(c => ({ value: c.id, label: c.name }))} value={manualForm.categoryId} onChange={e => setManualForm({...manualForm, categoryId: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <HighContrastInput label="Date" type="date" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} />
                <HighContrastInput label="Amount" type="number" value={manualForm.amount} onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value)})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <HighContrastInput label="Vendor" value={manualForm.vendor} onChange={e => setManualForm({...manualForm, vendor: e.target.value})} />
                <HighContrastInput label="Purchaser" value={manualForm.purchaser} onChange={e => setManualForm({...manualForm, purchaser: e.target.value})} />
            </div>
            <HighContrastTextArea label="Justification" rows={3} value={manualForm.justification} onChange={e => setManualForm({...manualForm, justification: e.target.value})} />
            <button onClick={handleManualSubmit} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg flex justify-center items-center"><Save size={20} className="mr-2"/> Save Expenditure</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end relative">
            <input type="file" accept="image/*" className="absolute inset-0 w-full opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={loading} />
            <button className="bg-brand-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-md hover:bg-brand-700">{loading ? <Loader2 className="animate-spin" /> : <Upload />} <span>Upload Receipt</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queue.map(item => (
              <ReviewCard key={item.id} item={item} grants={grants} onSave={saveExpenditure} onRemove={(id: string) => setQueue(q => q.filter(i => i.id !== id))} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReviewCardProps {
  item: IngestionItem;
  grants: Grant[];
  onSave: (data: any, receiptBase64?: string) => Promise<boolean>;
  onRemove: (id: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ item, grants, onSave, onRemove }) => {
  const [data, setData] = useState<Partial<Expenditure>>(item.parsedData || { amount: 0, date: '', vendor: '' });
  
  const selectedGrant = grants.find((g:Grant) => g.id === data.grantId);
  const availableDeliverables = selectedGrant?.deliverables || [];
  const selectedDeliverable = availableDeliverables.find((d:Deliverable) => d.id === data.deliverableId);
  const availableCategories = selectedDeliverable?.budgetCategories || [];

  useEffect(() => { if (item.parsedData) setData(d => ({ ...d, ...item.parsedData })); }, [item.parsedData]);

  if (item.status === 'Scanning') return <div className="bg-white p-6 rounded-xl shadow-md flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 space-y-3">
      <img src={item.rawImage} className="h-32 w-full object-contain bg-slate-100 rounded" />
      <div className="space-y-2">
        <HighContrastSelect label="Grant" options={grants.map((g:Grant) => ({ value: g.id, label: g.name }))} value={data.grantId} onChange={(e:any) => setData({...data, grantId: e.target.value, deliverableId: '', categoryId: ''})} />
        {data.grantId && <HighContrastSelect label="Deliverable" options={availableDeliverables.map((d:Deliverable) => ({ value: d.id, label: d.description }))} value={data.deliverableId} onChange={(e:any) => setData({...data, deliverableId: e.target.value, categoryId: ''})} />}
        {data.deliverableId && <HighContrastSelect label="Category" options={availableCategories.map((c:BudgetCategory) => ({ value: c.id, label: c.name }))} value={data.categoryId} onChange={(e:any) => setData({...data, categoryId: e.target.value})} />}
        
        <HighContrastInput label="Vendor" value={data.vendor} onChange={e => setData({...data, vendor: e.target.value})} />
        <div className="grid grid-cols-2 gap-2">
            <HighContrastInput label="Date" type="date" value={data.date} onChange={e => setData({...data, date: e.target.value})} />
            <HighContrastInput label="Amount" type="number" value={data.amount} onChange={e => setData({...data, amount: parseFloat(e.target.value) || 0})} />
        </div>
        <HighContrastInput label="Purchaser" value={data.purchaser} onChange={e => setData({...data, purchaser: e.target.value})} />
        <HighContrastTextArea label="Justification" rows={2} value={data.justification} onChange={e => setData({...data, justification: e.target.value})} />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => onRemove(item.id)} className="flex-1 py-2 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 className="mx-auto" size={18} /></button>
        <button onClick={() => { onSave(data, item.rawImage).then((res:boolean) => { if(res) onRemove(item.id) }) }} className="flex-1 py-2 text-white bg-brand-600 rounded hover:bg-brand-700"><Check className="mx-auto" size={18} /></button>
      </div>
    </div>
  );
};