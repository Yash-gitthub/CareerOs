import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Clock, Play, SkipForward, CalendarClock, Pencil, Trash2, ChevronDown } from 'lucide-react';
import type { Task, TaskCategory, Priority } from '../../../engine/types';
import { useCareer } from '../../../store/CareerStore';
import { addDays, formatDate, today as todayISO } from '../../../engine/dates';
import { Badge, CATEGORY_META, PRIORITY_TONE, STATUS_META, TextButton, inputClass, Field } from '../ui';

const SKIP_REASONS = ['Not enough time', 'Too difficult right now', 'Not relevant', 'Already know this', 'Other'];

type Mode = 'view' | 'skip' | 'reschedule' | 'edit';

export const TaskItem: React.FC<{ task: Task; compact?: boolean }> = ({ task, compact = false }) => {
  const { completeTask, startTask, skipTask, rescheduleTask, updateTask, deleteTask, state } = useCareer();
  const [mode, setMode] = useState<Mode>('view');
  const [expanded, setExpanded] = useState(false);
  const [skipReason, setSkipReason] = useState(SKIP_REASONS[0]);
  const [newDate, setNewDate] = useState(addDays(todayISO(), 1));
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    estMinutes: task.estMinutes,
    dueDate: task.dueDate,
  });

  const done = task.status === 'completed';
  const closed = done || task.status === 'skipped';
  const cat = CATEGORY_META[task.category];
  const milestone = task.milestoneId ? state.roadmap?.milestones.find(m => m.id === task.milestoneId) : undefined;
  const project = task.projectId ? state.projects.find(p => p.id === task.projectId) : undefined;

  const descriptionParts = task.description.split(/(https?:\/\/\S+)/g);

  return (
    <div className={clsx(
      'p-3 rounded-xl border transition-colors',
      done ? 'bg-emerald-50/40 border-emerald-100' : task.status === 'overdue' ? 'bg-red-50/40 border-red-100' : 'bg-white border-slate-200'
    )}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => !closed && completeTask(task.id)}
          disabled={closed}
          aria-label={done ? 'Completed' : `Mark "${task.title}" complete`}
          className={clsx(
            'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
            done ? 'bg-emerald-600 border-emerald-600 text-white' : task.status === 'skipped' ? 'border-amber-300 bg-amber-50' : 'border-slate-300 hover:border-indigo-500'
          )}
        >
          {done && <Check className="w-3.5 h-3.5" />}
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={() => setExpanded(e => !e)} className="text-left min-w-0">
              <span className={clsx('text-xs font-semibold', closed ? 'text-slate-500 line-through' : 'text-slate-900')}>{task.title}</span>
            </button>
            {!compact && (
              <button type="button" onClick={() => setExpanded(e => !e)} aria-label="Toggle details" className="text-slate-400 hover:text-slate-600 shrink-0">
                <ChevronDown className={clsx('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={cat.tone}>{cat.icon}{cat.label}</Badge>
            <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Clock className="w-3 h-3" />{task.estMinutes} min</span>
            {task.status !== 'pending' && <Badge tone={STATUS_META[task.status].tone}>{STATUS_META[task.status].label}</Badge>}
            {task.dueDate !== todayISO() && <span className="text-[10px] text-slate-500">Due {formatDate(task.dueDate)}</span>}
            {task.source === 'intervention' && <Badge tone="amber">Adaptive</Badge>}
          </div>

          {(expanded || mode !== 'view') && (
            <div className="space-y-2 pt-1">
              {task.description && (
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line break-words">
                  {descriptionParts.map((part, i) =>
                    /^https?:\/\//.test(part)
                      ? <a key={i} href={part} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{part}</a>
                      : <React.Fragment key={i}>{part}</React.Fragment>
                  )}
                </p>
              )}
              {(milestone || project) && (
                <p className="text-[10px] text-slate-500">
                  {milestone && <>Roadmap: <strong className="text-slate-700">{milestone.title}</strong></>}
                  {milestone && project && ' · '}
                  {project && <>Project: <strong className="text-slate-700">{project.title}</strong></>}
                </p>
              )}
              {task.skipReason && <p className="text-[10px] text-amber-700">Skipped: {task.skipReason}</p>}
            </div>
          )}

          {mode === 'skip' && (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <Field label="Why skip?" className="flex-1 min-w-[10rem]">
                <select className={inputClass} value={skipReason} onChange={e => setSkipReason(e.target.value)}>
                  {SKIP_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <TextButton tone="red" onClick={() => { skipTask(task.id, skipReason); setMode('view'); }}>Confirm skip</TextButton>
              <TextButton tone="slate" onClick={() => setMode('view')}>Cancel</TextButton>
            </div>
          )}

          {mode === 'reschedule' && (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <Field label="New date" className="flex-1 min-w-[10rem]">
                <input type="date" className={inputClass} value={newDate} min={todayISO()} onChange={e => setNewDate(e.target.value)} />
              </Field>
              <TextButton onClick={() => { rescheduleTask(task.id, newDate); setMode('view'); }} disabled={!newDate}>Save</TextButton>
              <TextButton tone="slate" onClick={() => setMode('view')}>Cancel</TextButton>
            </div>
          )}

          {mode === 'edit' && (
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
              onSubmit={e => {
                e.preventDefault();
                if (!draft.title.trim()) return;
                updateTask(task.id, { ...draft, title: draft.title.trim(), estMinutes: Math.max(5, Math.min(480, Number(draft.estMinutes) || 30)) });
                setMode('view');
              }}
            >
              <Field label="Title" className="sm:col-span-2">
                <input className={inputClass} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} required />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className={inputClass} rows={2} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </Field>
              <Field label="Category">
                <select className={inputClass} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as TaskCategory })}>
                  {(Object.keys(CATEGORY_META) as TaskCategory[]).map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputClass} value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as Priority })}>
                  {(['low', 'medium', 'high', 'critical'] as Priority[]).map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Estimated minutes">
                <input type="number" min={5} max={480} className={inputClass} value={draft.estMinutes} onChange={e => setDraft({ ...draft, estMinutes: Number(e.target.value) })} />
              </Field>
              <Field label="Due date">
                <input type="date" className={inputClass} value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} />
              </Field>
              <div className="sm:col-span-2 flex gap-2">
                <TextButton type="submit">Save changes</TextButton>
                <TextButton tone="slate" onClick={() => setMode('view')}>Cancel</TextButton>
              </div>
            </form>
          )}

          {mode === 'view' && !closed && (
            <div className="flex flex-wrap items-center gap-0.5 -ml-1.5">
              {task.status !== 'in_progress' && (
                <TextButton onClick={() => startTask(task.id)}><Play className="w-3 h-3" />Start</TextButton>
              )}
              <TextButton tone="emerald" onClick={() => completeTask(task.id)}><Check className="w-3 h-3" />Complete</TextButton>
              {!compact && (
                <>
                  <TextButton tone="slate" onClick={() => setMode('skip')}><SkipForward className="w-3 h-3" />Skip</TextButton>
                  <TextButton tone="slate" onClick={() => setMode('reschedule')}><CalendarClock className="w-3 h-3" />Reschedule</TextButton>
                  <TextButton tone="slate" onClick={() => setMode('edit')}><Pencil className="w-3 h-3" />Edit</TextButton>
                </>
              )}
              {task.status === 'overdue' && (
                <TextButton onClick={() => rescheduleTask(task.id, todayISO())}>Move to today</TextButton>
              )}
            </div>
          )}

          {!compact && task.source === 'personal' && mode === 'view' && (
            <TextButton tone="red" className="-ml-1.5" onClick={() => deleteTask(task.id)}><Trash2 className="w-3 h-3" />Delete</TextButton>
          )}
        </div>
      </div>
    </div>
  );
};
