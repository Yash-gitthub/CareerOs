import type { UserProfile } from '../types/user';
import type { CareerState, ReadinessComponent, ReadinessKey, Project, ProjectStage, Task } from './types';
import type { SkillState } from './skillGap';
import { latestAssessment } from './skillGap';
import { getRoleRequirements } from './roleRequirements';
import { addDays, clamp, round1, today as todayISO, localDate } from './dates';

// Configurable weights (mirror of the readiness_weights table). Must sum to 100.
export const READINESS_WEIGHTS: Record<ReadinessKey, number> = {
  technical_skills: 25,
  dsa: 15,
  projects: 20,
  coding_activity: 10,
  portfolio: 10,
  learning_consistency: 10,
  core_cs: 5,
  goal_alignment: 5,
};

export const READINESS_LABELS: Record<ReadinessKey, string> = {
  technical_skills: 'Technical Skills',
  dsa: 'DSA',
  projects: 'Projects',
  coding_activity: 'Coding Activity',
  portfolio: 'Portfolio',
  learning_consistency: 'Learning Consistency',
  core_cs: 'Core CS',
  goal_alignment: 'Career Goal Alignment',
};

const UNLOCK_HINTS: Record<ReadinessKey, string> = {
  technical_skills: 'Add skills, projects and certifications or take the assessment.',
  dsa: 'Take the assessment or connect LeetCode.',
  projects: 'Add a project or connect GitHub.',
  coding_activity: 'Connect GitHub / LeetCode or complete DSA and project tasks.',
  portfolio: 'Complete your portfolio sections.',
  learning_consistency: 'Complete your planned daily tasks.',
  core_cs: 'Take the assessment (Core CS section).',
  goal_alignment: 'Generate your roadmap and complete weekly goals.',
};

const CORE_SKILLS = ['DSA', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks'];

export const STAGE_WEIGHT: Record<ProjectStage, number> = {
  idea: 0.05,
  planning: 0.15,
  development: 0.4,
  testing: 0.6,
  deployment: 0.8,
  completed: 1,
};

export const projectProgress = (p: Project): number => {
  const stagePct = STAGE_WEIGHT[p.stage] * 100;
  if (!p.milestones.length) return Math.round(stagePct);
  const msPct = (p.milestones.filter(m => m.completedAt).length / p.milestones.length) * 100;
  return Math.round(p.stage === 'completed' ? 100 : 0.5 * stagePct + 0.5 * msPct);
};

const dateOf = (isoDateTime: string) => localDate(isoDateTime);

const CODING_CATEGORIES: Task['category'][] = ['dsa', 'project', 'github'];

// Days with real coding activity: GitHub pushes, LeetCode submissions, completed coding tasks.
export const codingActiveDates = (state: CareerState): Set<string> => {
  const dates = new Set<string>(state.github.snapshot?.activeDates || []);
  Object.entries(state.leetcode.snapshot?.submissionsByDate || {}).forEach(([d, n]) => {
    if (n > 0) dates.add(d);
  });
  state.tasks.forEach(t => {
    if (t.status === 'completed' && t.completedAt && CODING_CATEGORIES.includes(t.category)) dates.add(dateOf(t.completedAt));
  });
  return dates;
};

export const anyActiveDates = (state: CareerState): Set<string> => {
  const dates = codingActiveDates(state);
  state.tasks.forEach(t => {
    if (t.status === 'completed' && t.completedAt) dates.add(dateOf(t.completedAt));
  });
  state.learningLog.forEach(l => dates.add(l.date));
  return dates;
};

// A task counts as "planned" once its day has passed, or if it was already resolved today.
export const plannedTasksIn = (state: CareerState, start: string, end: string, today: string) =>
  state.tasks.filter(t => {
    if (t.dueDate < start || t.dueDate > end) return false;
    if (t.dueDate < today) return true;
    return t.dueDate === today && (t.status === 'completed' || t.status === 'skipped');
  });

export interface ConsistencyResult {
  score: number | null;
  planned: number;
  completed: number;
  skipped: number;
  activeDays: number;
  windowDays: number;
  learningPlanned: number;
  learningCompleted: number;
}

export const computeConsistency = (state: CareerState, days: number, now: Date = new Date()): ConsistencyResult => {
  const today = todayISO(now);
  const start = addDays(today, -(days - 1));
  const planned = plannedTasksIn(state, start, today, today);
  const completed = planned.filter(t => t.status === 'completed').length;
  const skipped = planned.filter(t => t.status === 'skipped').length;
  const active = anyActiveDates(state);
  let activeDays = 0;
  for (let i = 0; i < days; i++) if (active.has(addDays(start, i))) activeDays++;
  const learning = planned.filter(t => t.category === 'learning');
  const learningCompleted = learning.filter(t => t.status === 'completed').length;

  if (!planned.length) {
    return { score: null, planned: 0, completed: 0, skipped: 0, activeDays, windowDays: days, learningPlanned: 0, learningCompleted: 0 };
  }

  const cr = completed / planned.length;
  const ad = activeDays / days;
  const lr = learning.length ? learningCompleted / learning.length : cr;
  return {
    score: round1(100 * (0.6 * cr + 0.25 * ad + 0.15 * lr)),
    planned: planned.length,
    completed,
    skipped,
    activeDays,
    windowDays: days,
    learningPlanned: learning.length,
    learningCompleted,
  };
};

// ---------- Portfolio completeness ----------

export interface PortfolioCheck {
  key: string;
  label: string;
  passed: boolean;
}

export const portfolioChecks = (profile: UserProfile, state: CareerState): PortfolioCheck[] => {
  const skillCount = Object.values(profile.skills || {}).reduce((n, l) => n + (l?.length || 0), 0);
  const has = (kind: string) => state.portfolio.some(p => p.kind === kind);
  return [
    { key: 'education', label: 'Education details', passed: Boolean(profile.education?.college && profile.education?.degree) },
    { key: 'skills', label: 'At least 3 skills listed', passed: skillCount >= 3 },
    { key: 'project_desc', label: 'A project with a detailed description', passed: state.projects.some(p => p.description.trim().length >= 80) },
    { key: 'deployed', label: 'A deployed project (live URL)', passed: state.projects.some(p => Boolean(p.deployUrl.trim())) },
    { key: 'github', label: 'GitHub connected', passed: Boolean(state.github.snapshot) },
    { key: 'leetcode', label: 'LeetCode connected', passed: Boolean(state.leetcode.snapshot) },
    { key: 'linkedin', label: 'LinkedIn profile link', passed: state.portfolio.some(p => p.kind === 'link' && /linkedin\.com/i.test(p.url)) },
    { key: 'certification', label: 'At least one certification', passed: has('certification') },
    { key: 'achievement', label: 'At least one achievement', passed: has('achievement') },
    { key: 'experience', label: 'Internship / work / volunteer experience', passed: has('experience') },
  ];
};

// ---------- Readiness ----------

export interface ReadinessResult {
  score: number;
  components: ReadinessComponent[];
}

export const computeReadiness = (
  profile: UserProfile,
  state: CareerState,
  skills: SkillState[],
  dsaScore: number | null,
  consistency28: ConsistencyResult,
  now: Date = new Date()
): ReadinessResult => {
  const today = todayISO(now);
  const assessment = latestAssessment(state);
  const reqs = getRoleRequirements(profile.career.targetRole);
  const byName = new Map(skills.map(s => [s.skill.toLowerCase(), s.score]));

  // Technical skills: weighted attainment of role-required (non-core) skills.
  const techReqs = reqs.filter(r => !CORE_SKILLS.includes(r.skill));
  const usedReqs = techReqs.length ? techReqs : reqs;
  const totalWeight = usedReqs.reduce((s, r) => s + r.weight, 0) || 1;
  const technical = usedReqs.reduce((s, r) => {
    const current = byName.get(r.skill.toLowerCase()) ?? 0;
    return s + r.weight * clamp((current / r.required) * 100);
  }, 0) / totalWeight;

  // Projects: relevance-weighted stage progress + public GitHub repos.
  const roleSkills = new Set(reqs.map(r => r.skill.toLowerCase()));
  const linkedRepos = new Set(state.projects.map(p => p.repoUrl.toLowerCase()).filter(Boolean));
  const projectPoints = state.projects.reduce((s, p) => {
    const relevant = p.techStack.some(t => roleSkills.has(t.toLowerCase()));
    return s + (projectProgress(p) / 100) * (relevant ? 1 : 0.6) + (p.deployUrl ? 0.1 : 0);
  }, 0);
  const yearAgo = addDays(today, -365);
  const repoPoints = Math.min(1, (state.github.snapshot?.repos || [])
    .filter(r => !r.isFork && localDate(r.pushedAt) >= yearAgo && !linkedRepos.has(r.url.toLowerCase()))
    .length * 0.25);
  const hasProjectData = state.projects.length > 0 || Boolean(state.github.snapshot);
  const projects = hasProjectData ? clamp(((projectPoints + repoPoints) / 3) * 100) : null;

  // Coding activity: active coding days in the last 28 days (20 days = 100%).
  const coding = codingActiveDates(state);
  const hasCodingData = Boolean(state.github.snapshot || state.leetcode.snapshot) || coding.size > 0;
  let active28 = 0;
  for (let i = 0; i < 28; i++) if (coding.has(addDays(today, -i))) active28++;
  const codingActivity = hasCodingData ? clamp((active28 / 20) * 100) : null;

  const checks = portfolioChecks(profile, state);
  const portfolio = (checks.filter(c => c.passed).length / checks.length) * 100;

  // Goal alignment: roadmap weeks finished on schedule.
  let goal: number | null = null;
  if (state.roadmap) {
    const weeks = state.roadmap.milestones.flatMap(m => m.weeks);
    const ended = weeks.filter(w => addDays(w.startDate, 6) < today);
    goal = ended.length ? (ended.filter(w => w.status === 'completed').length / ended.length) * 100 : 100;
  }

  const values: Record<ReadinessKey, number | null> = {
    technical_skills: round1(technical),
    dsa: dsaScore,
    projects: projects === null ? null : round1(projects),
    coding_activity: codingActivity === null ? null : round1(codingActivity),
    portfolio: round1(portfolio),
    learning_consistency: consistency28.score,
    core_cs: assessment ? assessment.sectionScores.core_cs : null,
    goal_alignment: goal === null ? null : round1(goal),
  };

  const components = (Object.keys(READINESS_WEIGHTS) as ReadinessKey[]).map(key => {
    const value = values[key];
    const weight = READINESS_WEIGHTS[key];
    return {
      key,
      label: READINESS_LABELS[key],
      weight,
      value,
      contribution: value === null ? 0 : round1((value * weight) / 100),
      hint: UNLOCK_HINTS[key],
    };
  });

  return {
    score: round1(components.reduce((s, c) => s + c.contribution, 0)),
    components,
  };
};

// Explain the difference between two snapshots as "+4.0 Projects" style lines.
export const explainDelta = (
  before: Record<ReadinessKey, number> | undefined,
  after: Record<ReadinessKey, number>
): { key: ReadinessKey; label: string; delta: number }[] => {
  if (!before) return [];
  return (Object.keys(after) as ReadinessKey[])
    .map(key => ({ key, label: READINESS_LABELS[key], delta: round1((after[key] || 0) - (before[key] || 0)) }))
    .filter(d => Math.abs(d.delta) >= 0.1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
};
