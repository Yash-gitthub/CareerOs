import type { UserProfile, SkillProficiency, SelectedSkill } from '../types/user';
import type { SkillTier } from '../utils/skillScoring';
import { calculateSkillScore } from '../utils/skillScoring';
import type { AssessmentResult, CareerState } from './types';
import { DSA_TOPICS, CORE_CS_TOPICS, getRoleRequirements } from './roleRequirements';
import { clamp, round1 } from './dates';

export interface SkillState {
  skill: string;
  category: string;
  score: number;
  tier: SkillTier;
  declaredLevel?: SkillProficiency;
  evidence: { selfRating: number; quiz: number | null; projects: number; certs: number };
}

export interface SkillGapItem {
  skill: string;
  required: number;
  current: number;
  gap: number;
  weight: number;
  bucket: 'strong' | 'developing' | 'critical';
  priority: number;
}

export interface DsaTopicScore {
  key: string;
  label: string;
  score: number | null;
  solved: number;
  practiced: number;
  target: number;
  assessment: number | null;
}

const LEVEL_RATING: Record<SkillProficiency, number> = {
  Beginner: 1.5,
  Familiar: 2.5,
  Intermediate: 3.5,
  Advanced: 4.5,
};

const LANGUAGES = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Kotlin', 'Go', 'Rust', 'Swift', 'C#', 'PHP'];

// GitHub "primary language" values that indicate a skill other than their literal name.
const GITHUB_LANGUAGE_ALIASES: Record<string, string> = {
  'Jupyter Notebook': 'Python',
  Dockerfile: 'Docker',
  HCL: 'Terraform',
  Shell: 'Linux',
};

export const latestAssessment = (state: CareerState): AssessmentResult | null =>
  state.assessments.length ? state.assessments[state.assessments.length - 1] : null;

const norm = (s: string) => s.trim().toLowerCase();

export const declaredSkills = (profile: UserProfile) => {
  const map = new Map<string, { name: string; category: string; level?: SkillProficiency; verifiedLevel?: SkillProficiency }>();
  (Object.entries(profile.skills || {}) as [string, SelectedSkill[]][]).forEach(([category, list]) => {
    (list || []).forEach(s => map.set(norm(s.name), { name: s.name, category, level: s.level, verifiedLevel: s.verifiedLevel }));
  });
  return map;
};

// ---------- DSA ----------

export const leetcodeProgress = (state: CareerState): number | null => {
  const lc = state.leetcode.snapshot;
  if (!lc) return null;
  return clamp(((lc.easy + 2.5 * lc.medium + 5 * lc.hard) / 300) * 100);
};

export const computeDsaTopics = (state: CareerState): DsaTopicScore[] => {
  const assessment = latestAssessment(state);
  const lc = state.leetcode.snapshot;

  return DSA_TOPICS.map(topic => {
    const solved = lc ? Math.max(0, ...topic.lcTags.map(t => lc.tagCounts[t] || 0)) : 0;
    const practiced = state.tasks
      .filter(t => t.status === 'completed' && t.category === 'dsa' && t.topic === topic.key)
      .reduce((sum, t) => sum + (t.problems || 1), 0);
    const assessmentScore = assessment && topic.key in assessment.topicScores ? assessment.topicScores[topic.key] : null;

    const hasPractice = Boolean(lc) || practiced > 0;
    const coverage = clamp(((solved + practiced) / topic.target) * 100);

    let score: number | null = null;
    if (hasPractice && assessmentScore !== null) score = 0.7 * coverage + 0.3 * assessmentScore;
    else if (hasPractice) score = coverage;
    // One assessment question shows understanding, not practice: cap it at 60 until problems are solved.
    else if (assessmentScore !== null) score = 0.6 * assessmentScore;

    return {
      key: topic.key,
      label: topic.label,
      score: score === null ? null : round1(score),
      solved,
      practiced,
      target: topic.target,
      assessment: assessmentScore,
    };
  });
};

export const computeDsaScore = (state: CareerState, topics: DsaTopicScore[]): number | null => {
  const assessment = latestAssessment(state);
  const parts: number[] = [];
  if (assessment) parts.push(assessment.sectionScores.dsa);
  const lc = leetcodeProgress(state);
  if (lc !== null) parts.push(lc);
  if (!parts.length) {
    const scored = topics.filter(t => t.score !== null && t.practiced > 0);
    if (scored.length) parts.push(scored.reduce((s, t) => s + (t.score || 0), 0) / DSA_TOPICS.length);
  }
  return parts.length ? round1(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
};

// ---------- Skill states ----------

const quizEvidence = (
  skill: string,
  assessment: AssessmentResult | null,
  declared: boolean,
  dsaScore: number | null
): number | null => {
  if (skill === 'DSA') return dsaScore;
  if (!assessment) return null;

  // A tiered skill-verification set measures this exact skill, so it beats indirect evidence.
  const check = assessment.skillChecks?.find(c => c.appliesTo.some(n => norm(n) === norm(skill)));
  if (check) return check.score;

  const core = CORE_CS_TOPICS.find(t => t.skill === skill);
  if (core && core.key in assessment.topicScores) return assessment.topicScores[core.key];

  const domainAnswers = assessment.answers.filter(a => a.section === 'domain' && a.topic === skill);
  if (domainAnswers.length) {
    return (domainAnswers.filter(a => a.correct).length / domainAnswers.length) * 100;
  }

  if (declared && LANGUAGES.includes(skill)) return assessment.sectionScores.programming;
  return null;
};

export const computeSkillStates = (profile: UserProfile, state: CareerState, dsaScore: number | null): SkillState[] => {
  const declared = declaredSkills(profile);
  const assessment = latestAssessment(state);
  const requirements = getRoleRequirements(profile.career.targetRole);

  const universe = new Map<string, string>(); // skill -> category
  declared.forEach(d => universe.set(d.name, d.category));
  requirements.forEach(r => {
    if (!declared.has(norm(r.skill))) universe.set(r.skill, 'required');
  });
  if (!declared.has('dsa')) universe.set('DSA', universe.get('DSA') || 'coreCS');

  const repos = (state.github.snapshot?.repos || []).filter(r => !r.isFork);
  const certs = state.portfolio.filter(p => p.kind === 'certification');

  return Array.from(universe.entries()).map(([skill, category]) => {
    const d = declared.get(norm(skill));
    // Once the test has measured a skill, the verified level replaces the student's own claim.
    const rated = d?.verifiedLevel || d?.level;
    const selfRating = rated ? LEVEL_RATING[rated] : d ? LEVEL_RATING.Familiar : 0;

    const projectCount =
      state.projects.filter(p => p.techStack.some(t => norm(t) === norm(skill))).length +
      repos.filter(r => {
        const lang = r.language ? GITHUB_LANGUAGE_ALIASES[r.language] || r.language : '';
        return norm(lang) === norm(skill) || r.topics.some(t => norm(t) === norm(skill).replace(/\s+/g, '-'));
      }).length;

    const certCount = certs.filter(c => `${c.title} ${c.detail}`.toLowerCase().includes(norm(skill))).length;
    const quiz = quizEvidence(skill, assessment, Boolean(d), dsaScore);

    const result = calculateSkillScore(skill, {
      self_rating: selfRating,
      quiz_score: quiz,
      project_count: projectCount,
      cert_count: certCount,
    });

    return {
      skill,
      category,
      score: result.final_score,
      tier: result.tier,
      declaredLevel: d?.level,
      evidence: { selfRating, quiz, projects: projectCount, certs: certCount },
    };
  });
};

// ---------- Gaps ----------

export const computeSkillGaps = (profile: UserProfile, skills: SkillState[]): SkillGapItem[] => {
  const byName = new Map(skills.map(s => [norm(s.skill), s]));
  return getRoleRequirements(profile.career.targetRole)
    .map(req => {
      const current = byName.get(norm(req.skill))?.score ?? 0;
      const gap = round1(req.required - current);
      const bucket: SkillGapItem['bucket'] = gap <= 0 ? 'strong' : gap <= 30 ? 'developing' : 'critical';
      return {
        skill: req.skill,
        required: req.required,
        current: round1(current),
        gap,
        weight: req.weight,
        bucket,
        priority: round1(Math.max(gap, 0) * req.weight),
      };
    })
    .sort((a, b) => b.priority - a.priority);
};

// Weak DSA topics ordered weakest first (unmeasured topics come last).
export const weakDsaTopics = (topics: DsaTopicScore[], limit = 3) =>
  [...topics]
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
    .slice(0, limit);
