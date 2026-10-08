import type { SelectedSkill, SkillProficiency, UserProfile } from '../types/user';
import type { SkillCheck } from './types';
import type { VerificationQuestion } from '../data/skillVerificationBank';
import {
  MAX_VERIFIED_SKILLS, VERIFICATION_BANK, levelFromCorrect, levelFromPercent, levelRank, verificationKey,
} from '../data/skillVerificationBank';
import { getRoleRequirements } from './roleRequirements';

export interface VerificationPlanItem {
  key: string;
  appliesTo: string[]; // profile skill names verified by this question set
  claimed: SkillProficiency;
  questions: VerificationQuestion[];
}

const allDeclared = (profile: UserProfile): SelectedSkill[] =>
  Object.values(profile.skills || {}).flat();

const claimedLevel = (s: SelectedSkill): SkillProficiency => s.level || 'Familiar';

// Picks which declared skills to test: role-critical skills first, then the highest claims
// (an "Advanced" claim matters more to verify than a "Beginner" one).
export const planVerification = (profile: UserProfile): VerificationPlanItem[] => {
  const weights = new Map(getRoleRequirements(profile.career.targetRole).map(r => [r.skill.toLowerCase(), r.weight]));
  const byKey = new Map<string, { appliesTo: string[]; claimed: SkillProficiency; weight: number }>();

  allDeclared(profile).forEach(s => {
    const key = verificationKey(s.name);
    if (!key) return;
    const weight = Math.max(weights.get(s.name.toLowerCase()) ?? 0, weights.get(key.toLowerCase()) ?? 0);
    const existing = byKey.get(key);
    if (existing) {
      existing.appliesTo.push(s.name);
      if (levelRank(claimedLevel(s)) > levelRank(existing.claimed)) existing.claimed = claimedLevel(s);
      existing.weight = Math.max(existing.weight, weight);
    } else {
      byKey.set(key, { appliesTo: [s.name], claimed: claimedLevel(s), weight });
    }
  });

  return [...byKey.entries()]
    .sort(([, a], [, b]) => b.weight - a.weight || levelRank(b.claimed) - levelRank(a.claimed))
    .slice(0, MAX_VERIFIED_SKILLS)
    .map(([key, v]) => ({ key, appliesTo: v.appliesTo, claimed: v.claimed, questions: VERIFICATION_BANK[key] }));
};

const statusOf = (claimed: SkillProficiency, verified: SkillProficiency): SkillCheck['status'] => {
  const diff = levelRank(verified) - levelRank(claimed);
  return diff > 0 ? 'above' : diff < 0 ? 'below' : 'verified';
};

export const scoreVerification = (
  plan: VerificationPlanItem[],
  answers: Record<string, number>,
  profile: UserProfile,
  dsaSectionScore: number
): SkillCheck[] => {
  const checks: SkillCheck[] = plan.map(item => {
    const correct = item.questions.filter(q => answers[q.id] === q.correct).length;
    const verified = levelFromCorrect(correct);
    return {
      skill: item.key,
      appliesTo: item.appliesTo,
      claimed: item.claimed,
      verified,
      correct,
      total: item.questions.length,
      score: Math.round((correct / item.questions.length) * 100),
      status: statusOf(item.claimed, verified),
    };
  });

  const dsa = allDeclared(profile).find(s => s.name.toLowerCase() === 'dsa');
  if (dsa) {
    const verified = levelFromPercent(dsaSectionScore);
    checks.push({
      skill: 'DSA',
      appliesTo: [dsa.name],
      claimed: claimedLevel(dsa),
      verified,
      correct: null,
      total: null,
      score: dsaSectionScore,
      status: statusOf(claimedLevel(dsa), verified),
    });
  }
  return checks;
};

// Writes the verified level next to the claimed one; the claim itself is kept for the record.
export const applyVerification = (skills: UserProfile['skills'], checks: SkillCheck[], at: string): UserProfile['skills'] => {
  const verifiedFor = new Map<string, SkillProficiency>();
  checks.forEach(c => c.appliesTo.forEach(name => verifiedFor.set(name.toLowerCase(), c.verified)));

  const next = { ...skills };
  (Object.keys(next) as (keyof UserProfile['skills'])[]).forEach(cat => {
    next[cat] = (next[cat] || []).map(s => {
      const verifiedLevel = verifiedFor.get(s.name.toLowerCase());
      return verifiedLevel ? { ...s, verifiedLevel, verifiedAt: at } : s;
    });
  });
  return next;
};

// Declared skills the test can't check (no question set) — verified later through projects and GitHub.
export const unverifiableSkills = (profile: UserProfile, checks: SkillCheck[]): string[] => {
  const covered = new Set(checks.flatMap(c => c.appliesTo.map(n => n.toLowerCase())));
  return allDeclared(profile).map(s => s.name).filter(n => !covered.has(n.toLowerCase()));
};
