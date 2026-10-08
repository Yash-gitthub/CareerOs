import type { UserProfile } from '../types/user';
import type { CareerState, Task, Priority, WeeklyGoalCategory, Project } from './types';
import type { CareerTwin } from './careerTwin';
import { activeWeek } from './roadmap';
import { addDays, daysBetween, fromISODate, uid, weekStart, localDate } from './dates';
import { DSA_TOPICS, STUDY_MINUTES } from './roleRequirements';
import { weakDsaTopics } from './skillGap';

export const dailyBudgetMinutes = (profile: UserProfile, state: CareerState): number =>
  Math.round((STUDY_MINUTES[profile.learningPreferences.dailyStudyTime] ?? 90) * state.workloadMultiplier);

export const activeProject = (state: CareerState): Project | null =>
  [...state.projects]
    .filter(p => p.stage !== 'completed')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;

type Draft = Omit<Task, 'id' | 'status' | 'createdAt' | 'dueDate'> & { order: number };

export const newTask = (fields: Partial<Task> & Pick<Task, 'title' | 'category' | 'dueDate'>): Task => ({
  id: uid('task'),
  description: '',
  priority: 'medium',
  estMinutes: 30,
  status: 'pending',
  source: 'personal',
  createdAt: new Date().toISOString(),
  ...fields,
});

const dsaTopicByLabel = (label: string) => DSA_TOPICS.find(t => t.label === label);

// Builds today's plan from the roadmap, weak areas, active project and focus skills.
// Deterministic and idempotent: each slot gets a genKey of `${date}:${slot}`.
export const generateDailyTasks = (
  profile: UserProfile,
  state: CareerState,
  twin: CareerTwin,
  date: string
): Task[] => {
  const existingKeys = new Set(state.tasks.map(t => t.genKey).filter(Boolean));
  if ([...existingKeys].some(k => k?.startsWith(`${date}:`))) return [];

  const budget = dailyBudgetMinutes(profile, state);
  const dayIndex = fromISODate(date).getDay();
  const current = activeWeek(state.roadmap);
  const drafts: Draft[] = [];
  const highGap = (skill: string): Priority => {
    const g = twin.gaps.find(x => x.skill === skill);
    return g?.bucket === 'critical' ? 'high' : g?.bucket === 'developing' ? 'medium' : 'low';
  };

  // 1. DSA practice on the weakest topic (or the current DSA roadmap topic / focus topic).
  const weekDsaTopic = current?.milestone.skill === 'DSA' ? current.week.topics.map(dsaTopicByLabel).find(Boolean) : undefined;
  const focusTopic = state.focusTopics.map(k => DSA_TOPICS.find(t => t.key === k)).find(Boolean);
  const weakest = weakDsaTopics(twin.coding.topics, 3);
  const rotatingWeak = weakest.length ? DSA_TOPICS.find(t => t.key === weakest[dayIndex % weakest.length].key) : undefined;
  const dsaTopic = weekDsaTopic || focusTopic || rotatingWeak || DSA_TOPICS[0];
  const boosted = Boolean(state.dsaBoostUntil && state.dsaBoostUntil >= date);
  const problems = state.workloadMultiplier >= 1.2 ? 3 : state.workloadMultiplier < 0.8 ? 1 : 2;
  drafts.push({
    order: 1,
    title: `Solve ${problems} ${dsaTopic.label} problem${problems > 1 ? 's' : ''}`,
    description: `Practice ${dsaTopic.label} on LeetCode (https://leetcode.com/tag/${dsaTopic.lcSlug}/). Note the pattern used in each solution.`,
    category: 'dsa',
    priority: boosted || state.focusTopics.includes(dsaTopic.key) ? 'high' : highGap('DSA'),
    estMinutes: 20 * problems,
    source: 'roadmap',
    skill: 'DSA',
    topic: dsaTopic.key,
    problems,
    genKey: `${date}:dsa`,
  });

  // 2. Learning session from the active roadmap week (rotates through its topics).
  if (current && current.milestone.skill !== 'DSA') {
    const topic = current.week.topics[dayIndex % current.week.topics.length];
    const isProjectMilestone = current.milestone.skill === 'Projects';
    drafts.push({
      order: 2,
      title: isProjectMilestone ? topic : `Study: ${topic}`,
      description: `${current.milestone.title} — ${current.week.title}. ${current.milestone.description}`,
      category: isProjectMilestone ? 'project' : 'learning',
      priority: highGap(current.milestone.skill) === 'low' ? 'medium' : highGap(current.milestone.skill),
      estMinutes: 50,
      source: 'roadmap',
      skill: current.milestone.skill,
      milestoneId: current.milestone.id,
      weekId: current.week.id,
      genKey: `${date}:learn`,
    });
  }

  // 3. Focus skills from the weekly review / interventions.
  state.focusSkills.slice(0, 1).forEach(skill => {
    if (skill === current?.milestone.skill) return;
    drafts.push({
      order: 3,
      title: `Focus session: ${skill}`,
      description: `Your weekly review flagged ${skill} as a priority. Spend this session on its weakest concept.`,
      category: 'learning',
      priority: 'high',
      estMinutes: 40,
      source: 'review',
      skill,
      genKey: `${date}:focus`,
    });
  });

  // 4. Project work on the most recently active project.
  const project = activeProject(state);
  if (project) {
    const next = project.milestones.find(m => !m.completedAt);
    drafts.push({
      order: 4,
      title: `Work 45 min on ${project.title}${next ? `: ${next.title}` : ''}`,
      description: next ? `Next milestone: ${next.title}.` : `Move "${project.title}" toward the ${project.stage === 'idea' ? 'planning' : 'next'} stage.`,
      category: 'project',
      priority: 'medium',
      estMinutes: 45,
      source: 'project',
      projectId: project.id,
      projectMilestoneId: next?.id,
      genKey: `${date}:project`,
    });

    // 5. Push to GitHub on alternate days when GitHub is connected.
    if (state.github.snapshot && dayIndex % 2 === 1) {
      drafts.push({
        order: 6,
        title: 'Push today\'s project progress to GitHub',
        description: 'Commit with a descriptive message and push. Keeps your activity visible to recruiters.',
        category: 'github',
        priority: 'low',
        estMinutes: 10,
        source: 'project',
        projectId: project.id,
        genKey: `${date}:github`,
      });
    }
  }

  // 6. Core CS revision on alternate days when a core subject is a gap.
  const coreGap = twin.gaps.find(g => ['OOP', 'DBMS', 'Operating Systems', 'Computer Networks'].includes(g.skill) && g.bucket !== 'strong');
  if (coreGap && dayIndex % 2 === 0) {
    drafts.push({
      order: 5,
      title: `Revise ${coreGap.skill}: one key concept + 5 interview questions`,
      description: `${coreGap.skill} is at ${Math.round(coreGap.current)} vs. ${coreGap.required} required for your target role.`,
      category: 'core_cs',
      priority: coreGap.bucket === 'critical' ? 'high' : 'medium',
      estMinutes: 30,
      source: 'roadmap',
      skill: coreGap.skill,
      genKey: `${date}:core`,
    });
  }

  // Fit to the daily budget in priority order (always keep at least one task).
  const rank: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  drafts.sort((a, b) => rank[a.priority] - rank[b.priority] || a.order - b.order);
  const chosen: Draft[] = [];
  let used = 0;
  for (const d of drafts) {
    if (chosen.length && used + d.estMinutes > budget) continue;
    chosen.push(d);
    used += d.estMinutes;
  }

  return chosen
    .filter(d => !existingKeys.has(d.genKey))
    .map(d => {
      const fields: Partial<Draft> = { ...d };
      delete fields.order;
      return newTask({ ...(fields as Omit<Draft, 'order'>), dueDate: date });
    });
};

// ---------- Weekly goals ----------

export const weeklyGoalTargets = (profile: UserProfile, state: CareerState): Record<WeeklyGoalCategory, number> => {
  const m = state.workloadMultiplier;
  const budget = dailyBudgetMinutes(profile, state);
  const days = 6;
  return {
    dsa: Math.max(3, Math.round((state.workloadMultiplier >= 1.2 ? 3 : m < 0.8 ? 1 : 2) * days)),
    learning: Math.max(2, Math.round((budget >= 90 ? 6 : 4) * Math.min(1, m))),
    project: activeProject(state) ? Math.max(1, Math.round(2 * m)) : 0,
    github: state.github.snapshot ? Math.max(2, Math.round(4 * Math.min(1, m))) : 0,
  };
};

export interface WeeklyGoalProgress {
  category: WeeklyGoalCategory;
  label: string;
  unit: string;
  target: number;
  actual: number;
}

export const weeklyGoalProgress = (state: CareerState, week: string, targets: Partial<Record<WeeklyGoalCategory, number>>): WeeklyGoalProgress[] => {
  const end = addDays(week, 6);
  const inWeek = (iso?: string) => Boolean(iso) && localDate(iso as string) >= week && localDate(iso as string) <= end;
  const done = state.tasks.filter(t => t.status === 'completed' && inWeek(t.completedAt));

  const lcProblems = Object.entries(state.leetcode.snapshot?.submissionsByDate || {})
    .filter(([d]) => d >= week && d <= end)
    .reduce((s, [, n]) => s + n, 0);
  const dsaFromTasks = done.filter(t => t.category === 'dsa').reduce((s, t) => s + (t.problems || 1), 0);

  const learning = done.filter(t => t.category === 'learning').length + state.learningLog.filter(l => l.date >= week && l.date <= end).length;
  const projectMs = state.projects.flatMap(p => p.milestones).filter(m => inWeek(m.completedAt)).length;

  const ghDays = new Set<string>();
  (state.github.snapshot?.activeDates || []).forEach(d => { if (d >= week && d <= end) ghDays.add(d); });
  done.filter(t => t.category === 'github').forEach(t => ghDays.add(localDate(t.completedAt || '')));

  const rows: WeeklyGoalProgress[] = [
    // LeetCode counts are submissions, task counts are problems; take the larger to avoid double counting.
    { category: 'dsa', label: 'DSA', unit: 'problems', target: targets.dsa ?? 0, actual: Math.max(lcProblems, dsaFromTasks) },
    { category: 'learning', label: 'Learning', unit: 'sessions', target: targets.learning ?? 0, actual: learning },
    { category: 'project', label: 'Project', unit: 'milestones', target: targets.project ?? 0, actual: projectMs },
    { category: 'github', label: 'GitHub', unit: 'active days', target: targets.github ?? 0, actual: ghDays.size },
  ];
  return rows.filter(r => r.target > 0 || r.actual > 0);
};

export const weekNumber = (state: CareerState, iso: string): number =>
  Math.floor(daysBetween(weekStart(localDate(state.createdAt)), weekStart(iso)) / 7) + 1;
