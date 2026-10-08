import type { CareerState, ReadinessKey, WeeklyReview } from './types';
import type { CareerTwin } from './careerTwin';
import { addDays, round1, uid, localDate } from './dates';
import { READINESS_LABELS } from './careerReadiness';
import { weeklyGoalProgress } from './taskGeneration';

const CATEGORY_LABEL: Record<string, string> = {
  dsa: 'DSA', learning: 'Learning', project: 'Projects', github: 'GitHub', core_cs: 'Core CS', personal: 'Personal',
};

// Snapshot in effect at the end of a given day.
const snapshotAt = (state: CareerState, isoDate: string) =>
  [...state.readinessHistory].reverse().find(s => localDate(s.createdAt) <= isoDate);

export const generateWeeklyReview = (state: CareerState, twin: CareerTwin, week: string, now: Date = new Date()): WeeklyReview => {
  const end = addDays(week, 6);
  const tasks = state.tasks.filter(t => t.dueDate >= week && t.dueDate <= end);
  const completed = tasks.filter(t => t.status === 'completed');
  const skipped = tasks.filter(t => t.status === 'skipped');
  const missed = tasks.filter(t => t.status === 'overdue');

  const byCategory: WeeklyReview['metrics']['byCategory'] = {};
  tasks.forEach(t => {
    byCategory[t.category] = byCategory[t.category] || { planned: 0, completed: 0 };
    byCategory[t.category].planned++;
    if (t.status === 'completed') byCategory[t.category].completed++;
  });

  const learningMinutes =
    completed.filter(t => t.category === 'learning').reduce((s, t) => s + t.estMinutes, 0) +
    state.learningLog.filter(l => l.date >= week && l.date <= end).reduce((s, l) => s + l.minutes, 0);

  const goals = weeklyGoalProgress(state, week, state.weeklyGoals[week] || {});
  const dsaProblems = goals.find(g => g.category === 'dsa')?.actual ?? 0;
  const projectMilestones = goals.find(g => g.category === 'project')?.actual ?? 0;

  const startSnap = snapshotAt(state, addDays(week, -1)) || state.readinessHistory[0];
  const endSnap = snapshotAt(state, end);
  const componentDeltas: Partial<Record<ReadinessKey, number>> = {};
  if (startSnap && endSnap) {
    (Object.keys(endSnap.contributions) as ReadinessKey[]).forEach(k => {
      const d = round1((endSnap.contributions[k] || 0) - (startSnap.contributions[k] || 0));
      if (d !== 0) componentDeltas[k] = d;
    });
  }

  const completionRate = tasks.length ? completed.length / tasks.length : 0;

  // Strongest: biggest readiness gain, else best category completion.
  const gains = Object.entries(componentDeltas).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const catRates = Object.entries(byCategory)
    .filter(([, v]) => v.planned > 0)
    .map(([k, v]) => ({ k, rate: v.completed / v.planned, planned: v.planned }));
  const strongestArea = gains.length && (gains[0][1] || 0) > 0
    ? READINESS_LABELS[gains[0][0] as ReadinessKey]
    : catRates.sort((a, b) => b.rate - a.rate)[0]
      ? CATEGORY_LABEL[catRates.sort((a, b) => b.rate - a.rate)[0].k]
      : twin.strengths[0] || 'Not enough activity yet';

  const weakTopic = twin.coding.weakAreas[0];
  const weakestCat = catRates.sort((a, b) => a.rate - b.rate)[0];
  const criticalGap = twin.gaps.find(g => g.bucket === 'critical');
  const needsAttention = weakTopic
    ? weakTopic.label
    : weakestCat && weakestCat.rate < 0.6
      ? CATEGORY_LABEL[weakestCat.k]
      : criticalGap?.skill || 'Keep your current pace';

  const recommendations: string[] = [];
  let multiplier = state.workloadMultiplier;
  if (tasks.length >= 4 && completionRate < 0.6) {
    multiplier = Math.max(0.5, round1(multiplier * 0.8));
    recommendations.push(`Reduce your daily workload by 20% — you completed ${Math.round(completionRate * 100)}% of planned tasks.`);
  } else if (tasks.length >= 8 && completionRate > 0.9) {
    multiplier = Math.min(1.5, round1(multiplier * 1.1));
    recommendations.push('You finished almost everything — next week\'s plan is 10% more ambitious.');
  }
  if (weakTopic) recommendations.push(`Spend 3 sessions on ${weakTopic.label} next week.`);
  if (criticalGap) recommendations.push(`Keep ${criticalGap.skill} as the main learning focus (${Math.round(criticalGap.current)} → ${criticalGap.required}).`);
  if (state.projects.length && projectMilestones === 0) recommendations.push('Schedule two project sessions — no project milestone was completed this week.');
  if (!state.projects.length) recommendations.push('Adopt a recommended project to start building portfolio evidence.');
  if (missed.length >= 3) recommendations.push(`Review your schedule: ${missed.length} tasks went overdue.`);
  if (!recommendations.length) recommendations.push('Solid week — keep the same plan.');

  return {
    id: uid('rev'),
    weekStart: week,
    createdAt: now.toISOString(),
    metrics: {
      tasksPlanned: tasks.length,
      tasksCompleted: completed.length,
      tasksSkipped: skipped.length,
      tasksMissed: missed.length,
      completionRate: round1(completionRate * 100),
      byCategory,
      learningMinutes,
      dsaProblems,
      projectMilestones,
      consistency: twin.behavioral.consistency7.score,
      readinessStart: startSnap ? startSnap.score : null,
      readinessEnd: endSnap ? endSnap.score : null,
      componentDeltas,
    },
    strongestArea,
    needsAttention,
    recommendations,
    nextWeek: {
      multiplier,
      focusSkills: criticalGap ? [criticalGap.skill] : [],
      focusTopics: weakTopic ? [weakTopic.key] : [],
    },
  };
};
