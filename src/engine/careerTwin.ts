import type { UserProfile } from '../types/user';
import type { CareerState, ReadinessComponent, RoadmapMilestone } from './types';
import type { SkillState, SkillGapItem, DsaTopicScore } from './skillGap';
import {
  computeDsaTopics, computeDsaScore, computeSkillStates, computeSkillGaps,
  latestAssessment, weakDsaTopics,
} from './skillGap';
import type { ConsistencyResult } from './careerReadiness';
import { computeConsistency, computeReadiness, projectProgress, codingActiveDates } from './careerReadiness';
import { addDays, round1, today as todayISO, localDate } from './dates';
import { resolveRole, roleDomain, DOMAIN_LABEL } from './roleRequirements';

export interface CareerTwin {
  career: {
    targetRole: string;
    domain: string;
    dreamCompany: string;
    timeline: string;
    objective: string;
  };
  technical: {
    categories: { key: string; label: string; score: number | null; count: number }[];
    topSkills: SkillState[];
  };
  coding: {
    problemsSolved: number | null;
    easy: number | null;
    medium: number | null;
    hard: number | null;
    dsaScore: number | null;
    topics: DsaTopicScore[];
    weakAreas: DsaTopicScore[];
    activeDays7: number;
    activeDays28: number;
    streak: number;
  };
  project: {
    count: number;
    active: number;
    deployed: number;
    technologies: string[];
    avgProgress: number | null;
    relevantCount: number;
    githubRepos: number | null;
    githubStars: number | null;
    githubPushDays30: number | null;
  };
  learning: {
    hoursTotal: number;
    hours7: number;
    preferredResources: string[];
    consistency: number | null;
    completedTopics: number;
    totalTopics: number;
    currentStage: string;
  };
  behavioral: {
    completed: number;
    missed: number;
    skipped: number;
    consistency7: ConsistencyResult;
    consistency28: ConsistencyResult;
    productivePeriod: string | null;
    avgTasksPerActiveDay: number | null;
    interventionAreas: string[];
  };
  skills: SkillState[];
  gaps: SkillGapItem[];
  readiness: { score: number; components: ReadinessComponent[] };
  stage: string;
  strengths: string[];
  weaknesses: string[];
  calibrated: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  programming: 'Programming',
  web: 'Web Development',
  database: 'Databases',
  aiMl: 'AI / ML',
  cloudDevOps: 'Cloud & DevOps',
  coreCS: 'Core CS',
};

const periodOf = (hour: number) =>
  hour < 5 ? 'Late night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Late night';

export const currentMilestone = (state: CareerState): RoadmapMilestone | null =>
  state.roadmap?.milestones.find(m => m.status === 'active') ||
  state.roadmap?.milestones.find(m => m.status === 'pending') ||
  null;

export const computeStreak = (dates: Set<string>, today: string): number => {
  let streak = 0;
  // Today without activity yet doesn't break a streak that ran through yesterday.
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const buildCareerTwin = (profile: UserProfile, state: CareerState, now: Date = new Date()): CareerTwin => {
  const today = todayISO(now);
  const topics = computeDsaTopics(state);
  const dsaScore = computeDsaScore(state, topics);
  const skills = computeSkillStates(profile, state, dsaScore);
  const gaps = computeSkillGaps(profile, skills);
  const consistency7 = computeConsistency(state, 7, now);
  const consistency28 = computeConsistency(state, 28, now);
  const readiness = computeReadiness(profile, state, skills, dsaScore, consistency28, now);
  const lc = state.leetcode.snapshot;
  const gh = state.github.snapshot;

  // Technical profile grouped by onboarding categories.
  const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
    const inCat = skills.filter(s => s.category === key);
    return {
      key,
      label,
      count: inCat.length,
      score: inCat.length ? round1(inCat.reduce((sum, s) => sum + s.score, 0) / inCat.length) : null,
    };
  });

  const coding = codingActiveDates(state);
  const countActive = (days: number) => {
    let n = 0;
    for (let i = 0; i < days; i++) if (coding.has(addDays(today, -i))) n++;
    return n;
  };

  const roleSkills = new Set(skills.filter(s => s.category === 'required').map(s => s.skill.toLowerCase()));
  const tech = Array.from(new Set(state.projects.flatMap(p => p.techStack)));

  const learningMinutesAll =
    state.tasks.filter(t => t.status === 'completed' && t.category === 'learning').reduce((s, t) => s + t.estMinutes, 0) +
    state.learningLog.reduce((s, l) => s + l.minutes, 0);
  const weekAgo = addDays(today, -6);
  const learningMinutes7 =
    state.tasks
      .filter(t => t.status === 'completed' && t.category === 'learning' && localDate(t.completedAt || '') >= weekAgo)
      .reduce((s, t) => s + t.estMinutes, 0) +
    state.learningLog.filter(l => l.date >= weekAgo).reduce((s, l) => s + l.minutes, 0);

  const weeks = state.roadmap?.milestones.flatMap(m => m.weeks) || [];
  const completedTopics = weeks.filter(w => w.status === 'completed').reduce((n, w) => n + w.topics.length, 0);
  const totalTopics = weeks.reduce((n, w) => n + w.topics.length, 0);

  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const periods = new Map<string, number>();
  completedTasks.forEach(t => {
    if (!t.completedAt) return;
    const p = periodOf(new Date(t.completedAt).getHours());
    periods.set(p, (periods.get(p) || 0) + 1);
  });
  const productivePeriod = periods.size ? [...periods.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
  const activeTaskDays = new Set(completedTasks.map(t => localDate(t.completedAt || '')).filter(Boolean)).size;

  const assessment = latestAssessment(state);
  const calibrated = Boolean(assessment || lc || gh || state.tasks.some(t => t.status === 'completed'));

  const strong = gaps.filter(g => g.bucket === 'strong').map(g => g.skill);
  const weakTopics = weakDsaTopics(topics, 3).filter(t => t.score !== null && t.score < 40);
  const strengths = [
    ...strong.slice(0, 4),
    ...topics.filter(t => (t.score ?? 0) >= 70).slice(0, 2).map(t => `DSA: ${t.label}`),
  ];
  const weaknesses = [
    ...gaps.filter(g => g.bucket === 'critical').slice(0, 4).map(g => g.skill),
    ...weakTopics.map(t => `DSA: ${t.label}`),
  ];

  const stage = !calibrated
    ? 'Calibrating'
    : readiness.score < 25 ? 'Foundation'
    : readiness.score < 50 ? 'Building'
    : readiness.score < 70 ? 'Interview-ready track'
    : 'Placement ready';

  return {
    career: {
      targetRole: resolveRole(profile.career.targetRole),
      domain: DOMAIN_LABEL[roleDomain(profile.career.targetRole)],
      dreamCompany: profile.career.dreamCompany || 'Not set',
      timeline: profile.career.timeline || 'Not set',
      objective: profile.career.goal || 'Not set',
    },
    technical: {
      categories,
      topSkills: [...skills].sort((a, b) => b.score - a.score).slice(0, 8),
    },
    coding: {
      problemsSolved: lc ? lc.total : null,
      easy: lc ? lc.easy : null,
      medium: lc ? lc.medium : null,
      hard: lc ? lc.hard : null,
      dsaScore,
      topics,
      weakAreas: weakTopics,
      activeDays7: countActive(7),
      activeDays28: countActive(28),
      streak: computeStreak(coding, today),
    },
    project: {
      count: state.projects.length,
      active: state.projects.filter(p => p.stage !== 'completed' && p.stage !== 'idea').length,
      deployed: state.projects.filter(p => p.deployUrl || p.stage === 'deployment' || p.stage === 'completed').length,
      technologies: tech,
      avgProgress: state.projects.length
        ? Math.round(state.projects.reduce((s, p) => s + projectProgress(p), 0) / state.projects.length)
        : null,
      relevantCount: state.projects.filter(p => p.techStack.some(t => roleSkills.has(t.toLowerCase()))).length,
      githubRepos: gh ? gh.repos.filter(r => !r.isFork).length : null,
      githubStars: gh ? gh.stars : null,
      githubPushDays30: gh ? gh.pushDays30 : null,
    },
    learning: {
      hoursTotal: round1(learningMinutesAll / 60),
      hours7: round1(learningMinutes7 / 60),
      preferredResources: profile.learningPreferences.methods || [],
      consistency: consistency28.score,
      completedTopics,
      totalTopics,
      currentStage: currentMilestone(state)?.title || (state.roadmap ? 'Roadmap complete' : 'No roadmap yet'),
    },
    behavioral: {
      completed: completedTasks.length,
      missed: state.tasks.filter(t => t.status === 'overdue').length,
      skipped: state.tasks.filter(t => t.status === 'skipped').length,
      consistency7,
      consistency28,
      productivePeriod,
      avgTasksPerActiveDay: activeTaskDays ? round1(completedTasks.length / activeTaskDays) : null,
      interventionAreas: state.interventions.filter(i => i.status === 'open').map(i => i.title),
    },
    skills,
    gaps,
    readiness,
    stage,
    strengths,
    weaknesses,
    calibrated,
  };
};
