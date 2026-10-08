import React from 'react';
import { clsx } from 'clsx';
import { Brain, Code2, FolderGit2, GitBranch, BookOpen, User, Cpu } from 'lucide-react';
import type { Priority, TaskCategory, TaskStatus } from '../../engine/types';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={clsx('bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-card', className)}>{children}</div>
);

export const CardHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <h3 className="font-bold text-slate-900 text-sm truncate">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

type Tone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'red' | 'sky';
const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-800 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'slate', children, className }) => (
  <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap', TONES[tone], className)}>
    {children}
  </span>
);

export const Meter: React.FC<{ value: number; max?: number; tone?: 'indigo' | 'emerald' | 'amber' | 'red'; className?: string; label?: string }> = ({
  value, max = 100, tone = 'indigo', className, label,
}) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color = { indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', amber: 'bg-amber-500', red: 'bg-red-500' }[tone];
  return (
    <div className={clsx('h-2 rounded-full bg-slate-100 overflow-hidden', className)} role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  );
};

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
    {icon && <div className="w-8 h-8 mx-auto text-slate-400 flex items-center justify-center">{icon}</div>}
    <p className="text-xs font-semibold text-slate-700">{title}</p>
    {body && <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">{body}</p>}
    {action && <div className="pt-1">{action}</div>}
  </div>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
    <div className="text-[11px] font-medium text-slate-500">{label}</div>
    <div className="text-xl font-extrabold text-slate-900 tabular-nums">{value}</div>
    {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
  </div>
);

export const CATEGORY_META: Record<TaskCategory, { label: string; icon: React.ReactNode; tone: Tone }> = {
  dsa: { label: 'DSA', icon: <Code2 className="w-3 h-3" />, tone: 'indigo' },
  learning: { label: 'Learning', icon: <BookOpen className="w-3 h-3" />, tone: 'sky' },
  project: { label: 'Project', icon: <FolderGit2 className="w-3 h-3" />, tone: 'emerald' },
  github: { label: 'GitHub', icon: <GitBranch className="w-3 h-3" />, tone: 'slate' },
  core_cs: { label: 'Core CS', icon: <Cpu className="w-3 h-3" />, tone: 'amber' },
  personal: { label: 'Personal', icon: <User className="w-3 h-3" />, tone: 'slate' },
};

export const PRIORITY_TONE: Record<Priority, Tone> = { critical: 'red', high: 'amber', medium: 'indigo', low: 'slate' };

export const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'slate' },
  in_progress: { label: 'In progress', tone: 'indigo' },
  completed: { label: 'Completed', tone: 'emerald' },
  skipped: { label: 'Skipped', tone: 'amber' },
  overdue: { label: 'Overdue', tone: 'red' },
};

export const scoreTone = (v: number | null): 'indigo' | 'emerald' | 'amber' | 'red' =>
  v === null ? 'indigo' : v >= 70 ? 'emerald' : v >= 40 ? 'indigo' : v >= 20 ? 'amber' : 'red';

export const BrainIcon = Brain;

export const inputClass =
  'w-full block text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400';

export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <label className={clsx('block space-y-1', className)}>
    <span className="text-[11px] font-semibold text-slate-700">{label}</span>
    {children}
  </label>
);

export const TextButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'indigo' | 'slate' | 'red' | 'emerald' }> = ({
  tone = 'indigo', className, children, ...props
}) => (
  <button
    type="button"
    className={clsx(
      'inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-1.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
      tone === 'indigo' && 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50',
      tone === 'slate' && 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
      tone === 'red' && 'text-red-600 hover:text-red-700 hover:bg-red-50',
      tone === 'emerald' && 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
