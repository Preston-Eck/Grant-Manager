import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { generateEmailTemplate } from '../services/geminiService';
import { EmailTemplate, Grant } from '../types';
import { HighContrastSelect, HighContrastInput, HighContrastTextArea } from './ui/Input';
import { Copy, Check, Plus, Trash2, Edit2, Save, X, Sparkles, Loader2 } from 'lucide-react';

export const Communication: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // Simulation State
  const [selectedGrant, setSelectedGrant] = useState<string>('');
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);

  // Edit/Create State
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  
  // AI Gen State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTemplates(db.getTemplates());
    setGrants(db.getGrants());
  };

  useEffect(() => {
    // Select first template if none selected and list is not empty
    if (templates.length > 0 && !selectedTemplate && !isCreating) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, isCreating, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate && !isEditing && !isCreating) {
      let text = selectedTemplate.body;
      const grant = grants.find(g => g.id === selectedGrant);
      const grantName = grant ? grant.name : '[GRANT NAME]';
      
      text = text.replace(/{{GrantName}}/g, grantName);
      text = text.replace(/{{Vendor}}/g, '[VENDOR NAME]');
      text = text.replace(/{{Date}}/g, new Date().toLocaleDateString());
      
      setPreview(text);
    }
  }, [selectedTemplate, selectedGrant, grants, isEditing, isCreating]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNew = () => {
    const newId = crypto.randomUUID();
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
    setEditForm({
      id: newId,
      title: 'New Template',
      subject: '',
      body: ''
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditForm({ ...template });
  };

  const handleSave = () => {
    if (editForm.id && editForm.title && editForm.body) {
      const templateToSave = editForm as EmailTemplate;
      db.saveTemplate(templateToSave);
      refreshData();
      setIsEditing(false);
      setIsCreating(false);
      setSelectedTemplate(templateToSave);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (!selectedTemplate && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this template?")) {
      db.deleteTemplate(id);
      refreshData();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const result = await generateEmailTemplate(editForm.title || "Grant Email", aiPrompt);
      setEditForm(prev => ({
        ...prev,
        subject: result.subject,
        body: result.body
      }));
      setShowAiInput(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate template using Gemini.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Templates</h3>
          <button 
            onClick={handleCreateNew}
            className="p-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
            title="Create New Template"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => {
                if(!isEditing) setSelectedTemplate(t);
              }}
              className={`group w-full flex justify-between items-start p-3 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedTemplate?.id === t.id && !isCreating
                  ? 'bg-brand-50 text-brand-700 border border-brand-200' 
                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
              } ${isEditing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex-1 truncate">
                <div className="font-semibold truncate">{t.title}</div>
                <div className="text-xs text-slate-500 truncate">{t.subject}</div>
              </div>
              <button 
                onClick={(e) => handleDelete(t.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <span className="font-bold text-brand-700 flex items-center gap-2">
                {isCreating ? <Plus size={18}/> : <Edit2 size={18}/>}
                {isCreating ? 'Creating New Template' : 'Editing Template'}
              </span>
            ) : (
              <>
                 <span className="font-bold text-slate-700">Preview Mode</span>
                 {selectedTemplate && (
                   <button 
                    onClick={() => handleEdit(selectedTemplate)}
                    className="ml-4 text-xs flex items-center space-x-1 text-brand-600 hover:text-brand-800 font-medium"
                   >
                     <Edit2 size={12} />
                     <span>Edit Template</span>
                   </button>
                 )}
              </>
            )}
          </div>
          
          {/* Action Buttons */}
          {isEditing && (
            <div className="flex space-x-2">
              <button 
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-md font-medium flex items-center space-x-1"
              >
                <Save size={16} />
                <span>Save Template</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <HighContrastInput 
                  label="Template Internal Title"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  placeholder="e.g., Receipt Rejection Notice"
                />
                <HighContrastInput 
                  label="Email Subject Line"
                  value={editForm.subject || ''}
                  onChange={e => setEditForm({...editForm, subject: e.target.value})}
                  placeholder="e.g., Action Required: {{Vendor}}"
                />
              </div>

              <div className="relative">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-sm font-semibold text-slate-700">Message Body</label>
                  <button 
                    onClick={() => setShowAiInput(!showAiInput)}
                    className="text-xs flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200"
                  >
                    <Sparkles size={12} />
                    <span>Generate with AI</span>
                  </button>
                </div>

                {showAiInput && (
                   <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex flex-col space-y-2">
                     <label className="text-xs font-bold text-indigo-800">Describe what you want the email to say:</label>
                     <div className="flex space-x-2">
                       <input 
                         className="flex-1 border border-indigo-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="e.g. A polite reminder to submit quarterly reports, tone should be professional but urgent."
                         value={aiPrompt}
                         onChange={e => setAiPrompt(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                       />
                       <button 
                        onClick={handleAiGenerate}
                        disabled={aiLoading}
                        className="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 flex items-center"
                       >
                         {aiLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                       </button>
                     </div>
                   </div>
                )}

                <HighContrastTextArea 
                  rows={12}
                  value={editForm.body || ''}
                  onChange={e => setEditForm({...editForm, body: e.target.value})}
                  placeholder="Use {{GrantName}}, {{Vendor}}, {{Date}} as placeholders."
                />
              </div>
            </div>
          ) : (
            // Preview Mode
            <div className="flex flex-col h-full">
               <div className="mb-4">
                <HighContrastSelect 
                  label="Preview Context (Simulate Data)"
                  options={[{value: '', label: 'Generic (No Grant Selected)'}, ...grants.map(g => ({ value: g.id, label: g.name }))]}
                  value={selectedGrant}
                  onChange={(e) => setSelectedGrant(e.target.value)}
                />
              </div>
              
              <div className="space-y-1 mb-4">
                <label className="text-xs uppercase font-bold text-slate-400">Subject Line</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium">
                  {selectedTemplate?.subject.replace(/{{GrantName}}/g, grants.find(g => g.id === selectedGrant)?.name || '[GRANT NAME]')}
                </div>
              </div>
              
              <div className="space-y-1 flex-1 flex flex-col">
                 <label className="text-xs uppercase font-bold text-slate-400">Message Body</label>
                 <div className="flex-1 p-4 bg-white border border-slate-200 rounded text-slate-800 font-sans leading-relaxed whitespace-pre-wrap overflow-y-auto">
                   {preview}
                 </div>
              </div>

              <div className="flex justify-end mt-4">
                 <button 
                  onClick={copyToClipboard}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold text-white transition-all ${
                    copied ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'
                  }`}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};