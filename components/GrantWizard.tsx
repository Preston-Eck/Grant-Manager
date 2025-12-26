import React, { useState } from 'react';
import { generateGrantSection } from '../services/geminiService';
import { HighContrastInput, HighContrastTextArea, HighContrastSelect } from './ui/Input';
import { Wand2, Copy, Check } from 'lucide-react';

export const GrantWizard: React.FC = () => {
  const [grantName, setGrantName] = useState('');
  const [funder, setFunder] = useState('');
  const [section, setSection] = useState('Executive Summary');
  const [details, setDetails] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!grantName || !details) return;
    setLoading(true);
    setCopied(false);
    try {
      const result = await generateGrantSection(section, grantName, funder, details);
      setOutput(result);
    } catch (e) {
      setOutput("Error generating content. Please check API Key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Wand2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-indigo-900">AI Proposal Wizard</h2>
            <p className="text-indigo-700 text-sm">Draft high-quality grant sections in seconds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <HighContrastInput 
            label="Grant Title" 
            placeholder="e.g. Youth Coding Initiative"
            value={grantName}
            onChange={(e) => setGrantName(e.target.value)}
          />
          <HighContrastInput 
            label="Funder Name" 
            placeholder="e.g. National Science Foundation"
            value={funder}
            onChange={(e) => setFunder(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <HighContrastSelect 
            label="Section to Draft"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            options={[
              { value: 'Executive Summary', label: 'Executive Summary' },
              { value: 'Statement of Need', label: 'Statement of Need' },
              { value: 'Program Design/Methodology', label: 'Program Design/Methodology' },
              { value: 'Budget Justification', label: 'Budget Justification' },
              { value: 'Organizational Capacity', label: 'Organizational Capacity' }
            ]}
          />
        </div>

        <div className="mb-4">
          <HighContrastTextArea 
            label="Key Details (Bullet points work best)"
            placeholder="- Target audience: Underserved high school students&#10;- Goal: Teach Python to 50 students&#10;- Timeline: 6 months&#10;- Budget needs: Laptops, instructor stipends"
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !grantName}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'AI is Writing...' : 'Generate Draft'}
        </button>
      </div>

      {output && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Generated Draft</h3>
            <button 
              onClick={copyToClipboard}
              className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-brand-600"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
            {output}
          </div>
        </div>
      )}
    </div>
  );
};