import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Table2 } from 'lucide-react';
import { useCareer } from '../../../store/CareerStore';
import { addDays, daysBetween, formatDate, today as todayISO, weekStart, round1, localDate } from '../../../engine/dates';
import { anyActiveDates, codingActiveDates, plannedTasksIn, projectProgress } from '../../../engine/careerReadiness';
import { BarChart, HBarList, LineChart } from '../../charts/Charts';
import { Card, CardHeader, EmptyState, Field, TextButton, inputClass } from '../ui';

interface WeekRow {
  week: string;
  label: string;
  planned: number;
  completed: number;
  completion: number | null;
  learningHours: number;
  codingDays: number;
  consistency: number | null;
}

export const AnalyticsTab: React.FC = () => {
  const { state, twin } = useCareer();
  const [showTable, setShowTable] = useState(false);
  const roleSkills = Object.keys(state.readinessHistory[state.readinessHistory.length - 1]?.skills || {});
  const [skill, setSkill] = useState(roleSkills[0] || '');

  const weeks = useMemo<WeekRow[]>(() => {
    const today = todayISO();
    const current = weekStart(today);
    const coding = codingActiveDates(state);
    const active = anyActiveDates(state);
    return Array.from({ length: 8 }, (_, i) => addDays(current, -7 * (7 - i))).map(week => {
      const end = addDays(week, 6);
      const planned = plannedTasksIn(state, week, end, today);
      const completed = planned.filter(t => t.status === 'completed').length;
      const learning = planned.filter(t => t.category === 'learning');
      const learningDone = learning.filter(t => t.status === 'completed').length;
      const learningMinutes =
        state.tasks.filter(t => t.status === 'completed' && t.category === 'learning' && localDate(t.completedAt || '') >= week && localDate(t.completedAt || '') <= end)
          .reduce((s, t) => s + t.estMinutes, 0) +
        state.learningLog.filter(l => l.date >= week && l.date <= end).reduce((s, l) => s + l.minutes, 0);
      let codingDays = 0;
      let activeDays = 0;
      const daysElapsed = Math.min(7, Math.max(0, daysBetween(week, today) + 1));
      for (let d = 0; d < 7; d++) {
        const day = addDays(week, d);
        if (coding.has(day)) codingDays++;
        if (active.has(day)) activeDays++;
      }
      const cr = planned.length ? completed / planned.length : null;
      const consistency = cr === null
        ? null
        : round1(100 * (0.6 * cr + 0.25 * (activeDays / Math.max(1, daysElapsed)) + 0.15 * (learning.length ? learningDone / learning.length : cr)));
      return {
        week,
        label: formatDate(week),
        planned: planned.length,
        completed,
        completion: cr === null ? null : Math.round(cr * 100),
        learningHours: round1(learningMinutes / 60),
        codingDays,
        consistency,
      };
    });
  }, [state]);

  const history = state.readinessHistory;
  // Label by time of day when all history falls on one day, otherwise by date.
  const singleDay = new Set(history.map(h => localDate(h.createdAt))).size <= 1;
  const readinessPoints = history.map(h => ({
    label: singleDay
      ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : formatDate(localDate(h.createdAt)),
    value: h.score,
    tooltip: `${new Date(h.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}: ${h.score}% — ${h.reason}`,
  }));
  const skillPoints = history.filter(h => skill in h.skills).map(h => ({
    label: formatDate(localDate(h.createdAt)),
    value: h.skills[skill],
    tooltip: `${formatDate(localDate(h.createdAt))}: ${skill} ${h.skills[skill]}/100`,
  }));
  const hasWeekData = weeks.some(w => w.planned > 0 || w.learningHours > 0 || w.codingDays > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Progress analytics</h2>
        <TextButton onClick={() => setShowTable(s => !s)}><Table2 className="w-3.5 h-3.5" />{showTable ? 'Show charts' : 'Show as table'}</TextButton>
      </div>

      {showTable ? (
        <Card>
          <CardHeader icon={<Table2 className="w-4 h-4" />} title="Weekly metrics" subtitle="Last 8 weeks" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Week of</th>
                  <th className="py-2 pr-3 font-semibold text-right">Tasks</th>
                  <th className="py-2 pr-3 font-semibold text-right">Completion</th>
                  <th className="py-2 pr-3 font-semibold text-right">Learning (h)</th>
                  <th className="py-2 pr-3 font-semibold text-right">Coding days</th>
                  <th className="py-2 font-semibold text-right">Consistency</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map(w => (
                  <tr key={w.week} className="border-b border-slate-100 tabular-nums">
                    <td className="py-2 pr-3 text-slate-800">{w.label}</td>
                    <td className="py-2 pr-3 text-right">{w.completed}/{w.planned}</td>
                    <td className="py-2 pr-3 text-right">{w.completion === null ? '—' : `${w.completion}%`}</td>
                    <td className="py-2 pr-3 text-right">{w.learningHours}</td>
                    <td className="py-2 pr-3 text-right">{w.codingDays}</td>
                    <td className="py-2 text-right">{w.consistency === null ? '—' : `${Math.round(w.consistency)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Readiness update</th>
                  <th className="py-2 pr-3 font-semibold text-right">Score</th>
                  <th className="py-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 20).map(h => (
                  <tr key={h.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-800 whitespace-nowrap">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{h.score}%</td>
                    <td className="py-2 text-slate-600">{h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader icon={<TrendingUp className="w-4 h-4" />} title="Career readiness over time" subtitle="Every point is a stored Twin update — hover to see what caused it" />
            {readinessPoints.length >= 2
              ? <LineChart points={readinessPoints} yMax={100} unit="%" ariaLabel="Career readiness over time" />
              : <EmptyState title="Readiness history starts with your next activity." body="Complete tasks, take the assessment or sync GitHub/LeetCode to add data points." />}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Readiness components" subtitle="Current value of each component (0–100)" />
              <HBarList rows={twin.readiness.components.map(c => ({ label: c.label, value: c.value === null ? null : Math.round(c.value) }))} />
            </Card>

            <Card>
              <CardHeader
                icon={<TrendingUp className="w-4 h-4" />}
                title="Skill growth"
                action={roleSkills.length > 0 ? (
                  <Field label="" className="w-40">
                    <select className={inputClass} value={skill} onChange={e => setSkill(e.target.value)} aria-label="Skill">
                      {roleSkills.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                ) : undefined}
              />
              {skillPoints.length >= 2
                ? <LineChart points={skillPoints} yMax={100} ariaLabel={`${skill} skill score over time`} />
                : <EmptyState title="Not enough history for this skill yet." />}
            </Card>
          </div>

          {hasWeekData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Task completion" subtitle="% of planned tasks completed per week" />
                <BarChart points={weeks.map(w => ({ label: w.label, value: w.completion, tooltip: `Week of ${w.label}: ${w.completed}/${w.planned} tasks` }))} yMax={100} unit="%" ariaLabel="Weekly task completion" />
              </Card>
              <Card>
                <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Learning hours" subtitle="Per week" />
                <BarChart points={weeks.map(w => ({ label: w.label, value: w.learningHours, tooltip: `Week of ${w.label}: ${w.learningHours} h` }))} unit="h" ariaLabel="Weekly learning hours" />
              </Card>
              <Card>
                <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Coding activity" subtitle="Days with GitHub, LeetCode or coding tasks" />
                <BarChart points={weeks.map(w => ({ label: w.label, value: w.codingDays, tooltip: `Week of ${w.label}: ${w.codingDays} coding days` }))} yMax={7} ariaLabel="Weekly coding days" />
              </Card>
              <Card>
                <CardHeader icon={<TrendingUp className="w-4 h-4" />} title="Consistency" subtitle="Weekly consistency score" />
                <LineChart points={weeks.map(w => ({ label: w.label, value: w.consistency === null ? null : Math.round(w.consistency) }))} yMax={100} unit="%" ariaLabel="Weekly consistency" />
              </Card>
            </div>
          ) : (
            <EmptyState title="Weekly charts appear after your first planned day." />
          )}

          <Card>
            <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Project progress" />
            {state.projects.length
              ? <HBarList rows={state.projects.map(p => ({ label: p.title, value: projectProgress(p), suffix: '%' }))} />
              : <EmptyState title="No projects tracked yet." />}
          </Card>
        </>
      )}
    </div>
  );
};
