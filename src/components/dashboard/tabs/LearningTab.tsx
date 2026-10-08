import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { BookOpen, ExternalLink, Clock, Check, Play, NotebookPen } from 'lucide-react';
import { useCareer } from '../../../store/CareerStore';
import { useOnboarding } from '../../../context/OnboardingContext';
import { rankResources } from '../../../engine/learning';
import type { ResourceType } from '../../../data/learningResources';
import { formatDate } from '../../../engine/dates';
import { Button } from '../../common/Button';
import { Badge, Card, CardHeader, EmptyState, Field, inputClass } from '../ui';

const TYPES: (ResourceType | 'all')[] = ['all', 'video', 'documentation', 'course', 'article', 'practice', 'project'];

export const LearningTab: React.FC = () => {
  const { state, twin, startResource, completeResource, logLearning } = useCareer();
  const { user } = useOnboarding();
  const [type, setType] = useState<ResourceType | 'all'>('all');
  const [showAll, setShowAll] = useState(false);
  const [log, setLog] = useState({ skill: twin.gaps[0]?.skill || '', minutes: 45, note: '' });
  const [logError, setLogError] = useState('');
  const ranked = useMemo(() => rankResources(user, state, twin), [user, state, twin]);
  const filtered = ranked.filter(r => (type === 'all' || r.resource.type === type) && (showAll || r.score > 0 || r.completed));
  const planned = new Set(state.tasks.filter(t => t.status !== 'completed').map(t => t.title));
  const skills = Array.from(new Set([...twin.gaps.map(g => g.skill), ...twin.skills.map(s => s.skill)]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Learning Hub</h2>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
            Show resources outside my gaps
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Resource type">
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => setType(t)}
              className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize',
                type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300')}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>

        {filtered.length ? filtered.map((r, i) => {
          const taskTitle = `${r.resource.type === 'practice' ? 'Practice' : 'Study'}: ${r.resource.title}`;
          return (
            <Card key={r.resource.id} className={clsx(r.completed && 'opacity-70')}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {i < 3 && !r.completed && <Badge tone="indigo">Top priority</Badge>}
                    <Badge>{r.resource.type}</Badge>
                    <Badge tone={r.resource.difficulty === 'advanced' ? 'red' : r.resource.difficulty === 'intermediate' ? 'amber' : 'emerald'}>{r.resource.difficulty}</Badge>
                    {r.completed && <Badge tone="emerald"><Check className="w-3 h-3" />Completed</Badge>}
                  </div>
                  <a href={r.resource.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-900 hover:text-indigo-700 inline-flex items-center gap-1">
                    {r.resource.title}<ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-xs text-slate-700"><strong>Why:</strong> {r.reason}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />~{r.resource.estMinutes >= 120 ? `${Math.round(r.resource.estMinutes / 60)} h` : `${r.resource.estMinutes} min`}</span>
                    <span>Skill: {r.relatedSkill}</span>
                    {r.relatedMilestone && <span>Roadmap: {r.relatedMilestone}</span>}
                    <span>{r.resource.provider}</span>
                  </div>
                </div>
                {!r.completed && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button size="sm" variant="outline" disabled={planned.has(taskTitle)} onClick={() => startResource(r.resource.id)} leftIcon={<Play className="w-3 h-3" />}>
                      {planned.has(taskTitle) ? 'Planned' : 'Add to today'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => completeResource(r.resource.id)} leftIcon={<Check className="w-3 h-3" />}>Mark done</Button>
                  </div>
                )}
              </div>
            </Card>
          );
        }) : (
          <EmptyState icon={<BookOpen className="w-6 h-6" />} title="No matching resources" body="Try another type or include resources outside your gaps." />
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader icon={<NotebookPen className="w-4 h-4" />} title="Log a study session" subtitle="Counts toward learning hours & consistency" />
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              const minutes = Math.round(Number(log.minutes));
              if (!log.skill.trim()) return setLogError('Choose what you studied.');
              if (!minutes || minutes < 5 || minutes > 600) return setLogError('Enter between 5 and 600 minutes.');
              logLearning(log.skill.trim(), minutes, log.note.trim());
              setLog({ ...log, note: '' });
              setLogError('');
            }}
          >
            <Field label="Skill">
              <input className={inputClass} list="careeros-skills" value={log.skill} onChange={e => setLog({ ...log, skill: e.target.value })} />
              <datalist id="careeros-skills">{skills.map(s => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Minutes"><input type="number" min={5} max={600} className={inputClass} value={log.minutes} onChange={e => setLog({ ...log, minutes: Number(e.target.value) })} /></Field>
            <Field label="Note (optional)"><input className={inputClass} value={log.note} onChange={e => setLog({ ...log, note: e.target.value })} placeholder="What did you cover?" /></Field>
            {logError && <p className="text-xs text-red-600">{logError}</p>}
            <Button type="submit" size="sm" className="w-full">Log session</Button>
          </form>
        </Card>

        <Card>
          <CardHeader icon={<BookOpen className="w-4 h-4" />} title="Recent learning" subtitle={`${twin.learning.hours7} h this week · ${twin.learning.hoursTotal} h total`} />
          {state.learningLog.length ? (
            <ul className="space-y-2">
              {[...state.learningLog].reverse().slice(0, 8).map(l => (
                <li key={l.id} className="text-xs flex justify-between gap-2">
                  <span className="text-slate-700 truncate">{l.note || l.skill}</span>
                  <span className="text-slate-500 shrink-0 tabular-nums">{l.minutes} min · {formatDate(l.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No sessions logged yet." />
          )}
        </Card>
      </div>
    </div>
  );
};
