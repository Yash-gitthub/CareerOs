import React, { useMemo, useState } from 'react';
import { CalendarCheck, Plus, Target, Activity, ListChecks, Sparkles } from 'lucide-react';
import type { Priority, TaskCategory } from '../../../engine/types';
import { useCareer } from '../../../store/CareerStore';
import { useOnboarding } from '../../../context/OnboardingContext';
import { addDays, formatDate, today as todayISO, weekStart } from '../../../engine/dates';
import { dailyBudgetMinutes, weeklyGoalProgress, weekNumber } from '../../../engine/taskGeneration';
import { Button } from '../../common/Button';
import { Card, CardHeader, EmptyState, Field, Meter, CATEGORY_META, inputClass, TextButton } from '../ui';
import { TaskItem } from './TaskItem';

export const WeeklyGoalsCard: React.FC = () => {
  const { state } = useCareer();
  const week = weekStart(todayISO());
  const goals = weeklyGoalProgress(state, week, state.weeklyGoals[week] || {});
  return (
    <Card>
      <CardHeader icon={<Target className="w-4 h-4" />} title={`Week ${weekNumber(state, week)} goals`} subtitle={`${formatDate(week)} – ${formatDate(addDays(week, 6))}`} />
      {goals.length ? (
        <div className="space-y-3">
          {goals.map(g => (
            <div key={g.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{g.label}</span>
                <span className="tabular-nums text-slate-600"><strong className="text-slate-900">{g.actual}</strong> / {g.target} {g.unit}</span>
              </div>
              <Meter value={g.actual} max={Math.max(1, g.target)} tone={g.actual >= g.target ? 'emerald' : 'indigo'} label={`${g.label} weekly goal`} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Weekly goals appear once your plan is generated." />
      )}
    </Card>
  );
};

export const ConsistencyCard: React.FC = () => {
  const { twin } = useCareer();
  const c = twin.behavioral.consistency7;
  return (
    <Card>
      <CardHeader icon={<Activity className="w-4 h-4" />} title="Consistency" subtitle="Last 7 days" />
      {c.score === null ? (
        <EmptyState title="Not measured yet" body="Consistency is calculated once your first planned day has passed." />
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{Math.round(c.score)}%</span>
            <span className="text-xs text-slate-500 pb-1">this week</span>
          </div>
          <Meter value={c.score} tone={c.score >= 70 ? 'emerald' : c.score >= 45 ? 'indigo' : 'amber'} label="Weekly consistency" />
          <dl className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50"><dt className="text-slate-500">Tasks</dt><dd className="font-bold text-slate-900 tabular-nums">{c.completed}/{c.planned}</dd></div>
            <div className="p-2 rounded-lg bg-slate-50"><dt className="text-slate-500">Study sessions</dt><dd className="font-bold text-slate-900 tabular-nums">{c.learningCompleted}/{c.learningPlanned}</dd></div>
            <div className="p-2 rounded-lg bg-slate-50"><dt className="text-slate-500">Active days</dt><dd className="font-bold text-slate-900 tabular-nums">{c.activeDays}/7</dd></div>
          </dl>
        </div>
      )}
    </Card>
  );
};

const AddTaskForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addTask } = useCareer();
  const [form, setForm] = useState({
    title: '', description: '', category: 'personal' as TaskCategory, priority: 'medium' as Priority, estMinutes: 30, dueDate: todayISO(),
  });
  const [error, setError] = useState('');
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
      onSubmit={e => {
        e.preventDefault();
        if (!form.title.trim()) return setError('Give the task a title.');
        if (!form.dueDate) return setError('Pick a due date.');
        addTask({ ...form, title: form.title.trim(), estMinutes: Math.max(5, Math.min(480, Number(form.estMinutes) || 30)) });
        onDone();
      }}
    >
      <Field label="Title" className="sm:col-span-2">
        <input className={inputClass} value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }} placeholder="e.g. Revise OS scheduling notes" autoFocus />
      </Field>
      <Field label="Description (optional)" className="sm:col-span-2">
        <textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Category">
        <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as TaskCategory })}>
          {(Object.keys(CATEGORY_META) as TaskCategory[]).map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
        </select>
      </Field>
      <Field label="Priority">
        <select className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
          {(['low', 'medium', 'high', 'critical'] as Priority[]).map(p => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Estimated minutes">
        <input type="number" min={5} max={480} className={inputClass} value={form.estMinutes} onChange={e => setForm({ ...form, estMinutes: Number(e.target.value) })} />
      </Field>
      <Field label="Due date">
        <input type="date" className={inputClass} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
      </Field>
      {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" size="sm">Add task</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
};

export const TodayTasksCard: React.FC<{ compact?: boolean; limit?: number }> = ({ compact = false, limit }) => {
  const { state, generateTodayTasks, setActiveTab } = useCareer();
  const { user } = useOnboarding();
  const today = todayISO();
  const tasks = state.tasks
    .filter(t => t.dueDate === today || (t.status === 'in_progress'))
    .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'));
  const done = tasks.filter(t => t.status === 'completed').length;
  const minutesPlanned = tasks.reduce((s, t) => s + t.estMinutes, 0);
  const shown = limit ? tasks.slice(0, limit) : tasks;

  return (
    <Card>
      <CardHeader
        icon={<CalendarCheck className="w-4 h-4" />}
        title="Today's Tasks"
        subtitle={tasks.length ? `${done}/${tasks.length} done · ${minutesPlanned} of ${dailyBudgetMinutes(user, state)} min budget` : formatDate(today, { weekday: 'long', month: 'short', day: 'numeric' })}
        action={compact && tasks.length > (limit || 0) ? <TextButton onClick={() => setActiveTab('tasks')}>View all</TextButton> : undefined}
      />
      {tasks.length ? (
        <div className="space-y-2">
          {tasks.length > 0 && <Meter value={done} max={tasks.length} tone="emerald" label="Today's progress" className="mb-3" />}
          {shown.map(t => <TaskItem key={t.id} task={t} compact={compact} />)}
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title={state.roadmap ? 'No tasks for today yet' : 'Your daily plan starts with a roadmap'}
          body={state.roadmap
            ? 'Generate today\'s tasks from your active roadmap week, weak areas and projects.'
            : 'Take the assessment for the most accurate plan, or generate a starter plan from your profile now.'}
          action={<Button size="sm" onClick={generateTodayTasks}>{state.roadmap ? "Create today's tasks" : 'Generate my plan'}</Button>}
        />
      )}
    </Card>
  );
};

export const TasksTab: React.FC = () => {
  const { state, generateTodayTasks } = useCareer();
  const [adding, setAdding] = useState(false);
  const today = todayISO();

  const { overdue, upcoming, history } = useMemo(() => ({
    overdue: state.tasks.filter(t => t.status === 'overdue').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    upcoming: state.tasks.filter(t => t.dueDate > today && t.dueDate <= addDays(today, 7) && t.status !== 'completed').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    history: state.tasks
      .filter(t => (t.status === 'completed' || t.status === 'skipped') && t.dueDate < today && t.dueDate >= addDays(today, -14))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
  }), [state.tasks, today]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Daily plan</h2>
          <div className="flex gap-2">
            {state.roadmap && (
              <Button size="sm" variant="outline" onClick={generateTodayTasks} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>Refresh today's plan</Button>
            )}
            <Button size="sm" onClick={() => setAdding(a => !a)} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add personal task</Button>
          </div>
        </div>

        {adding && <AddTaskForm onDone={() => setAdding(false)} />}

        <TodayTasksCard />

        {overdue.length > 0 && (
          <Card>
            <CardHeader icon={<ListChecks className="w-4 h-4" />} title={`Overdue (${overdue.length})`} subtitle="Complete, move to today, reschedule or skip" />
            <div className="space-y-2">{overdue.map(t => <TaskItem key={t.id} task={t} />)}</div>
          </Card>
        )}

        <Card>
          <CardHeader icon={<CalendarCheck className="w-4 h-4" />} title="Upcoming (next 7 days)" />
          {upcoming.length
            ? <div className="space-y-2">{upcoming.map(t => <TaskItem key={t.id} task={t} />)}</div>
            : <EmptyState title="Nothing scheduled ahead." body="Daily tasks are created each morning from your roadmap. Recovery plans and personal tasks show up here." />}
        </Card>

        <Card>
          <CardHeader icon={<ListChecks className="w-4 h-4" />} title="Recent history" subtitle="Last 14 days" />
          {history.length
            ? <div className="space-y-2">{history.map(t => <TaskItem key={t.id} task={t} compact />)}</div>
            : <EmptyState title="No finished tasks yet." />}
        </Card>
      </div>

      <div className="space-y-6">
        <WeeklyGoalsCard />
        <ConsistencyCard />
      </div>
    </div>
  );
};
