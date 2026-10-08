import React from 'react';
import { Code2, Flame, Target, AlertTriangle, Sparkles, GitBranch } from 'lucide-react';
import { useCareer } from '../../../store/CareerStore';
import { formatDate, today as todayISO, weekStart } from '../../../engine/dates';
import { weeklyGoalProgress } from '../../../engine/taskGeneration';
import { Button } from '../../common/Button';
import { HBarList, LineChart } from '../../charts/Charts';
import { Card, CardHeader, EmptyState, Meter, StatTile } from '../ui';
import { GitHubCard, LeetCodeCard, RecentRepos } from '../integrations/IntegrationCards';

export const CodingTab: React.FC = () => {
  const { state, twin, generateDsaTasksForWeakTopics, addProject } = useCareer();
  const lc = state.leetcode.snapshot;
  const week = weekStart(todayISO());
  const dsaGoal = weeklyGoalProgress(state, week, state.weeklyGoals[week] || {}).find(g => g.category === 'dsa');
  const measured = twin.coding.topics.filter(t => t.score !== null);
  const priority = [...measured].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 2);
  const totalForDiff = lc ? Math.max(1, lc.easy + lc.medium + lc.hard) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total solved" value={lc ? lc.total : '—'} sub={lc ? (lc.source === 'manual' ? 'Self-reported' : 'LeetCode') : 'Connect LeetCode'} />
        <StatTile label="Current streak" value={<span className="inline-flex items-center gap-1"><Flame className="w-5 h-5 text-amber-500" />{twin.coding.streak}</span>} sub="days with coding activity" />
        <StatTile label="Weekly target" value={dsaGoal ? `${dsaGoal.actual}/${dsaGoal.target}` : '—'} sub="DSA problems this week" />
        <StatTile label="DSA score" value={twin.coding.dsaScore === null ? '—' : Math.round(twin.coding.dsaScore)} sub="assessment + practice" />
      </div>

      {priority.length > 0 && (priority[0].score || 0) < 50 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">Priority skill gap: {priority.map(p => p.label).join(' + ')}</p>
              <p className="text-xs text-slate-700">{priority.map(p => `${p.label} ${Math.round(p.score || 0)}%`).join(' · ')} — your daily DSA tasks focus here first.</p>
            </div>
          </div>
          <Button size="sm" onClick={generateDsaTasksForWeakTopics} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>Plan practice for weak topics</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader icon={<Target className="w-4 h-4" />} title="Topic performance" subtitle="LeetCode tag coverage + completed practice + assessment" />
          <HBarList rows={twin.coding.topics.map(t => ({
            label: t.label,
            value: t.score,
            highlight: priority.some(p => p.key === t.key),
          }))} />
          <p className="text-[10px] text-slate-500 mt-3">— means not measured yet. Coverage target per topic is set for entry-level interviews (e.g. 25 DP problems = 100%).</p>
        </Card>

        <Card>
          <CardHeader icon={<Code2 className="w-4 h-4" />} title="Difficulty mix" />
          {lc ? (
            <div className="space-y-3">
              {([['Easy', lc.easy, 'emerald'], ['Medium', lc.medium, 'amber'], ['Hard', lc.hard, 'red']] as const).map(([label, n, tone]) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-slate-700">{label}</span><span className="tabular-nums font-semibold text-slate-900">{n}</span></div>
                  <Meter value={n} max={totalForDiff} tone={tone} label={`${label} problems`} />
                </div>
              ))}
              {lc.contestRating !== null && <p className="text-xs text-slate-600 pt-1">Contest rating: <strong>{lc.contestRating}</strong></p>}
            </div>
          ) : (
            <EmptyState title="Connect LeetCode to see your difficulty mix." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader icon={<Code2 className="w-4 h-4" />} title="Coding progress" subtitle="Total solved at each sync" />
        {state.leetcodeHistory.length >= 2 ? (
          <LineChart
            ariaLabel="LeetCode problems solved over time"
            points={state.leetcodeHistory.map(h => ({ label: formatDate(h.date), value: h.total, tooltip: `${formatDate(h.date)}: ${h.total} solved` }))}
          />
        ) : (
          <EmptyState title="Sync LeetCode on different days to see your trend." body="Each sync stores a data point." />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeetCodeCard />
        <GitHubCard />
      </div>

      {state.github.snapshot && (
        <Card>
          <CardHeader icon={<GitBranch className="w-4 h-4" />} title="Recent repositories" subtitle="Track a repo as a project to include it in project progress" />
          <RecentRepos
            limit={8}
            onTrack={r => addProject({
              title: r.name,
              description: r.description,
              techStack: r.language ? [r.language] : [],
              repoUrl: r.url,
              deployUrl: r.homepage || '',
              stage: r.homepage ? 'deployment' : 'development',
            })}
          />
        </Card>
      )}
    </div>
  );
};
