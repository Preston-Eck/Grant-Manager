import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Grant, Expenditure } from '../types';
import { HighContrastInput, HighContrastSelect, HighContrastTextArea } from './ui/Input';
import { Save, Upload, FileText, CheckCircle, RefreshCw } from 'lucide-react';

interface ExpenditureInputProps {
  onNavigate?: (tab: string, data?: any) => void;
  initialData?: any;
}

export const ExpenditureInput: React.FC<ExpenditureInputProps> = ({ onNavigate, initialData }) => {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [form, setForm] = useState<Partial<Expenditure>>({
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
    setExpenditures(db.getExpenditures());

    // Handle Deep Linking (e.g. from Grant Manager "Add Expenditure")
    if (initialData && initialData.action === 'prefill') {
        setForm(prev => ({
            ...prev,
            grantId: initialData.grantId,
            deliverableId: initialData.deliverableId,
            categoryId: initialData.categoryId
        }));
    }
  }, [initialData]);

  // --- Filtering Logic ---
  const selectedGrant = grants.find(g => g.id === form.grantId);
  const availableDeliverables = selectedGrant?.deliverables || [];
  const selectedDeliverable = availableDeliverables.find(d => d.id === form.deliverableId);
  const availableCategories = selectedDeliverable?.budgetCategories || [];

  // Historic Data (Filtered by Grant if selected, otherwise all)
  const relevantHistory = form.grantId 
    ? expenditures.filter(e => e.grantId === form.grantId) 
    : expenditures;
    
  const uniqueVendors = Array.from(new Set(relevantHistory.map(e => e.vendor))).sort();
  const uniquePurchasers = Array.from(new Set(relevantHistory.map(e => e.purchaser).filter((p): p is string => !!p))).sort();

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow clearing the input (empty string) without it turning into 0 immediately
    setForm({ ...form, amount: val === '' ? undefined : parseFloat(val) });
  };

  const handleSubmit = async () => {
    if(!form.grantId || !form.deliverableId || !form.categoryId) {
        alert("Please select a Grant, Deliverable, and Budget Category.");
        return;
    }
    if(!form.vendor || form.amount === undefined || form.amount === 0) {
        alert("Vendor and Amount are required.");
        return;
    }

    // 1. Save File (if present)
    let savedPath = '';
    if (receiptFile && (window as any).electronAPI) {
        const reader = new FileReader();
        reader.readAsDataURL(receiptFile);
        await new Promise<void>(resolve => {
            reader.onload = async () => {
                const base64 = reader.result as string;
                savedPath = await (window as any).electronAPI.saveReceipt(base64, `receipt_${Date.now()}_${receiptFile.name}`);
                resolve();
            };
        });
    }

    // 2. Create Transaction
    const newTx: Expenditure = {
      id: crypto.randomUUID(),
      grantId: form.grantId,
      deliverableId: form.deliverableId,
      categoryId: form.categoryId,
      date: form.date || new Date().toISOString().split('T')[0],
      vendor: form.vendor,
      amount: form.amount || 0,
      purchaser: form.purchaser || '',
      justification: form.justification || '',
      notes: form.notes || '',
      receiptUrl: savedPath || '', 
      status: 'Approved'
    };

    // 3. Save to DB
    db.addExpenditure(newTx);
    setExpenditures(db.getExpenditures()); // Refresh local history

    alert("Expenditure saved successfully!");
    
    // 4. Reset Form (Keep Grant context? No, user requested reset)
    setForm({
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
    setReceiptFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Datalists for Autocomplete */}
      <datalist id="vendors">
        {uniqueVendors.map((v, i) => <option key={i} value={v} />)}
      </datalist>
      <datalist id="purchasers">
        {uniquePurchasers.map((p, i) => <option key={i} value={p} />)}
      </datalist>

      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">New Expenditure</h2>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        
        {/* Hierarchy Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <HighContrastSelect 
                label="1. Select Grant" 
                options={[{value: '', label: '-- Select Grant --'}, ...grants.map(g => ({ value: g.id, label: g.name }))]} 
                value={form.grantId} 
                onChange={e => setForm({...form, grantId: e.target.value, deliverableId: '', categoryId: ''})} 
            />
            <HighContrastSelect 
                label="2. Select Deliverable" 
                options={[{value: '', label: '-- Select Deliverable --'}, ...availableDeliverables.map(d => ({ value: d.id, label: d.sectionReference + ': ' + d.description }))]} 
                value={form.deliverableId} 
                disabled={!form.grantId}
                onChange={e => setForm({...form, deliverableId: e.target.value, categoryId: ''})} 
            />
            <HighContrastSelect 
                label="3. Budget Category" 
                options={[{value: '', label: '-- Select Category --'}, ...availableCategories.map(c => ({ value: c.id, label: c.name }))]} 
                value={form.categoryId} 
                disabled={!form.deliverableId}
                onChange={e => setForm({...form, categoryId: e.target.value})} 
            />
        </div>

        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HighContrastInput 
                label="Transaction Date" 
                type="date" 
                value={form.date || ''} 
                onChange={e => setForm({...form, date: e.target.value})} 
            />
            <HighContrastInput 
                label="Amount ($)" 
                type="number" 
                placeholder="0.00"
                value={form.amount ?? ''} 
                onChange={handleAmountChange} 
            />
        </div>

        {/* Vendor & Purchaser (With History) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HighContrastInput 
                label="Vendor / Payee" 
                list="vendors" 
                placeholder="Start typing or select..." 
                value={form.vendor || ''} 
                onChange={e => setForm({...form, vendor: e.target.value})} 
            />
            <HighContrastInput 
                label="Purchaser / Employee" 
                list="purchasers" 
                placeholder="Who made the purchase?"
                value={form.purchaser || ''} 
                onChange={e => setForm({...form, purchaser: e.target.value})} 
            />
        </div>

        {/* Text Areas */}
        <div className="space-y-4">
            <HighContrastTextArea 
                label="Justification (Required)" 
                rows={2} 
                placeholder="Why was this purchase necessary for the deliverable?"
                value={form.justification || ''} 
                onChange={e => setForm({...form, justification: e.target.value})} 
            />
            <HighContrastTextArea 
                label="Notes / Additional Details" 
                rows={2} 
                placeholder="Invoice #, tax details, or other notes..."
                value={form.notes || ''} 
                onChange={e => setForm({...form, notes: e.target.value})} 
            />
        </div>

        {/* Receipt Upload */}
        <div className="pt-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Receipt / Invoice</label>
            <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg border border-slate-300 flex items-center transition-colors">
                    <Upload size={18} className="mr-2" />
                    <span>{receiptFile ? 'Change File' : 'Attach File'}</span>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                </label>
                {receiptFile && (
                    <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded-md border border-green-200">
                        <FileText size={16} className="mr-2" />
                        <span className="truncate max-w-xs">{receiptFile.name}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
             <button 
                onClick={handleSubmit} 
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center space-x-2 transition-all transform active:scale-95"
            >
                <Save size={20} />
                <span>Save Expenditure</span>
             </button>
        </div>

      </div>
    </div>
  );
};