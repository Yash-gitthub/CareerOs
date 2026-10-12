import React from 'react';

export const Footer: React.FC = () => (
  <footer className="border-t border-indigo-200/60 bg-ink/70">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-slate-500">
      <div className="flex items-center gap-2">
        <span className="status-dot" aria-hidden="true" />
        <span className="text-slate-800 font-semibold">Career<span className="text-indigo-500">OS</span></span>
        <span className="hidden sm:inline">// AI career twin for engineering & IT</span>
      </div>
      <div className="flex items-center gap-3 tracking-wide">
        <span>SYSTEM_READY</span>
        <span className="text-indigo-300">|</span>
        <span>NO_SYNTHETIC_DATA</span>
      </div>
    </div>
  </footer>
);
