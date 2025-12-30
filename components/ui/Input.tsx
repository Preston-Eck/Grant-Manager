import React, { useState, useEffect } from 'react';

const HIGH_CONTRAST_CLASS = "bg-white text-black border-2 border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-gray-500 rounded-md shadow-sm";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const HighContrastInput: React.FC<InputProps> = ({ label, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <input 
      className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`}
      {...props}
    />
  </div>
);

// NEW: Currency Input that handles commas and allows deleting "0"
export const HighContrastCurrencyInput: React.FC<InputProps> = ({ label, value, onChange, className = "", ...props }) => {
    const [displayVal, setDisplayVal] = useState('');
  
    useEffect(() => {
      // Sync display value if prop changes externally (and isn't currently being edited to specific partial state)
      if (value !== undefined && value !== null) {
          setDisplayVal(value.toLocaleString('en-US', { maximumFractionDigits: 2 }));
      }
    }, [value]);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      
      // Allow empty string to delete "0"
      if (raw === '') {
        setDisplayVal('');
        if (onChange) {
            e.target.value = '0';
            onChange(e);
        }
        return;
      }
  
      if (!isNaN(Number(raw))) {
         setDisplayVal(raw); // Keep raw for typing
         if (onChange) {
             e.target.value = raw; // Pass number-like string to parent
             onChange(e);
         }
      }
    };
  
    const handleBlur = () => {
        // Format on blur
        const num = parseFloat(displayVal.replace(/,/g, ''));
        if (!isNaN(num)) {
            setDisplayVal(num.toLocaleString('en-US', { maximumFractionDigits: 2 }));
        }
    };
  
    return (
      <div className="flex flex-col space-y-1">
        {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
        <input 
          className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`}
          value={displayVal}
          onChange={handleChange}
          onBlur={handleBlur}
          inputMode="decimal"
          {...props}
        />
      </div>
    );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const HighContrastTextArea: React.FC<TextAreaProps> = ({ label, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <textarea 
      className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`}
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const HighContrastSelect: React.FC<SelectProps> = ({ label, options, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <select 
      className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);