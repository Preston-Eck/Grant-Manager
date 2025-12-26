import React from 'react';

// STYLES.PY Equivalent in React/Tailwind
// enforcing White Background (#ffffff) and Black Text (#000000) for accessibility/contrast

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