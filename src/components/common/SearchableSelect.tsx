import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  optional?: boolean;
  required?: boolean;
  placeholder?: string;
  allowCustom?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  optional = false,
  placeholder = 'Search or select...',
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: string) => {
    onChange(item);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && allowCustom) {
      e.preventDefault();
      onChange(query.trim());
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
        {optional && (
          <span className="text-xs font-normal text-slate-600">Optional</span>
        )}
      </div>

      <div className="relative">
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={clsx(
            'w-full flex items-center justify-between text-sm rounded-xl border bg-white px-3.5 py-2.5 transition-colors cursor-pointer',
            'focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500',
            error
              ? 'border-red-400 text-red-900'
              : 'border-slate-300 hover:border-slate-400',
            !value && 'text-slate-400'
          )}
        >
          <span className={clsx('truncate', value ? 'text-slate-900 font-medium' : 'text-slate-400')}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1.5 ml-2 text-slate-400">
            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onChange('');
                  }
                }}
                className="p-0.5 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-100">
            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleCustomInput}
                placeholder="Type to search or enter custom name..."
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value.toLowerCase() === opt.toLowerCase();
                  return (
                    <div
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className={clsx(
                        'px-3 py-2 text-sm rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                    </div>
                  );
                })
              ) : query.trim() && allowCustom ? (
                <div
                  onClick={() => handleSelect(query.trim())}
                  className="px-3 py-2.5 text-sm text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg cursor-pointer flex items-center justify-between font-medium"
                >
                  <span>Use "{query.trim()}"</span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded">Press Enter</span>
                </div>
              ) : (
                <div className="px-3 py-4 text-xs text-center text-slate-400">
                  No matching options found
                </div>
              )}
            </div>
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
