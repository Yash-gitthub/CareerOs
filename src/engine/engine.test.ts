import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../types/user';
import type { AssessmentResult, CareerState } from './types';
import { createInitialCareerState, reconcile, runPipeline } from './pipeline';
import { buildCareerTwin } from './careerTwin';
import { READINESS_WEIGHTS } from './careerReadiness';
import { generateRoadmap, setWeekStatus } from './roadmap';
import { generateDailyTasks, newTask } from './taskGeneration';
import { detectInterventions } from './intervention';
import { addDays, today as todayISO } from './dates';

const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'usr_test',
  fullName: 'Test Student',
  email: 'test@example.com',
  phone: '',
  role: 'student',
  createdAt: new Date().toISOString(),
  registrationSource: 'test',
  education: { degree: 'B.E.', branch: 'Computer Engineering', year: 'Third Year', semester: '5', college: 'Test College', graduationYear: '2027' },
  skills: {
    programming: [{ name: 'Python', category: 'programming', level: 'Advanced' }],
    web: [], database: [], aiMl: [{ name: 'Machine Learning', category: 'aiMl', level: 'Familiar' }], cloudDevOps: [],
    coreCS: [{ name: 'DSA', category: 'coreCS', level: 'Intermediate' }],
  },
  career: { interestedRoles: ['AI / ML Engineer'], targetRole: 'AI / ML Engineer', dreamCompany: 'NVIDIA', goal: 'Campus Placement / Full-time', timeline: '6 months' },
  learningPreferences: { methods: ['Video tutorials'], dailyStudyTime: '2–3 hours', preferredStudyTime: 'Evening (Dedicated study block)', workingStyle: 'Mix of both', reminderPreference: 'Regular reminders' },
  careerTwin: { currentLevel: '', strengths: [], weaknesses: [], skillGaps: [], readinessScore: null, consistencyScore: null, status: 'ready', lastUpdated: '' },
  ...overrides,
});

const assessment = (dsa: number): AssessmentResult => ({
  id: 'a1',
  completedAt: new Date().toISOString(),
  targetRole: 'AI / ML Engineer',
  domain: 'aiml',
  answers: [],
  sectionScores: { programming: 80, dsa, core_cs: 60, domain: 40 },
  topicScores: { arrays: 100, graphs: 0, dp: 0, oop: 100 },
  communication: 50,
});

const fresh = (): CareerState => createInitialCareerState(profile());

describe('career readiness', () => {
  it('uses weights that sum to 100', () => {
    expect(Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('marks parts without evidence as not measured instead of inventing values', () => {
    const twin = buildCareerTwin(profile(), fresh());
    const byKey = Object.fromEntries(twin.readiness.components.map(c => [c.key, c.value]));
    expect(byKey.dsa).toBeNull();
    expect(byKey.coding_activity).toBeNull();
    expect(byKey.projects).toBeNull();
    expect(byKey.core_cs).toBeNull();
    expect(twin.calibrated).toBe(false);
  });

  it('rises when assessment evidence is added', () => {
    const state = fresh();
    const before = buildCareerTwin(profile(), state).readiness.score;
    state.assessments.push(assessment(80));
    const after = buildCareerTwin(profile(), state).readiness.score;
    expect(after).toBeGreaterThan(before);
  });
});

describe('skill gaps', () => {
  it('compares every role requirement and flags missing skills as critical', () => {
    const twin = buildCareerTwin(profile(), fresh());
    const rag = twin.gaps.find(g => g.skill === 'RAG');
    expect(rag?.bucket).toBe('critical');
    expect(twin.gaps.length).toBeGreaterThan(5);
    // sorted by priority
    expect(twin.gaps[0].priority).toBeGreaterThanOrEqual(twin.gaps[twin.gaps.length - 1].priority);
  });

  it('identifies weak DSA topics from assessment + LeetCode tags', () => {
    const state = fresh();
    state.assessments.push(assessment(50));
    state.leetcode.snapshot = {
      username: 'x', easy: 40, medium: 10, hard: 0, total: 50,
      tagCounts: { Array: 34, Graph: 2, 'Dynamic Programming': 1 },
      contestRating: null, contestsAttended: null, submissionsByDate: {}, source: 'manual', syncedAt: new Date().toISOString(),
    };
    const twin = buildCareerTwin(profile(), state);
    const score = (key: string) => twin.coding.topics.find(t => t.key === key)?.score ?? -1;
    expect(score('arrays')).toBeGreaterThan(80);
    expect(score('graphs')).toBeLessThan(25);
    expect(score('dp')).toBeLessThan(25);
    expect(twin.coding.weakAreas.map(w => w.key)).not.toContain('arrays');
  });
});

describe('roadmap', () => {
  it('builds milestones from gaps with exactly one active week', () => {
    const state = fresh();
    const twin = buildCareerTwin(profile(), state);
    const roadmap = generateRoadmap({ profile: profile(), state, gaps: twin.gaps, dsaTopics: twin.coding.topics });
    expect(roadmap.milestones.length).toBeGreaterThan(1);
    const active = roadmap.milestones.flatMap(m => m.weeks).filter(w => w.status === 'active');
    expect(active).toHaveLength(1);
    expect(roadmap.milestones.some(m => m.title.includes('NVIDIA'))).toBe(true);
  });

  it('activates the next week when one is completed', () => {
    const state = fresh();
    const twin = buildCareerTwin(profile(), state);
    const roadmap = generateRoadmap({ profile: profile(), state, gaps: twin.gaps, dsaTopics: twin.coding.topics });
    const first = roadmap.milestones[0].weeks[0];
    setWeekStatus(roadmap, first.id, 'completed');
    const weeks = roadmap.milestones.flatMap(m => m.weeks);
    expect(weeks[0].status).toBe('completed');
    expect(weeks[1].status).toBe('active');
  });
});

describe('daily task generation', () => {
  it('creates tasks within budget and is idempotent per day', () => {
    const state = fresh();
    const twin = buildCareerTwin(profile(), state);
    state.roadmap = generateRoadmap({ profile: profile(), state, gaps: twin.gaps, dsaTopics: twin.coding.topics });
    const today = todayISO();
    const first = generateDailyTasks(profile(), state, buildCareerTwin(profile(), state), today);
    expect(first.length).toBeGreaterThan(0);
    expect(first.some(t => t.category === 'dsa')).toBe(true);
    expect(first.every(t => t.dueDate === today && t.genKey?.startsWith(today))).toBe(true);
    state.tasks.push(...first);
    expect(generateDailyTasks(profile(), state, buildCareerTwin(profile(), state), today)).toHaveLength(0);
  });
});

describe('feedback loop', () => {
  it('records a readiness snapshot and twin version when an event changes the score', () => {
    const state = fresh();
    runPipeline(state, profile(), { type: 'system.reconcile', summary: 'init' });
    const v = state.twinVersion;
    state.assessments.push(assessment(90));
    runPipeline(state, profile(), { type: 'assessment.completed', summary: 'Assessment completed' });
    expect(state.twinVersion).toBe(v + 1);
    expect(state.readinessHistory.at(-1)?.reason).toBe('Assessment completed');
    expect(state.notifications.some(n => n.type === 'twin_update')).toBe(true);
  });

  it('marks past-due tasks as overdue on reconcile', () => {
    const state = fresh();
    state.tasks.push(newTask({ title: 'Old task', category: 'dsa', dueDate: addDays(todayISO(), -2) }));
    reconcile(state, profile());
    expect(state.tasks[0].status).toBe('overdue');
  });

  it('proposes a lighter workload when most planned tasks are missed', () => {
    const state = fresh();
    for (let i = 1; i <= 6; i++) {
      const t = newTask({ title: `Task ${i}`, category: 'learning', dueDate: addDays(todayISO(), -i) });
      t.status = i === 1 ? 'completed' : 'overdue';
      if (i === 1) t.completedAt = new Date().toISOString();
      state.tasks.push(t);
    }
    const found = detectInterventions(profile(), state, buildCareerTwin(profile(), state));
    const overload = found.find(i => i.rule === 'overload');
    expect(overload).toBeDefined();
    expect(overload?.change.kind).toBe('workload');
  });
});
