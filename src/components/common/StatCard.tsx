import React from 'react';

// System-monitor style stat panel.
export const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="group relative h-full p-6 sm:p-8 rounded-sm terminal-panel overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/70 hover:shadow-card-hover">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
    <div className="mt-3 font-mono text-4xl sm:text-[2.6rem] font-semibold text-indigo-500 tabular-nums [text-shadow:0_0_18px_rgba(0,255,65,0.35)]">{value}</div>
    {sub && <div className="mt-2 font-mono text-xs text-emerald-600">{sub}</div>}
  </div>
);
