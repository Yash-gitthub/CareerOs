import React from 'react';

export const Footer: React.FC = () => (
  <footer className="border-t border-slate-200/80">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className="font-display text-sm text-slate-800">AI Career<span className="italic text-indigo-600">OS</span></span>
        <span>· Made for CS and IT students</span>
      </div>
      <span>We help you prepare. We don't promise placements.</span>
    </div>
  </footer>
);
