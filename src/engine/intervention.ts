import type { UserProfile } from '../types/user';
import type { CareerState, Intervention, Task } from './types';
import type { CareerTwin } from './careerTwin';
import { activeWeek } from './roadmap';
import { addDays, daysBetween, today as todayISO, uid, localDate } from './dates';
import { DSA_TOPICS, STUDY_MINUTES } from './roleRequirements';
import { latestAssessment } from './skillGap';
import { activeProject, dailyBudgetMinutes, newTask } from './taskGeneration';

const COOLDOWN_DAYS = 4;

const formatMinutes = (m: number) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} hours` : `${m} minutes`);

// A rule fires only if no open intervention of that rule exists and its cooldown has passed.
const canFire = (state: CareerState, rule: Intervention['rule'], today: string) =>
  !state.interventions.some(i =>
    i.rule === rule &&
    (i.status === 'open' || daysBetween(localDate(i.resolvedAt || i.createdAt), today) < COOLDOWN_DAYS)
  );

export const detectInterventions = (profile: UserProfile, state: CareerState, twin: CareerTwin, now: Date = new Date()): Intervention[] => {
  const today = todayISO(now);
  const found: Intervention[] = [];
  const make = (i: Omit<Intervention, 'id' | 'status' | 'createdAt'>) =>
    found.push({ ...i, id: uid('int'), status: 'open', createdAt: now.toISOString() });
  const c7 = twin.behavioral.consistency7;
  const topGap = twin.gaps.find(g => g.bucket === 'critical') || twin.gaps[0];
  const accountAgeDays = daysBetween(localDate(state.createdAt), today);

  // Repeatedly missed tasks → reduce workload.
  if (canFire(state, 'overload', today) && c7.planned >= 5 && c7.completed / c7.planned < 0.5) {
    const current = dailyBudgetMinutes(profile, state);
    const multiplier = Math.max(0.5, Math.round(state.workloadMultiplier * 0.6 * 100) / 100);
    const next = Math.round((STUDY_MINUTES[profile.learningPreferences.dailyStudyTime] ?? 90) * multiplier);
    make({
      rule: 'overload',
      severity: 'high',
      title: 'Workload is too high right now',
      message: `You completed only ${Math.round((c7.completed / c7.planned) * 100)}% of your planned tasks this week (${c7.completed}/${c7.planned}).`,
      recommendation: `Reduce daily workload from ${formatMinutes(current)} to ${formatMinutes(next)} and focus on your highest-priority gap${topGap ? `: ${topGap.skill}` : ''}.`,
      change: { kind: 'workload', multiplier },
    });
  }

  // Weak assessment area → recovery plan.
  const assessment = latestAssessment(state);
  if (canFire(state, 'weak_area', today) && assessment) {
    const weakTopic = twin.coding.topics.find(t => t.score !== null && t.score < 25);
    const weakSection = (['core_cs', 'programming', 'domain'] as const).find(s => assessment.sectionScores[s] < 40);
    if (weakTopic) {
      make({
        rule: 'weak_area',
        severity: 'medium',
        title: `Weakness detected in ${weakTopic.label}`,
        message: `Your recent performance shows a weakness in ${weakTopic.label} (score ${Math.round(weakTopic.score || 0)}/100).`,
        recommendation: `Accept a 3-day recovery plan: one focused ${weakTopic.label} session per day.`,
        change: { kind: 'recovery', skill: 'DSA', topic: weakTopic.key },
      });
    } else if (weakSection) {
      const skill = weakSection === 'core_cs' ? (twin.gaps.find(g => ['OOP', 'DBMS', 'Operating Systems', 'Computer Networks'].includes(g.skill))?.skill || 'Core CS')
        : weakSection === 'programming' ? 'Programming fundamentals' : (topGap?.skill || 'Domain skills');
      make({
        rule: 'weak_area',
        severity: 'medium',
        title: `Weakness detected in ${skill}`,
        message: `Your assessment score in this area was ${Math.round(assessment.sectionScores[weakSection])}%.`,
        recommendation: `Accept a 3-day recovery plan focused on ${skill}.`,
        change: { kind: 'recovery', skill },
      });
    }
  }

  // Low coding activity → DSA boost.
  if (canFire(state, 'low_coding', today) && accountAgeDays >= 7 && twin.coding.activeDays7 < 2) {
    const topic = twin.coding.weakAreas[0]?.key || 'arrays';
    make({
      rule: 'low_coding',
      severity: 'medium',
      title: 'Coding activity is low',
      message: `You coded on only ${twin.coding.activeDays7} of the last 7 days.`,
      recommendation: 'Add a short 20-minute DSA task every day for the next 5 days and turn on DSA reminders.',
      change: { kind: 'dsa_boost', topic },
    });
  }

  // Project inactive → milestone task.
  const project = activeProject(state);
  if (canFire(state, 'project_stale', today) && project && daysBetween(localDate(project.updatedAt), today) >= 10) {
    make({
      rule: 'project_stale',
      severity: 'low',
      title: `"${project.title}" hasn't moved in ${daysBetween(localDate(project.updatedAt), today)} days`,
      message: 'You haven\'t updated your project recently.',
      recommendation: 'Create a small milestone task for today to restart momentum.',
      change: { kind: 'project_task', projectId: project.id },
    });
  }

  // Completing everything easily → raise difficulty / advance roadmap.
  const c14Planned = state.tasks.filter(t => t.dueDate >= addDays(today, -13) && t.dueDate < today);
  const c14Rate = c14Planned.length ? c14Planned.filter(t => t.status === 'completed').length / c14Planned.length : 0;
  if (canFire(state, 'accelerating', today) && c14Planned.length >= 10 && c14Rate > 0.9 && state.workloadMultiplier < 1.5) {
    make({
      rule: 'accelerating',
      severity: 'low',
      title: 'You\'re ahead of pace',
      message: `You completed ${Math.round(c14Rate * 100)}% of tasks over the last two weeks.`,
      recommendation: 'Increase difficulty: more problems per day and a 20% larger daily plan.',
      change: { kind: 'workload', multiplier: Math.min(1.5, Math.round(state.workloadMultiplier * 1.2 * 100) / 100) },
    });
  }

  const current = activeWeek(state.roadmap);
  if (current && canFire(state, 'ahead', today) && addDays(current.week.startDate, 6) > today) {
    const weekTasks = state.tasks.filter(t => t.weekId === current.week.id);
    const doneTopics = weekTasks.filter(t => t.status === 'completed').length;
    if (weekTasks.length >= current.week.topics.length && doneTopics >= current.week.topics.length + 1) {
      make({
        rule: 'ahead',
        severity: 'low',
        title: `"${current.week.title}" looks done early`,
        message: `You've completed ${doneTopics} sessions for this roadmap week before it ends.`,
        recommendation: 'Mark this week complete and pull the next roadmap week forward.',
        change: { kind: 'advance_week', weekId: current.week.id },
      });
    }
  }

  return found;
};

// Tasks created when an intervention is accepted.
export const interventionTasks = (state: CareerState, intervention: Intervention, today: string): Task[] => {
  const change = intervention.change;
  if (change.kind === 'recovery') {
    const topic = change.topic ? DSA_TOPICS.find(t => t.key === change.topic) : undefined;
    return [0, 1, 2].map(i => newTask({
      title: topic ? `Recovery: ${topic.label} — session ${i + 1} of 3` : `Recovery: ${change.skill} — session ${i + 1} of 3`,
      description: topic
        ? `Review the core pattern, then solve 2 ${topic.label} problems (https://leetcode.com/tag/${topic.lcSlug}/).`
        : `Revisit the fundamentals of ${change.skill} and summarise them in your own words.`,
      category: topic ? 'dsa' : 'learning',
      priority: 'high',
      estMinutes: 40,
      dueDate: addDays(today, i),
      source: 'intervention',
      skill: change.skill,
      topic: topic?.key,
      problems: topic ? 2 : undefined,
    }));
  }
  if (change.kind === 'dsa_boost') {
    const topic = DSA_TOPICS.find(t => t.key === change.topic) || DSA_TOPICS[0];
    return [0, 1, 2, 3, 4].map(i => newTask({
      title: `Quick DSA: 1 ${topic.label} problem`,
      description: `20 focused minutes. https://leetcode.com/tag/${topic.lcSlug}/`,
      category: 'dsa',
      priority: 'medium',
      estMinutes: 20,
      dueDate: addDays(today, i),
      source: 'intervention',
      skill: 'DSA',
      topic: topic.key,
      problems: 1,
    }));
  }
  if (change.kind === 'project_task') {
    const project = state.projects.find(p => p.id === change.projectId);
    if (!project) return [];
    const next = project.milestones.find(m => !m.completedAt);
    return [newTask({
      title: `Restart ${project.title}: ${next ? next.title : 'define the next milestone'}`,
      description: 'Small, concrete step — 30 minutes is enough to rebuild momentum.',
      category: 'project',
      priority: 'high',
      estMinutes: 30,
      dueDate: today,
      source: 'intervention',
      projectId: project.id,
      projectMilestoneId: next?.id,
    })];
  }
  return [];
};
