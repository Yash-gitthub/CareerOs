import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: (string | Option)[];
  error?: string;
  helperText?: string;
  optional?: boolean;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  error,
  helperText,
  optional = false,
  placeholder = 'Select an option',
  id,
  className,
  value,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'select');

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={selectId} className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
        {optional && (
          <span className="text-xs font-normal text-slate-600">Optional</span>
        )}
      </div>

      <div className="relative rounded-xl">
        <select
          id={selectId}
          value={value}
          className={clsx(
            'w-full block text-sm rounded-xl border bg-white px-3.5 py-2.5 pr-10 appearance-none transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            !value ? 'text-slate-400' : 'text-slate-900',
            error
              ? 'border-red-400 text-red-900 focus:ring-red-400 focus:border-red-400'
              : 'border-slate-300 hover:border-slate-400',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val} className="text-slate-900 py-1">
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
