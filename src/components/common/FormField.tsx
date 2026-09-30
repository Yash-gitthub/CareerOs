import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  optional = false,
  leftIcon,
  rightElement,
  id,
  className,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'field');

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
        {optional && (
          <span className="text-xs font-normal text-slate-600">Optional</span>
        )}
      </div>

      <div className="relative rounded-xl">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={clsx(
            'w-full block text-sm rounded-xl border bg-white px-3.5 py-2.5 transition-colors placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            leftIcon && 'pl-10',
            rightElement && 'pr-11',
            error
              ? 'border-red-400 text-red-900 focus:ring-red-400 focus:border-red-400'
              : 'border-slate-300 hover:border-slate-400 text-slate-900',
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
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
