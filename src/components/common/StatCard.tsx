import React from 'react';
import { clsx } from 'clsx';

const TONES = {
  paper: 'bg-white border-slate-200/80',
  sage: 'bg-tint-sage border-emerald-200/60',
  peach: 'bg-tint-peach border-indigo-200/60',
  sand: 'bg-tint-sand border-amber-200/60',
};

// Numbered editorial card: "01  You tell it where you are."
export const StatCard: React.FC<{ label: string; value: string; sub?: string; tone?: keyof typeof TONES }> = ({ label, value, sub, tone = 'paper' }) => (
  <div className={clsx('h-full p-6 sm:p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover', TONES[tone])}>
    <div className="font-display italic text-3xl text-indigo-600">{label}</div>
    <div className="mt-4 font-display text-xl text-slate-900 leading-snug">{value}</div>
    {sub && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{sub}</p>}
  </div>
);
