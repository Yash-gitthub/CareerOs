// Progressive feature unlocking. New students see a few features first and earn the
// rest through real activity, so the dashboard doesn't overwhelm them on day one.

import type { CareerState, DashboardTab } from './types';
import { localDate } from './dates';

export interface FeatureStep {
  tab: DashboardTab;
  label: string;
  what: string; // what the feature does, shown on its locked panel
  requirement: string; // how to unlock it
  progress: (state: CareerState, now: Date) => { current: number; target: number };
}

const completedTasks = (state: CareerState) => state.tasks.filter(t => t.status === 'completed').length;

const activeDays = (state: CareerState) =>
  new Set(state.tasks.filter(t => t.status === 'completed' && t.completedAt).map(t => localDate(t.completedAt as string))).size;

const daysSinceFirstAssessment = (state: CareerState, now: Date) => {
  const first = state.assessments[0];
  if (!first) return 0;
  return Math.floor((now.getTime() - new Date(first.completedAt).getTime()) / 86_400_000);
};

const tookTest = (state: CareerState) => ({ current: Math.min(1, state.assessments.length), target: 1 });

// Order here is the order the dashboard tabs appear in.
export const FEATURE_JOURNEY: FeatureStep[] = [
  {
    tab: 'overview', label: 'Overview',
    what: 'Your readiness score, skill gaps and current milestone at a glance.',
    requirement: 'Complete the skill verification test',
    progress: tookTest,
  },
  {
    tab: 'roadmap', label: 'Roadmap',
    what: 'Your week-by-week plan to reach your target role, built from your verified skills.',
    requirement: 'Complete the skill verification test',
    progress: tookTest,
  },
  {
    tab: 'tasks', label: 'Tasks',
    what: 'Daily tasks generated from your roadmap, with reminders and weekly goals.',
    requirement: 'Open your Roadmap to see the plan',
    progress: s => ({ current: s.visitedTabs.includes('roadmap') ? 1 : 0, target: 1 }),
  },
  {
    tab: 'coding', label: 'Coding & DSA',
    what: 'DSA topic tracking, LeetCode sync and targeted practice for weak topics.',
    requirement: 'Complete your first task',
    progress: s => ({ current: Math.min(1, completedTasks(s)), target: 1 }),
  },
  {
    tab: 'learning', label: 'Learning',
    what: 'Curated resources for your skill gaps and a log of your study time.',
    requirement: 'Complete 3 tasks',
    progress: s => ({ current: Math.min(3, completedTasks(s)), target: 3 }),
  },
  {
    tab: 'projects', label: 'Projects',
    what: 'Recommended project blueprints, GitHub sync and milestone tracking.',
    requirement: 'Complete 5 tasks',
    progress: s => ({ current: Math.min(5, completedTasks(s)), target: 5 }),
  },
  {
    tab: 'portfolio', label: 'Portfolio',
    what: 'Achievements, certifications and experience that recruiters will see.',
    requirement: 'Add or adopt your first project',
    progress: s => ({ current: Math.min(1, s.projects.length), target: 1 }),
  },
  {
    tab: 'analytics', label: 'Analytics',
    what: 'Trends in readiness, consistency and coding activity over time.',
    requirement: 'Complete tasks on 3 different days',
    progress: s => ({ current: Math.min(3, activeDays(s)), target: 3 }),
  },
  {
    tab: 'review', label: 'Weekly Review',
    what: 'A weekly report of what you did, what slipped, and how next week adapts.',
    requirement: 'Use CareerOS for one week after your test',
    progress: (s, now) => ({
      current: s.weeklyReviews.length ? 7 : Math.min(7, daysSinceFirstAssessment(s, now)),
      target: 7,
    }),
  },
];

export const featureStep = (tab: DashboardTab) => FEATURE_JOURNEY.find(f => f.tab === tab) as FeatureStep;

const met = (step: FeatureStep, state: CareerState, now: Date) => {
  const p = step.progress(state, now);
  return p.current >= p.target;
};

export const isUnlocked = (state: CareerState, tab: DashboardTab) => state.unlockedTabs.includes(tab);

export const nextLockedStep = (state: CareerState): FeatureStep | null =>
  FEATURE_JOURNEY.find(f => !state.unlockedTabs.includes(f.tab)) || null;

// Records newly met unlocks (they never re-lock). Returns the steps that just unlocked.
export const applyUnlocks = (state: CareerState, now: Date = new Date()): FeatureStep[] => {
  const fresh = FEATURE_JOURNEY.filter(f => !state.unlockedTabs.includes(f.tab) && met(f, state, now));
  if (fresh.length) state.unlockedTabs = [...state.unlockedTabs, ...fresh.map(f => f.tab)];
  return fresh;
};
