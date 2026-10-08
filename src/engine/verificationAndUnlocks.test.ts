import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../types/user';
import type { AssessmentResult } from './types';
import { createInitialCareerState, runPipeline } from './pipeline';
import { applyVerification, planVerification, scoreVerification, unverifiableSkills } from './skillVerification';
import { applyUnlocks, nextLockedStep } from './unlocks';
import { newTask } from './taskGeneration';
import { computeSkillStates } from './skillGap';
import { MAX_VERIFIED_SKILLS, VERIFICATION_BANK } from '../data/skillVerificationBank';

const profile = (skills: Partial<UserProfile['skills']> = {}): UserProfile => ({
  id: 'usr_test',
  fullName: 'Test Student',
  email: 'test@example.com',
  phone: '',
  role: 'student',
  createdAt: new Date().toISOString(),
  registrationSource: 'test',
  education: { degree: 'B.E.', branch: 'Computer Engineering', year: 'Third Year', semester: '5', college: 'Test College', graduationYear: '2027' },
  skills: { programming: [], web: [], database: [], aiMl: [], cloudDevOps: [], coreCS: [], ...skills },
  career: { interestedRoles: ['Backend Developer'], targetRole: 'Backend Developer', dreamCompany: '', goal: 'Campus Placement / Full-time', timeline: '6 months' },
  learningPreferences: { methods: ['Video tutorials'], dailyStudyTime: '2–3 hours', preferredStudyTime: 'Evening (Dedicated study block)', workingStyle: 'Mix of both', reminderPreference: 'Regular reminders' },
  careerTwin: { currentLevel: '', strengths: [], weaknesses: [], skillGaps: [], readinessScore: null, consistencyScore: null, status: 'ready', lastUpdated: '' },
});

const answersFor = (key: string, correctTiers: number) =>
  Object.fromEntries(VERIFICATION_BANK[key].map((q, i) => [q.id, i < correctTiers ? q.correct : (q.correct + 1) % q.options.length]));

const assessment = (extra: Partial<AssessmentResult> = {}): AssessmentResult => ({
  id: 'a1',
  completedAt: new Date().toISOString(),
  targetRole: 'Backend Developer',
  domain: 'backend',
  answers: [],
  sectionScores: { programming: 60, dsa: 40, core_cs: 60, domain: 60 },
  topicScores: {},
  communication: 50,
  ...extra,
});

describe('skill verification', () => {
  it('tests role-critical skills first, merges aliases, and caps the number of skills', () => {
    const p = profile({
      programming: ['Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript'].map(name => ({ name, category: 'programming', level: 'Beginner' as const })),
      database: [
        { name: 'PostgreSQL', category: 'database', level: 'Intermediate' },
        { name: 'MySQL', category: 'database', level: 'Advanced' },
      ],
    });
    const plan = planVerification(p);
    expect(plan).toHaveLength(MAX_VERIFIED_SKILLS);
    // PostgreSQL has the highest weight for Backend Developer; MySQL shares the SQL set and its higher claim.
    expect(plan[0].key).toBe('SQL');
    expect(plan[0].appliesTo).toEqual(['PostgreSQL', 'MySQL']);
    expect(plan[0].claimed).toBe('Advanced');
  });

  it('sets the verified level from correct answers and flags over- and under-claims', () => {
    const p = profile({
      programming: [
        { name: 'Python', category: 'programming', level: 'Advanced' },
        { name: 'Java', category: 'programming', level: 'Beginner' },
      ],
      coreCS: [{ name: 'DSA', category: 'coreCS', level: 'Intermediate' }],
    });
    const plan = planVerification(p);
    const checks = scoreVerification(plan, { ...answersFor('Python', 1), ...answersFor('Java', 3) }, p, 55);

    const py = checks.find(c => c.skill === 'Python');
    expect(py).toMatchObject({ claimed: 'Advanced', verified: 'Familiar', status: 'below', correct: 1, score: 33 });
    expect(checks.find(c => c.skill === 'Java')).toMatchObject({ claimed: 'Beginner', verified: 'Advanced', status: 'above' });
    // DSA is verified from the DSA section score.
    expect(checks.find(c => c.skill === 'DSA')).toMatchObject({ verified: 'Intermediate', status: 'verified' });
  });

  it('stores the verified level on the profile and uses it instead of the claim', () => {
    const p = profile({ programming: [{ name: 'Python', category: 'programming', level: 'Advanced' }] });
    const checks = scoreVerification(planVerification(p), answersFor('Python', 0), p, 0);
    const skills = applyVerification(p.skills, checks, '2026-10-08T00:00:00.000Z');
    expect(skills.programming[0]).toMatchObject({ level: 'Advanced', verifiedLevel: 'Beginner' });

    const verified = { ...p, skills };
    const state = createInitialCareerState(verified);
    state.assessments.push(assessment({ skillChecks: checks }));
    const claimedOnly = computeSkillStates(p, createInitialCareerState(p), null).find(s => s.skill === 'Python');
    const afterTest = computeSkillStates(verified, state, null).find(s => s.skill === 'Python');
    expect(afterTest?.evidence.quiz).toBe(0);
    expect(afterTest!.score).toBeLessThan(claimedOnly!.score);
  });

  it('reports declared skills the test cannot check', () => {
    const p = profile({ web: [{ name: 'Svelte', category: 'web', level: 'Advanced' }, { name: 'React', category: 'web', level: 'Familiar' }] });
    const checks = scoreVerification(planVerification(p), {}, p, 0);
    expect(unverifiableSkills(p, checks)).toEqual(['Svelte']);
  });
});

describe('progressive unlocks', () => {
  it('keeps everything locked until the test, then opens features one step at a time', () => {
    const p = profile();
    const state = createInitialCareerState(p);
    applyUnlocks(state);
    expect(state.unlockedTabs).toEqual([]);

    state.assessments.push(assessment());
    applyUnlocks(state);
    expect(state.unlockedTabs).toEqual(['overview', 'roadmap']);
    expect(nextLockedStep(state)?.tab).toBe('tasks');

    state.visitedTabs.push('roadmap');
    applyUnlocks(state);
    expect(state.unlockedTabs).toContain('tasks');
    expect(state.unlockedTabs).not.toContain('coding');

    const done = newTask({ title: 't', description: '', category: 'dsa', priority: 'medium', estMinutes: 30, dueDate: '2026-10-08', source: 'personal' });
    done.status = 'completed';
    done.completedAt = new Date().toISOString();
    state.tasks.push(done);
    applyUnlocks(state);
    expect(state.unlockedTabs).toContain('coding');
    expect(state.unlockedTabs).not.toContain('learning');
  });

  it('never re-locks a feature and announces new unlocks through the pipeline', () => {
    const p = profile();
    const state = createInitialCareerState(p);
    state.assessments.push(assessment());
    runPipeline(state, p, { type: 'assessment.completed', summary: 'test' });
    expect(state.unlockedTabs).toEqual(['overview', 'roadmap']);
    expect(state.notifications.some(n => n.dedupeKey === 'unlock:roadmap')).toBe(true);

    state.assessments = [];
    applyUnlocks(state);
    expect(state.unlockedTabs).toEqual(['overview', 'roadmap']);
  });

  it('opens the weekly review a week after the test', () => {
    const state = createInitialCareerState(profile());
    const taken = new Date('2026-10-01T10:00:00Z');
    state.assessments.push(assessment({ completedAt: taken.toISOString() }));
    applyUnlocks(state, new Date('2026-10-05T10:00:00Z'));
    expect(state.unlockedTabs).not.toContain('review');
    applyUnlocks(state, new Date('2026-10-08T10:00:00Z'));
    expect(state.unlockedTabs).toContain('review');
  });
});
