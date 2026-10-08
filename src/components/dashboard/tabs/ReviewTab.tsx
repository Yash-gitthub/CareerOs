import React, { useState } from 'react';
import { CalendarRange, Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ReadinessKey, WeeklyReview } from '../../../engine/types';
import { useCareer } from '../../../store/CareerStore';
import { addDays, formatDate, today as todayISO, weekStart } from '../../../engine/dates';
import { READINESS_LABELS } from '../../../engine/careerReadiness';
import { DSA_TOPICS } from '../../../engine/roleRequirements';
import { weekNumber } from '../../../engine/taskGeneration';
import { Button } from '../../common/Button';
import { Badge, Card, CardHeader, EmptyState, StatTile } from '../ui';

const ReviewCard: React.FC<{ review: WeeklyReview }> = ({ review }) => {
  const { state } = useCareer();
  const m = review.metrics;
  const deltas = Object.entries(m.componentDeltas) as [ReadinessKey, number][];
  const isCurrentWeek = review.weekStart === weekStart(todayISO());

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Week {weekNumber(state, review.weekStart)} · {formatDate(review.weekStart)} – {formatDate(addDays(review.weekStart, 6))}</h3>
          <p className="text-[11px] text-slate-500">Generated {new Date(review.createdAt).toLocaleString()}</p>
        </div>
        {isCurrentWeek && <Badge tone="amber">Week in progress</Badge>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile label="Tasks completed" value={`${Math.round(m.completionRate)}%`} sub={`${m.tasksCompleted}/${m.tasksPlanned} · ${m.tasksSkipped} skipped · ${m.tasksMissed} missed`} />
        <StatTile label="DSA problems" value={m.dsaProblems} />
        <StatTile label="Learning" value={`${Math.round((m.learningMinutes / 60) * 10) / 10} h`} />
        <StatTile label="Consistency" value={m.consistency === null ? '—' : `${Math.round(m.consistency)}%`} />
      </div>

      {deltas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-700 mb-1.5">Readiness change {m.readinessStart !== null && m.readinessEnd !== null && <span className="font-normal text-slate-500">({Math.round(m.readinessStart)}% → {Math.round(m.readinessEnd)}%)</span>}</p>
          <div className="flex flex-wrap gap-1.5">
            {deltas.sort((a, b) => b[1] - a[1]).map(([k, d]) => (
              <Badge key={k} tone={d > 0 ? 'emerald' : 'red'}>{d > 0 ? '+' : ''}{d} pts {READINESS_LABELS[k]}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />Strongest area</p>
          <p className="text-sm font-semibold text-slate-900">{review.strongestArea}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Needs attention</p>
          <p className="text-sm font-semibold text-slate-900">{review.needsAttention}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
        <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Career Twin recommendation</p>
        <ul className="text-xs text-slate-200 space-y-1 list-disc pl-4">{review.recommendations.map(r => <li key={r}>{r}</li>)}</ul>
        <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 space-y-0.5">
          <p className="font-semibold text-white flex items-center gap-1"><ArrowRight className="w-3 h-3" />Next week's plan (applied automatically)</p>
          <p>Workload: {Math.round(review.nextWeek.multiplier * 100)}% of your daily study time</p>
          {review.nextWeek.focusSkills.length > 0 && <p>Focus skill: {review.nextWeek.focusSkills.join(', ')}</p>}
          {review.nextWeek.focusTopics.length > 0 && <p>DSA focus: {review.nextWeek.focusTopics.map(k => DSA_TOPICS.find(t => t.key === k)?.label || k).join(', ')}</p>}
        </div>
      </div>
    </Card>
  );
};

export const ReviewTab: React.FC = () => {
  const { state, generateReviewNow } = useCareer();
  const [busy, setBusy] = useState(false);
  const reviews = [...state.weeklyReviews].reverse();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          icon={<CalendarRange className="w-4 h-4" />}
          title="Weekly AI Career Review"
          subtitle="Generated automatically every Monday for the previous week. Its plan adapts next week's tasks."
          action={
            <Button
              size="sm"
              isLoading={busy}
              onClick={() => {
                setBusy(true);
                // Let the loading state paint before the synchronous analysis runs.
                window.setTimeout(() => { generateReviewNow(); setBusy(false); }, 50);
              }}
            >
              Review this week so far
            </Button>
          }
        />
        {busy && <p className="text-xs text-indigo-600">Generating weekly review…</p>}
        <p className="text-xs text-slate-500">
          Current plan: {Math.round(state.workloadMultiplier * 100)}% workload
          {state.focusSkills.length ? ` · focus on ${state.focusSkills.join(', ')}` : ''}
          {state.focusTopics.length ? ` · DSA focus ${state.focusTopics.map(k => DSA_TOPICS.find(t => t.key === k)?.label || k).join(', ')}` : ''}
        </p>
      </Card>

      {reviews.length
        ? reviews.map(r => <ReviewCard key={r.id} review={r} />)
        : <EmptyState title="No reviews yet" body="Your first review is created automatically after your first planned week, or generate one now for this week so far." />}
    </div>
  );
};
