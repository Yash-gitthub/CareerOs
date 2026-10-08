import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Map as MapIcon, RefreshCw, ChevronUp, ChevronDown, Check, SkipForward, CalendarClock, Flag, SlidersHorizontal } from 'lucide-react';
import { useCareer } from '../../../store/CareerStore';
import { useOnboarding } from '../../../context/OnboardingContext';
import { addDays, formatDate, today as todayISO } from '../../../engine/dates';
import { STUDY_TIME_OPTIONS, TARGET_TIMELINES } from '../../../data/rolesData';
import type { RoadmapItemStatus } from '../../../engine/types';
import { Button } from '../../common/Button';
import { Badge, Card, CardHeader, EmptyState, Field, Meter, TextButton, inputClass } from '../ui';

const STATUS_TONE: Record<RoadmapItemStatus, 'slate' | 'indigo' | 'emerald' | 'amber'> = {
  pending: 'slate', active: 'indigo', completed: 'emerald', skipped: 'amber',
};

export const RoadmapTab: React.FC<{ onStartAssessment: () => void }> = ({ onStartAssessment }) => {
  const { state, regenerateRoadmap, completeWeek, skipWeek, rescheduleWeek, skipMilestone, moveMilestone, generateTodayTasks } = useCareer();
  const { user } = useOnboarding();
  const roadmap = state.roadmap;
  const today = todayISO();
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [params, setParams] = useState({
    timeline: roadmap?.params.timeline || user.career.timeline,
    dailyStudyTime: roadmap?.params.dailyStudyTime || user.learningPreferences.dailyStudyTime,
  });

  if (!roadmap) {
    return (
      <Card>
        <CardHeader icon={<MapIcon className="w-4 h-4" />} title="Personalized Roadmap" />
        <EmptyState
          title="No roadmap yet"
          body="Your roadmap is generated from your skill gaps, target role, dream company, timeline and daily study time. The assessment makes it far more accurate."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={onStartAssessment}>Take assessment</Button>
              <Button size="sm" variant="outline" onClick={generateTodayTasks}>Generate from profile</Button>
            </div>
          }
        />
      </Card>
    );
  }

  const weeks = roadmap.milestones.flatMap(m => m.weeks);
  const done = weeks.filter(w => w.status === 'completed').length;
  const end = weeks.length ? addDays(weeks[weeks.length - 1].startDate, 6) : today;

  // Group milestones into calendar months for the "monthly goals" view.
  const months: { [key: string]: string[] } = {};
  roadmap.milestones.forEach(m => m.weeks.forEach(w => {
    const key = formatDate(w.startDate, { month: 'long', year: 'numeric' });
    months[key] = months[key] || [];
    if (!months[key].includes(m.title)) months[key].push(m.title);
  }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Flag className="w-3.5 h-3.5 text-indigo-600" />Career goal</div>
            <h2 className="text-lg font-bold text-slate-900">Become a {roadmap.targetRole}{roadmap.dreamCompany ? ` · ${roadmap.dreamCompany}` : ''}</h2>
            <p className="text-xs text-slate-500">
              {roadmap.milestones.length} milestones · {weeks.length} weeks · ends {formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' })} · pace: {roadmap.params.dailyStudyTime}/day, {roadmap.params.timeline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAdjusting(a => !a)} leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>Adjust</Button>
            {confirmRegen ? (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-900 px-1">Rebuild from current gaps? Completed history is kept.</span>
                <Button size="sm" onClick={() => { regenerateRoadmap(); setConfirmRegen(false); }}>Regenerate</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmRegen(false)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmRegen(true)} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Regenerate</Button>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-600"><span>Progress</span><span className="tabular-nums">{done}/{weeks.length} weeks</span></div>
          <Meter value={done} max={Math.max(1, weeks.length)} label="Roadmap progress" />
        </div>
        {adjusting && (
          <form
            className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
            onSubmit={e => { e.preventDefault(); regenerateRoadmap(params); setAdjusting(false); }}
          >
            <Field label="Timeline">
              <select className={inputClass} value={params.timeline} onChange={e => setParams({ ...params, timeline: e.target.value })}>
                {TARGET_TIMELINES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Daily study time">
              <select className={inputClass} value={params.dailyStudyTime} onChange={e => setParams({ ...params, dailyStudyTime: e.target.value })}>
                {STUDY_TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">Apply & rebuild</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdjusting(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <CardHeader icon={<CalendarClock className="w-4 h-4" />} title="Monthly goals" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(months).map(([month, titles]) => (
            <div key={month} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="text-xs font-bold text-slate-900">{month}</p>
              <ul className="mt-1 space-y-0.5">{titles.map(t => <li key={t} className="text-[11px] text-slate-600">• {t}</li>)}</ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {roadmap.milestones.map((m, mi) => {
          const mDone = m.weeks.filter(w => w.status === 'completed').length;
          const open = m.status !== 'completed' && m.status !== 'skipped';
          return (
            <Card key={m.id} className={clsx(m.status === 'active' && 'ring-2 ring-indigo-200')}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400">Milestone {mi + 1}</span>
                    <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                    {m.skill && <Badge tone="slate">{m.skill}</Badge>}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <TextButton tone="slate" aria-label="Move milestone up" disabled={mi === 0 || !open} onClick={() => moveMilestone(m.id, -1)}><ChevronUp className="w-3.5 h-3.5" /></TextButton>
                  <TextButton tone="slate" aria-label="Move milestone down" disabled={mi === roadmap.milestones.length - 1 || !open} onClick={() => moveMilestone(m.id, 1)}><ChevronDown className="w-3.5 h-3.5" /></TextButton>
                  {open && <TextButton tone="slate" onClick={() => skipMilestone(m.id)}><SkipForward className="w-3 h-3" />Skip milestone</TextButton>}
                </div>
              </div>
              <Meter value={mDone} max={Math.max(1, m.weeks.length)} tone={m.status === 'completed' ? 'emerald' : 'indigo'} className="mb-4" label={`${m.title} progress`} />
              <ol className="space-y-2">
                {m.weeks.map(w => {
                  const behind = w.status === 'active' && addDays(w.startDate, 6) < today;
                  const weekTasks = state.tasks.filter(t => t.weekId === w.id);
                  const weekDone = weekTasks.filter(t => t.status === 'completed').length;
                  return (
                    <li key={w.id} className={clsx('p-3 rounded-xl border', w.status === 'active' ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white')}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-900">{w.title}</span>
                            <Badge tone={STATUS_TONE[w.status]}>{w.status}</Badge>
                            {behind && <Badge tone="red">Behind schedule</Badge>}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {formatDate(w.startDate)} – {formatDate(addDays(w.startDate, 6))} · {w.topics.join(' · ')}
                            {weekTasks.length > 0 && ` · ${weekDone}/${weekTasks.length} sessions done`}
                          </p>
                        </div>
                        {(w.status === 'active' || w.status === 'pending') && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <TextButton tone="emerald" onClick={() => completeWeek(w.id)}><Check className="w-3 h-3" />Complete</TextButton>
                            <TextButton tone="slate" onClick={() => skipWeek(w.id)}><SkipForward className="w-3 h-3" />Skip</TextButton>
                            <TextButton tone="slate" onClick={() => rescheduleWeek(w.id)}><CalendarClock className="w-3 h-3" />+1 week</TextButton>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
