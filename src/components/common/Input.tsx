import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
      <div className="flex w-full flex-col gap-1.5">
        <label className="ml-1 text-sm font-bold text-slate-700">
          {label}
        </label>
        <input
            className={`rounded-lg border bg-white px-4 py-2.5 outline-none transition-all
          ${error ? 'border-red-500' : 'border-slate-300 focus:border-slate-900'} 
          ${className}`}
            {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
  );
};

export default Input;