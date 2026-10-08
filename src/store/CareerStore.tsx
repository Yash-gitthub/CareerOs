import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import type { UserProfile } from '../types/user';
import type {
  ActivityEvent, AssessmentResult, CareerState, DashboardTab, NotificationPrefs, PortfolioItem,
  Project, ProjectBlueprint, ProjectStage, Task,
} from '../engine/types';
import type { CareerTwin } from '../engine/careerTwin';
import { buildCareerTwin } from '../engine/careerTwin';
import { announceUnlocks, applyReview, createInitialCareerState, notify, reconcile, runPipeline } from '../engine/pipeline';
import { applyUnlocks } from '../engine/unlocks';
import {
  generateRoadmap, moveMilestone as moveMilestoneFn, rescheduleWeek as rescheduleWeekFn,
  setWeekStatus, skipMilestone as skipMilestoneFn,
} from '../engine/roadmap';
import { generateDailyTasks, newTask, weeklyGoalTargets } from '../engine/taskGeneration';
import { interventionTasks } from '../engine/intervention';
import { generateWeeklyReview } from '../engine/weeklyReview';
import { addDays, today as todayISO, uid, weekStart } from '../engine/dates';
import { DSA_TOPICS } from '../engine/roleRequirements';
import { LEARNING_RESOURCES } from '../data/learningResources';
import { syncGitHub as fetchGitHub, SyncError } from '../integrations/github';
import { syncLeetCode as fetchLeetCode, manualLeetCode } from '../integrations/leetcode';
import { CAREER_STATE_PREFIX, DASHBOARD_TAB_KEY } from './keys';
import { previewTab } from '../lib/preview';

type EventType = ActivityEvent['type'];
type Mutator = (draft: CareerState, now: Date) => void;

interface CareerContextValue {
  state: CareerState;
  twin: CareerTwin;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;

  // Tasks
  generateTodayTasks: () => void;
  completeTask: (id: string) => void;
  startTask: (id: string) => void;
  skipTask: (id: string, reason: string) => void;
  rescheduleTask: (id: string, date: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'description' | 'category' | 'priority' | 'estMinutes' | 'dueDate'>>) => void;
  addTask: (fields: Pick<Task, 'title' | 'description' | 'category' | 'priority' | 'estMinutes' | 'dueDate'>) => void;
  deleteTask: (id: string) => void;
  generateDsaTasksForWeakTopics: () => void;

  // Assessment
  submitAssessment: (result: AssessmentResult, verifiedSkills?: UserProfile['skills']) => void;

  // Roadmap
  regenerateRoadmap: (params?: { timeline?: string; dailyStudyTime?: string }) => void;
  completeWeek: (weekId: string) => void;
  skipWeek: (weekId: string) => void;
  rescheduleWeek: (weekId: string) => void;
  skipMilestone: (milestoneId: string) => void;
  moveMilestone: (milestoneId: string, direction: -1 | 1) => void;

  // Integrations
  syncGitHub: (username: string) => Promise<void>;
  disconnectGitHub: () => void;
  syncLeetCode: (username: string) => Promise<void>;
  saveManualLeetCode: (username: string, counts: { easy: number; medium: number; hard: number }, tags: Record<string, number>) => void;
  disconnectLeetCode: () => void;

  // Projects
  addProject: (fields: Partial<Project> & Pick<Project, 'title'>) => string;
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  setProjectStage: (id: string, stage: ProjectStage) => void;
  addProjectMilestone: (projectId: string, title: string, dueDate?: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;
  removeProjectMilestone: (projectId: string, milestoneId: string) => void;
  createTaskFromMilestone: (projectId: string, milestoneId: string) => void;
  adoptBlueprint: (blueprint: ProjectBlueprint) => void;

  // Portfolio
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => void;
  updatePortfolioItem: (id: string, patch: Partial<Omit<PortfolioItem, 'id'>>) => void;
  removePortfolioItem: (id: string) => void;

  // Learning
  startResource: (resourceId: string) => void;
  completeResource: (resourceId: string) => void;
  logLearning: (skill: string, minutes: number, note: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setNotificationPrefs: (prefs: NotificationPrefs) => void;
  enableBrowserNotifications: () => Promise<'granted' | 'denied' | 'unsupported'>;

  // Interventions & review
  acceptIntervention: (id: string) => void;
  dismissIntervention: (id: string) => void;
  generateReviewNow: () => void;
}

const CareerContext = createContext<CareerContextValue | undefined>(undefined);

const storageKey = (userId: string) => `${CAREER_STATE_PREFIX}${userId}`;

const loadState = (userId: string, profile: Parameters<typeof createInitialCareerState>[0]): CareerState => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as CareerState;
      if (parsed.schema === 1) {
        // Integrations never stay stuck in "syncing" after a reload.
        if (parsed.github.status === 'syncing') parsed.github.status = parsed.github.snapshot ? 'connected' : 'idle';
        if (parsed.leetcode.status === 'syncing') parsed.leetcode.status = parsed.leetcode.snapshot ? 'connected' : 'idle';
        // Saves from before progressive unlocking: grant what their activity already earned, quietly.
        if (!Array.isArray(parsed.unlockedTabs) || !Array.isArray(parsed.visitedTabs)) {
          parsed.unlockedTabs = [];
          parsed.visitedTabs = parsed.roadmap ? ['roadmap'] : [];
          applyUnlocks(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return createInitialCareerState(profile);
};

const loadTab = (): DashboardTab => {
  const preview = previewTab();
  if (preview) return preview;
  try {
    return (localStorage.getItem(DASHBOARD_TAB_KEY) as DashboardTab) || 'overview';
  } catch {
    return 'overview';
  }
};

export const CareerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useOnboarding();
  const profileRef = useRef(user);
  profileRef.current = user;

  const [state, setState] = useState<CareerState>(() => loadState(user.id, user));
  const [loadedFor, setLoadedFor] = useState(user.id);
  const [activeTab, setActiveTabState] = useState<DashboardTab>(loadTab);
  const [tick, setTick] = useState(0);

  // Switch state when the signed-in profile changes.
  if (loadedFor !== user.id) {
    setLoadedFor(user.id);
    setState(loadState(user.id, user));
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(loadedFor), JSON.stringify(state));
    } catch {
      // Quota or private mode — state remains in memory for this session.
    }
  }, [state, loadedFor]);

  const setActiveTab = useCallback((tab: DashboardTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(DASHBOARD_TAB_KEY, tab);
    } catch {
      // ignore
    }
  }, []);

  // Opening an unlocked feature counts as exploring it (some unlocks depend on this).
  useEffect(() => {
    setState(prev => {
      if (!prev.unlockedTabs.includes(activeTab) || prev.visitedTabs.includes(activeTab)) return prev;
      const draft = structuredClone(prev);
      draft.visitedTabs.push(activeTab);
      announceUnlocks(draft);
      return draft;
    });
  }, [activeTab, state.unlockedTabs]);

  // Every mutation goes through the pipeline so the twin, readiness and interventions stay in sync.
  const commit = useCallback((type: EventType, summary: string, mutate: Mutator) => {
    setState(prev => {
      const draft = structuredClone(prev);
      const now = new Date();
      mutate(draft, now);
      runPipeline(draft, profileRef.current, { type, summary }, now);
      return draft;
    });
  }, []);

  // Time-based reconciliation on load, every minute, and when the tab regains focus.
  useEffect(() => {
    const run = () => {
      setState(prev => {
        const draft = structuredClone(prev);
        const now = new Date();
        const summary = reconcile(draft, profileRef.current, now);
        if (!summary) return prev;
        runPipeline(draft, profileRef.current, { type: 'system.reconcile', summary }, now);
        return draft;
      });
      setTick(t => t + 1);
    };
    run();
    const interval = window.setInterval(run, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadedFor]);

  const twin = useMemo(
    () => buildCareerTwin(user, state, new Date()),
    // `tick` refreshes time-dependent metrics (streaks, consistency windows).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, state, tick]
  );

  // Keep the profile's Career Twin summary (synced to Supabase) in step with the live twin.
  const lastSyncedVersion = useRef(-1);
  useEffect(() => {
    if (lastSyncedVersion.current === state.twinVersion || !twin.calibrated) return;
    lastSyncedVersion.current = state.twinVersion;
    updateUser({
      careerTwin: {
        currentLevel: twin.stage,
        strengths: twin.strengths,
        weaknesses: twin.weaknesses,
        skillGaps: twin.gaps.filter(g => g.bucket === 'critical').map(g => g.skill),
        readinessScore: `${twin.readiness.score}`,
        consistencyScore: twin.behavioral.consistency7.score === null ? null : `${twin.behavioral.consistency7.score}`,
        status: 'ready',
        lastUpdated: state.twinUpdatedAt,
      },
    });
  }, [state.twinVersion, state.twinUpdatedAt, twin, updateUser]);

  // Browser notifications for new items (only while the app is open).
  const seenNotifications = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seenNotifications.current === null) {
      seenNotifications.current = new Set(state.notifications.map(n => n.id));
      return;
    }
    const fresh = state.notifications.filter(n => !seenNotifications.current?.has(n.id));
    fresh.forEach(n => seenNotifications.current?.add(n.id));
    if (!state.notificationPrefs.browser || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    fresh.slice(0, 3).forEach(n => {
      try {
        new Notification(n.title, { body: n.body, tag: n.dedupeKey });
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    });
  }, [state.notifications, state.notificationPrefs.browser]);

  // ---------- helpers ----------
  const withTask = (draft: CareerState, id: string, fn: (t: Task) => void) => {
    const t = draft.tasks.find(x => x.id === id);
    if (t) fn(t);
    return t;
  };

  const regenerateToday = (draft: CareerState, now: Date) => {
    const today = todayISO(now);
    // Drop today's untouched generated tasks so the new plan replaces them.
    draft.tasks = draft.tasks.filter(t => !(t.genKey?.startsWith(`${today}:`) && t.status === 'pending'));
    const keep = new Set(draft.tasks.map(t => t.genKey).filter(Boolean));
    const twinNow = buildCareerTwin(profileRef.current, draft, now);
    const fresh = generateDailyTasks(profileRef.current, { ...draft, tasks: draft.tasks.filter(t => !t.genKey?.startsWith(`${today}:`)) }, twinNow, today)
      .filter(t => !keep.has(t.genKey));
    draft.tasks.push(...fresh);
    return fresh.length;
  };

  const buildRoadmapInto = (draft: CareerState, now: Date, params?: { timeline?: string; dailyStudyTime?: string }) => {
    const twinNow = buildCareerTwin(profileRef.current, draft, now);
    const today = todayISO(now);
    draft.roadmap = generateRoadmap({
      profile: profileRef.current,
      state: draft,
      gaps: twinNow.gaps,
      dsaTopics: twinNow.coding.topics,
      timeline: params?.timeline,
      dailyStudyTime: params?.dailyStudyTime,
      now,
    });
    // Remove future, untouched tasks that belonged to the previous roadmap.
    draft.tasks = draft.tasks.filter(t => !(t.source === 'roadmap' && t.status === 'pending' && t.dueDate >= today));
    draft.weeklyGoals[weekStart(today)] = weeklyGoalTargets(profileRef.current, draft);
    regenerateToday(draft, now);
  };

  // ---------- actions ----------
  const value: CareerContextValue = {
    state,
    twin,
    activeTab,
    setActiveTab,

    generateTodayTasks: () => commit('task.created', "Today's tasks generated", (d, now) => {
      if (!d.roadmap) buildRoadmapInto(d, now);
      else regenerateToday(d, now);
    }),

    completeTask: id => {
      const task = state.tasks.find(t => t.id === id);
      commit('task.completed', `Completed "${task?.title || 'task'}"`, (d, now) => {
        withTask(d, id, t => {
          t.status = 'completed';
          t.completedAt = now.toISOString();
          if (t.projectId) {
            const p = d.projects.find(x => x.id === t.projectId);
            if (p) {
              p.updatedAt = now.toISOString();
              const m = p.milestones.find(x => x.id === t.projectMilestoneId);
              if (m && !m.completedAt) m.completedAt = now.toISOString();
              if (p.stage === 'idea' || p.stage === 'planning') p.stage = 'development';
            }
          }
        });
      });
    },

    startTask: id => commit('task.updated', 'Task started', (d, now) => {
      withTask(d, id, t => {
        t.status = 'in_progress';
        t.startedAt = now.toISOString();
      });
    }),

    skipTask: (id, reason) => {
      const task = state.tasks.find(t => t.id === id);
      commit('task.skipped', `Skipped "${task?.title || 'task'}"${reason ? ` (${reason})` : ''}`, d => {
        withTask(d, id, t => {
          t.status = 'skipped';
          t.skipReason = reason;
        });
      });
    },

    rescheduleTask: (id, date) => commit('task.updated', `Task rescheduled to ${date}`, d => {
      withTask(d, id, t => {
        t.dueDate = date;
        t.status = 'pending';
        t.rescheduledCount = (t.rescheduledCount || 0) + 1;
      });
    }),

    updateTask: (id, patch) => commit('task.updated', 'Task edited', d => {
      withTask(d, id, t => {
        Object.assign(t, patch);
        if (t.status === 'overdue' && t.dueDate >= todayISO()) t.status = 'pending';
      });
    }),

    addTask: fields => commit('task.created', `Added task "${fields.title}"`, d => {
      d.tasks.push(newTask({ ...fields, source: 'personal' }));
    }),

    deleteTask: id => commit('task.updated', 'Task removed', d => {
      d.tasks = d.tasks.filter(t => t.id !== id);
    }),

    generateDsaTasksForWeakTopics: () => commit('task.created', 'DSA practice planned for weak topics', (d, now) => {
      const today = todayISO(now);
      twin.coding.weakAreas.concat(twin.coding.topics.filter(t => t.score === null)).slice(0, 3).forEach((topic, i) => {
        const meta = DSA_TOPICS.find(t => t.key === topic.key);
        if (!meta) return;
        d.tasks.push(newTask({
          title: `Solve 2 ${meta.label} problems`,
          description: `Targeted practice for a weak topic. https://leetcode.com/tag/${meta.lcSlug}/`,
          category: 'dsa',
          priority: 'high',
          estMinutes: 40,
          dueDate: addDays(today, i),
          source: 'intervention',
          skill: 'DSA',
          topic: meta.key,
          problems: 2,
        }));
      });
    }),

    submitAssessment: (result, verifiedSkills) => {
      if (verifiedSkills) {
        // Update the ref now so the roadmap below is built from verified levels, not claims.
        profileRef.current = { ...profileRef.current, skills: verifiedSkills };
        updateUser({ skills: verifiedSkills });
      }
      commit('assessment.completed', `Assessment completed (${Math.round(
        (result.sectionScores.programming + result.sectionScores.dsa + result.sectionScores.core_cs + result.sectionScores.domain) / 4
      )}% average)`, (d, now) => {
        d.assessments.push(result);
        if (!d.roadmap) buildRoadmapInto(d, now);
      });
    },

    regenerateRoadmap: params => commit('roadmap.updated', 'Roadmap regenerated', (d, now) => buildRoadmapInto(d, now, params)),

    completeWeek: weekId => commit('roadmap.updated', 'Roadmap week completed', (d, now) => {
      if (!d.roadmap) return;
      setWeekStatus(d.roadmap, weekId, 'completed');
      regenerateToday(d, now);
    }),

    skipWeek: weekId => commit('roadmap.updated', 'Roadmap week skipped', (d, now) => {
      if (!d.roadmap) return;
      setWeekStatus(d.roadmap, weekId, 'skipped');
      regenerateToday(d, now);
    }),

    rescheduleWeek: weekId => commit('roadmap.updated', 'Roadmap week pushed back by one week', d => {
      if (d.roadmap) rescheduleWeekFn(d.roadmap, weekId);
    }),

    skipMilestone: milestoneId => commit('roadmap.updated', 'Roadmap milestone skipped', (d, now) => {
      if (!d.roadmap) return;
      skipMilestoneFn(d.roadmap, milestoneId);
      regenerateToday(d, now);
    }),

    moveMilestone: (milestoneId, direction) => commit('roadmap.updated', 'Roadmap reordered', (d, now) => {
      if (!d.roadmap) return;
      moveMilestoneFn(d.roadmap, milestoneId, direction);
      regenerateToday(d, now);
    }),

    syncGitHub: async username => {
      setState(prev => ({
        ...prev,
        github: { ...prev.github, username, status: 'syncing', lastAttemptAt: new Date().toISOString() },
      }));
      try {
        const snapshot = await fetchGitHub(username);
        commit('github.synced', `GitHub synced (${snapshot.repos.filter(r => !r.isFork).length} repos)`, (d, now) => {
          d.github = {
            username: snapshot.username,
            status: 'connected',
            snapshot,
            lastSuccessAt: now.toISOString(),
            lastAttemptAt: now.toISOString(),
          };
        });
      } catch (err) {
        const e = err instanceof SyncError ? err : new SyncError('upstream_error', 'Unable to sync.');
        setState(prev => ({
          ...prev,
          github: { ...prev.github, username, status: 'error', lastError: e.message, lastErrorCode: e.code },
        }));
      }
    },

    disconnectGitHub: () => commit('github.synced', 'GitHub disconnected', d => {
      d.github = { username: '', status: 'idle' };
    }),

    syncLeetCode: async username => {
      setState(prev => ({
        ...prev,
        leetcode: { ...prev.leetcode, username, status: 'syncing', lastAttemptAt: new Date().toISOString() },
      }));
      try {
        const snapshot = await fetchLeetCode(username);
        commit('leetcode.synced', `LeetCode synced (${snapshot.total} solved)`, (d, now) => {
          d.leetcode = {
            username: snapshot.username,
            status: 'connected',
            snapshot,
            lastSuccessAt: now.toISOString(),
            lastAttemptAt: now.toISOString(),
          };
          d.leetcodeHistory = [...d.leetcodeHistory.filter(h => h.date !== todayISO(now)), { date: todayISO(now), total: snapshot.total }];
        });
      } catch (err) {
        const e = err instanceof SyncError ? err : new SyncError('upstream_error', 'Unable to sync right now.');
        setState(prev => ({
          ...prev,
          leetcode: { ...prev.leetcode, username, status: 'error', lastError: e.message, lastErrorCode: e.code },
        }));
      }
    },

    saveManualLeetCode: (username, counts, tags) => {
      const snapshot = manualLeetCode(username, counts, tags);
      commit('leetcode.synced', `LeetCode stats entered manually (${snapshot.total} solved)`, (d, now) => {
        d.leetcode = {
          username: snapshot.username,
          status: 'connected',
          snapshot,
          lastSuccessAt: now.toISOString(),
          lastAttemptAt: now.toISOString(),
        };
        d.leetcodeHistory = [...d.leetcodeHistory.filter(h => h.date !== todayISO(now)), { date: todayISO(now), total: snapshot.total }];
      });
    },

    disconnectLeetCode: () => commit('leetcode.synced', 'LeetCode disconnected', d => {
      d.leetcode = { username: '', status: 'idle' };
    }),

    addProject: fields => {
      const id = uid('prj');
      commit('project.updated', `Project "${fields.title}" added`, (d, now) => {
        d.projects.push({
          id,
          description: '',
          techStack: [],
          stage: 'idea',
          repoUrl: '',
          deployUrl: '',
          startDate: todayISO(now),
          deadline: '',
          milestones: [],
          isRecommended: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          ...fields,
        });
      });
      return id;
    },

    updateProject: (id, patch) => commit('project.updated', 'Project updated', (d, now) => {
      const p = d.projects.find(x => x.id === id);
      if (p) Object.assign(p, patch, { updatedAt: now.toISOString() });
    }),

    deleteProject: id => commit('project.updated', 'Project removed', d => {
      d.projects = d.projects.filter(p => p.id !== id);
      d.tasks = d.tasks.filter(t => !(t.projectId === id && t.status === 'pending'));
    }),

    setProjectStage: (id, stage) => {
      const p = state.projects.find(x => x.id === id);
      commit('project.updated', `${p?.title || 'Project'} moved to ${stage}`, (d, now) => {
        const proj = d.projects.find(x => x.id === id);
        if (proj) {
          proj.stage = stage;
          proj.updatedAt = now.toISOString();
        }
      });
    },

    addProjectMilestone: (projectId, title, dueDate) => commit('project.updated', `Milestone "${title}" added`, (d, now) => {
      const p = d.projects.find(x => x.id === projectId);
      if (p) {
        p.milestones.push({ id: uid('pms'), title, dueDate });
        p.updatedAt = now.toISOString();
      }
    }),

    toggleProjectMilestone: (projectId, milestoneId) => commit('project.updated', 'Project milestone updated', (d, now) => {
      const p = d.projects.find(x => x.id === projectId);
      const m = p?.milestones.find(x => x.id === milestoneId);
      if (p && m) {
        m.completedAt = m.completedAt ? undefined : now.toISOString();
        p.updatedAt = now.toISOString();
        if (m.completedAt && (p.stage === 'idea' || p.stage === 'planning')) p.stage = 'development';
      }
    }),

    removeProjectMilestone: (projectId, milestoneId) => commit('project.updated', 'Project milestone removed', d => {
      const p = d.projects.find(x => x.id === projectId);
      if (p) p.milestones = p.milestones.filter(m => m.id !== milestoneId);
    }),

    createTaskFromMilestone: (projectId, milestoneId) => commit('task.created', 'Task created from project milestone', (d, now) => {
      const p = d.projects.find(x => x.id === projectId);
      const m = p?.milestones.find(x => x.id === milestoneId);
      if (!p || !m) return;
      d.tasks.push(newTask({
        title: `${p.title}: ${m.title}`,
        description: `Project milestone${m.dueDate ? ` due ${m.dueDate}` : ''}.`,
        category: 'project',
        priority: 'medium',
        estMinutes: 60,
        dueDate: todayISO(now),
        source: 'project',
        projectId: p.id,
        projectMilestoneId: m.id,
      }));
    }),

    adoptBlueprint: bp => commit('project.updated', `Adopted recommended project "${bp.name}"`, (d, now) => {
      const today = todayISO(now);
      let cursor = today;
      const milestones = bp.milestones.map(m => {
        cursor = addDays(cursor, m.weeks * 7);
        return { id: uid('pms'), title: m.title, dueDate: cursor };
      });
      d.projects.push({
        id: uid('prj'),
        title: bp.name,
        description: bp.problem,
        techStack: bp.stack,
        stage: 'planning',
        repoUrl: '',
        deployUrl: '',
        startDate: today,
        deadline: cursor,
        milestones,
        isRecommended: true,
        blueprint: bp,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }),

    addPortfolioItem: item => commit('portfolio.updated', `Portfolio: ${item.kind} added`, d => {
      d.portfolio.push({ ...item, id: uid('pf') });
    }),

    updatePortfolioItem: (id, patch) => commit('portfolio.updated', 'Portfolio item updated', d => {
      const item = d.portfolio.find(p => p.id === id);
      if (item) Object.assign(item, patch);
    }),

    removePortfolioItem: id => commit('portfolio.updated', 'Portfolio item removed', d => {
      d.portfolio = d.portfolio.filter(p => p.id !== id);
    }),

    startResource: resourceId => {
      const res = LEARNING_RESOURCES.find(r => r.id === resourceId);
      if (!res) return;
      commit('task.created', `Planned "${res.title}"`, (d, now) => {
        const dsaKey = res.skill.startsWith('DSA:') ? res.skill.slice(4) : undefined;
        d.tasks.push(newTask({
          title: `${res.type === 'practice' ? 'Practice' : 'Study'}: ${res.title}`,
          description: `${res.url}\n${res.provider} · ~${res.estMinutes} min total. Spend one focused session on it today.`,
          category: dsaKey ? 'dsa' : 'learning',
          priority: 'medium',
          estMinutes: Math.min(60, res.estMinutes),
          dueDate: todayISO(now),
          source: 'personal',
          skill: dsaKey ? 'DSA' : res.skill,
          topic: dsaKey,
          problems: dsaKey ? 2 : undefined,
        }));
      });
    },

    completeResource: resourceId => {
      const res = LEARNING_RESOURCES.find(r => r.id === resourceId);
      if (!res) return;
      commit('learning.completed', `Completed "${res.title}"`, (d, now) => {
        if (!d.completedResourceIds.includes(resourceId)) d.completedResourceIds.push(resourceId);
        d.learningLog.push({
          id: uid('learn'),
          skill: res.skill.startsWith('DSA:') ? 'DSA' : res.skill,
          minutes: Math.min(120, res.estMinutes),
          resourceId,
          note: res.title,
          date: todayISO(now),
        });
      });
    },

    logLearning: (skill, minutes, note) => commit('learning.completed', `Logged ${minutes} min of ${skill}`, (d, now) => {
      d.learningLog.push({ id: uid('learn'), skill, minutes, note, date: todayISO(now) });
    }),

    markNotificationRead: id => setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    })),

    markAllNotificationsRead: () => setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    })),

    setNotificationPrefs: prefs => setState(prev => ({ ...prev, notificationPrefs: prefs })),

    enableBrowserNotifications: async () => {
      if (typeof Notification === 'undefined') return 'unsupported';
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      const granted = permission === 'granted';
      setState(prev => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, browser: granted } }));
      return granted ? 'granted' : 'denied';
    },

    acceptIntervention: id => {
      const intervention = state.interventions.find(i => i.id === id);
      commit('intervention.resolved', `Accepted: ${intervention?.title || 'recommendation'}`, (d, now) => {
        const i = d.interventions.find(x => x.id === id);
        if (!i || i.status !== 'open') return;
        i.status = 'accepted';
        i.resolvedAt = now.toISOString();
        const today = todayISO(now);
        const change = i.change;
        if (change.kind === 'workload') {
          d.workloadMultiplier = change.multiplier;
          if (change.multiplier < 1 && d.focusSkills.length === 0) {
            const top = twin.gaps.find(g => g.bucket === 'critical');
            if (top) d.focusSkills = [top.skill];
          }
          d.weeklyGoals[weekStart(today)] = weeklyGoalTargets(profileRef.current, d);
          regenerateToday(d, now);
        } else if (change.kind === 'advance_week') {
          if (d.roadmap) setWeekStatus(d.roadmap, change.weekId, 'completed');
          regenerateToday(d, now);
        } else {
          if (change.kind === 'dsa_boost') {
            d.dsaBoostUntil = addDays(today, 4);
            d.notificationPrefs.enabled.task_reminder = true;
          }
          d.tasks.push(...interventionTasks(d, i, today));
        }
      });
    },

    dismissIntervention: id => commit('intervention.resolved', 'Recommendation dismissed', (d, now) => {
      const i = d.interventions.find(x => x.id === id);
      if (i && i.status === 'open') {
        i.status = 'dismissed';
        i.resolvedAt = now.toISOString();
      }
    }),

    generateReviewNow: () => commit('weekly_review.completed', 'Weekly review generated', (d, now) => {
      const week = weekStart(todayISO(now));
      const twinNow = buildCareerTwin(profileRef.current, d, now);
      const review = generateWeeklyReview(d, twinNow, week, now);
      applyReview(d, review);
      d.weeklyGoals[addDays(week, 7)] = weeklyGoalTargets(profileRef.current, d);
      notify(d, 'weekly_review', 'Your weekly CareerOS review is ready', `${review.metrics.completionRate}% of tasks completed so far this week.`, `review-now:${review.id}`, 'review', now);
    }),
  };

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};

export const useCareer = () => {
  const ctx = useContext(CareerContext);
  if (!ctx) throw new Error('useCareer must be used within a CareerProvider');
  return ctx;
};
