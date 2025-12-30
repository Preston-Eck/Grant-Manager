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

export const HighContrastTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <textarea className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`} {...props} />
  </div>
);

export const HighContrastSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: { value: string; label: string }[] }> = ({ label, options, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <select className={`${HIGH_CONTRAST_CLASS} px-3 py-2 ${className}`} {...props}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const HighContrastCurrencyInput: React.FC<InputProps> = ({ label, value, onChange, className = "", ...props }) => {
    const [displayVal, setDisplayVal] = useState('');
    const [isFocused, setIsFocused] = useState(false);
  
    useEffect(() => {
      if (!isFocused && value !== undefined && value !== null) {
          setDisplayVal(Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    }, [value, isFocused]);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      // Allow digits, one decimal point, and negative sign; prevent non-numeric characters
      if (!/^-?\d*\.?\d*$/.test(rawInput.replace(/,/g, ''))) return;

      setDisplayVal(rawInput); 

      if (onChange) {
         // Strip commas for the actual numeric value
         const cleanVal = rawInput.replace(/,/g, '');
         const num = parseFloat(cleanVal);
         
         const event = {
             ...e,
             target: { ...e.target, value: isNaN(num) ? '' : num.toString() }
         };
         onChange(event as any);
      }
    };
  
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        const val = value ? value.toString() : '';
        setDisplayVal(val);
        if(props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (value !== undefined && value !== null && value !== '') {
            setDisplayVal(Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
        if(props.onBlur) props.onBlur(e);
    };
  
    return (
      <div className="flex flex-col space-y-1">
        {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
        <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400">$</span>
            <input 
              className={`${HIGH_CONTRAST_CLASS} pl-7 px-3 py-2 ${className}`}
              value={displayVal}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              inputMode="decimal"
              {...props}
              type="text" 
            />
        </div>
      </div>
    );
};