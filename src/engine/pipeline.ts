// The Career Twin update engine.
//
//   Event → update activity data → recompute twin → skill gaps → readiness
//         → check interventions → notifications → adapt tasks/roadmap
//
// Pure functions over a mutable draft (the store clones state before calling).

import type { UserProfile } from '../types/user';
import type {
  ActivityEvent, AppNotification, CareerState, DashboardTab, NotificationPrefs,
  NotificationType, ReadinessKey,
} from './types';
import type { CareerTwin } from './careerTwin';
import { buildCareerTwin } from './careerTwin';
import { detectInterventions } from './intervention';
import { generateDailyTasks, weeklyGoalTargets } from './taskGeneration';
import { generateWeeklyReview } from './weeklyReview';
import { activateNext } from './roadmap';
import { addDays, today as todayISO, uid, weekStart } from './dates';
import { getRoleRequirements } from './roleRequirements';
import { applyUnlocks } from './unlocks';

export const defaultNotificationPrefs = (reminderPreference: string): NotificationPrefs => {
  const all = (v: boolean): Record<NotificationType, boolean> => ({
    task_reminder: v, upcoming_task: v, overdue: v, github_reminder: v,
    learning_reminder: v, weekly_review: v, twin_update: v, intervention: v,
  });
  const enabled = all(true);
  if (reminderPreference === 'Important reminders only') {
    Object.assign(enabled, { task_reminder: false, upcoming_task: false, learning_reminder: false, github_reminder: false });
  } else if (reminderPreference === 'Regular reminders') {
    enabled.upcoming_task = false;
  } else if (reminderPreference === "I'll decide later") {
    Object.assign(enabled, all(false), { weekly_review: true, intervention: true });
  }
  return { enabled, browser: false };
};

export const createInitialCareerState = (profile: UserProfile): CareerState => {
  const now = new Date().toISOString();
  return {
    schema: 1,
    createdAt: now,
    assessments: [],
    roadmap: null,
    tasks: [],
    projects: [],
    portfolio: [],
    learningLog: [],
    completedResourceIds: [],
    notifications: [],
    notificationPrefs: defaultNotificationPrefs(profile.learningPreferences?.reminderPreference || 'Regular reminders'),
    interventions: [],
    readinessHistory: [],
    leetcodeHistory: [],
    weeklyGoals: {},
    weeklyReviews: [],
    github: { username: '', status: 'idle' },
    leetcode: { username: '', status: 'idle' },
    workloadMultiplier: 1,
    focusSkills: [],
    focusTopics: [],
    twinVersion: 0,
    twinUpdatedAt: now,
    events: [],
    unlockedTabs: [],
    visitedTabs: [],
  };
};

export const notify = (
  state: CareerState,
  type: NotificationType,
  title: string,
  body: string,
  dedupeKey: string,
  tab?: DashboardTab,
  now: Date = new Date()
): boolean => {
  if (!state.notificationPrefs.enabled[type]) return false;
  if (state.notifications.some(n => n.dedupeKey === dedupeKey)) return false;
  const n: AppNotification = { id: uid('ntf'), type, title, body, dedupeKey, tab, createdAt: now.toISOString() };
  state.notifications = [n, ...state.notifications].slice(0, 200);
  return true;
};

const markOverdue = (state: CareerState, today: string): number => {
  let n = 0;
  state.tasks.forEach(t => {
    if (t.dueDate < today && (t.status === 'pending' || t.status === 'in_progress')) {
      t.status = 'overdue';
      n++;
    }
  });
  return n;
};

// Runs after every event. Returns the twin computed from the final state.
export const runPipeline = (
  state: CareerState,
  profile: UserProfile,
  event: Pick<ActivityEvent, 'type' | 'summary'>,
  now: Date = new Date()
): CareerTwin => {
  const today = todayISO(now);
  state.events = [{ id: uid('evt'), ...event, createdAt: now.toISOString() }, ...state.events].slice(0, 200);
  markOverdue(state, today);

  let twin = buildCareerTwin(profile, state, now);

  // Readiness snapshot + "why it changed".
  const last = state.readinessHistory[state.readinessHistory.length - 1];
  const contributions = Object.fromEntries(twin.readiness.components.map(c => [c.key, c.contribution])) as Record<ReadinessKey, number>;
  const roleSkills = new Set(getRoleRequirements(profile.career.targetRole).map(r => r.skill));
  const changed = !last ||
    Math.abs(last.score - twin.readiness.score) >= 0.1 ||
    (Object.keys(contributions) as ReadinessKey[]).some(k => Math.abs((last.contributions[k] || 0) - contributions[k]) >= 0.1);

  if (changed) {
    state.readinessHistory = [...state.readinessHistory, {
      id: uid('rs'),
      score: twin.readiness.score,
      contributions,
      skills: Object.fromEntries(twin.skills.filter(s => roleSkills.has(s.skill)).map(s => [s.skill, Math.round(s.score)])),
      consistency: twin.behavioral.consistency7.score,
      reason: event.summary,
      createdAt: now.toISOString(),
    }].slice(-500);
    state.twinVersion += 1;
    state.twinUpdatedAt = now.toISOString();
    if (last && event.type !== 'system.reconcile') {
      notify(
        state, 'twin_update', 'Your Career Twin has been updated',
        `Career readiness ${last.score}% → ${twin.readiness.score}% after: ${event.summary}`,
        `twin:${state.twinVersion}`, 'overview', now
      );
    }
  }

  // Intervention checks.
  const found = detectInterventions(profile, state, twin, now);
  if (found.length) {
    state.interventions = [...found, ...state.interventions].slice(0, 100);
    found.forEach(i => notify(state, 'intervention', i.title, `${i.message} ${i.recommendation}`, `int:${i.id}`, 'overview', now));
    twin = buildCareerTwin(profile, state, now);
  }

  announceUnlocks(state, now);

  return twin;
};

// Unlocks features whose requirements are now met and tells the student about each one.
export const announceUnlocks = (state: CareerState, now: Date = new Date()): number => {
  const fresh = applyUnlocks(state, now);
  fresh
    .filter(f => f.tab !== 'overview')
    .forEach(f => notify(state, 'twin_update', `New feature unlocked: ${f.label}`, f.what, `unlock:${f.tab}`, f.tab, now));
  return fresh.length;
};

const STUDY_START_HOUR: Record<string, number | null> = {
  'Morning (Early riser)': 7,
  'Afternoon (Post-college/classes)': 15,
  'Evening (Dedicated study block)': 18,
  'Late night (Night owl)': 22,
  'Flexible (Varies day-to-day)': null,
};

// Time-based checks (overdue, reminders, daily tasks, weekly review).
// Returns a summary of what changed, or null if nothing did.
export const reconcile = (state: CareerState, profile: UserProfile, now: Date = new Date()): string | null => {
  const today = todayISO(now);
  const week = weekStart(today);
  const changes: string[] = [];
  const notificationsBefore = state.notifications.length;

  const overdueNow = markOverdue(state, today);
  if (overdueNow) changes.push(`${overdueNow} task${overdueNow > 1 ? 's' : ''} missed`);

  // Close roadmap weeks whose time has passed and whose work was done.
  if (state.roadmap) {
    let closed = 0;
    state.roadmap.milestones.forEach(m => m.weeks.forEach(w => {
      if (w.status !== 'active' || addDays(w.startDate, 6) >= today) return;
      const done = state.tasks.filter(t => t.weekId === w.id && t.status === 'completed').length;
      if (done >= w.topics.length) {
        w.status = 'completed';
        closed++;
      }
    }));
    if (closed) {
      activateNext(state.roadmap);
      changes.push('roadmap week completed');
    }
  }

  // Automatic weekly review for last week.
  const lastWeek = addDays(week, -7);
  const hadActivity = state.tasks.some(t => t.dueDate >= lastWeek && t.dueDate < week);
  if (hadActivity && !state.weeklyReviews.some(r => r.weekStart === lastWeek)) {
    const twin = buildCareerTwin(profile, state, now);
    const review = generateWeeklyReview(state, twin, lastWeek, now);
    applyReview(state, review);
    notify(state, 'weekly_review', 'Your weekly CareerOS review is ready', `${review.metrics.completionRate}% of tasks completed. Needs attention: ${review.needsAttention}.`, `review:${lastWeek}`, 'review', now);
    changes.push('weekly review generated');
  }

  if (!state.weeklyGoals[week]) {
    state.weeklyGoals[week] = weeklyGoalTargets(profile, state);
    changes.push('weekly goals set');
  }

  // Daily tasks (only once a roadmap exists).
  if (state.roadmap) {
    const twin = buildCareerTwin(profile, state, now);
    const created = generateDailyTasks(profile, state, twin, today);
    if (created.length) {
      state.tasks.push(...created);
      changes.push(`${created.length} tasks created for today`);
    }
  }

  // Reminders.
  const dueToday = state.tasks.filter(t => t.dueDate === today && (t.status === 'pending' || t.status === 'in_progress'));
  if (dueToday.length) {
    const first = dueToday[0];
    notify(state, 'task_reminder', `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
      `Your ${first.category === 'dsa' ? 'DSA' : first.category.replace('_', ' ')} task "${first.title}" is due today.`,
      `due:${today}`, 'tasks', now);
  }
  const overdue = state.tasks.filter(t => t.status === 'overdue');
  if (overdue.length) {
    notify(state, 'overdue', `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      'Complete, reschedule or skip them so your plan stays realistic.', `overdue:${today}`, 'tasks', now);
  }
  const startHour = STUDY_START_HOUR[profile.learningPreferences.preferredStudyTime];
  if (startHour !== null && startHour !== undefined && dueToday.length) {
    const start = new Date(now);
    start.setHours(startHour, 0, 0, 0);
    const minutesUntil = (start.getTime() - now.getTime()) / 60_000;
    if (minutesUntil > 0 && minutesUntil <= 30) {
      notify(state, 'upcoming_task', 'Study session starting soon',
        `Your "${dueToday[0].title}" session starts in ${Math.round(minutesUntil)} minutes.`, `upcoming:${today}`, 'tasks', now);
    }
  }
  const gh = state.github.snapshot;
  if (gh) {
    const lastPush = [...gh.activeDates].sort().pop();
    if (!lastPush || lastPush < addDays(today, -7)) {
      notify(state, 'github_reminder', 'GitHub has been quiet',
        "You haven't updated your project recently. Push a small commit today.", `gh:${week}`, 'projects', now);
    }
  }
  if (now.getHours() >= 20) {
    const learningOpen = dueToday.filter(t => t.category === 'learning');
    if (learningOpen.length) {
      notify(state, 'learning_reminder', "Today's learning session is still open",
        `You have not completed today's learning session: "${learningOpen[0].title}".`, `learn:${today}`, 'tasks', now);
    }
  }

  if (announceUnlocks(state, now)) changes.push('feature unlocked');

  if (state.notifications.length !== notificationsBefore && !changes.length) changes.push('reminders');
  return changes.length ? changes.join(', ') : null;
};

export const applyReview = (state: CareerState, review: CareerState['weeklyReviews'][number]) => {
  state.weeklyReviews = [...state.weeklyReviews.filter(r => r.weekStart !== review.weekStart), review]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  state.workloadMultiplier = review.nextWeek.multiplier;
  state.focusSkills = review.nextWeek.focusSkills;
  state.focusTopics = review.nextWeek.focusTopics;
};
