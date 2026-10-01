/**
 * AI CareerOS - Skill-Level Scoring Module
 *
 * Computes a normalized 0–100 score and tier for a user's declared skill based
 * on 4 signal inputs: self-rating, diagnostic quiz score, project count, and
 * certification count.
 */

export type SkillTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface RawSkillInputs {
  self_rating: number; // 1–5 scale
  quiz_score: number | null; // 0–100 scale, or null if skipped
  project_count: number; // Count of linked projects
  cert_count: number; // Count of verified certifications
}

export interface SkillSubScores {
  self_rating: number; // 0–100
  quiz_score: number | null; // 0–100 or null
  project_count: number; // 0–100 (capped at 5 projects = 100)
  cert_count: number; // 0–100 (capped at 3 certs = 100)
}

export interface SkillScoreResult {
  skill: string;
  raw_inputs: RawSkillInputs;
  sub_scores: SkillSubScores;
  final_score: number;
  tier: SkillTier;
}

export interface EffectiveWeights {
  self_rating: number;
  quiz_score: number;
  project_count: number;
  cert_count: number;
}

export const BASE_WEIGHTS: Readonly<EffectiveWeights> = Object.freeze({
  self_rating: 0.20,
  quiz_score: 0.45,
  project_count: 0.25,
  cert_count: 0.10,
});

/**
 * Computes the effective weights for scoring.
 * If quiz_score is absent (null/undefined), its 0.45 weight is redistributed
 * proportionally across self_rating, project_count, and cert_count so the sum
 * always equals exactly 1.0.
 */
export function getEffectiveWeights(hasQuizScore: boolean): EffectiveWeights {
  if (hasQuizScore) {
    return { ...BASE_WEIGHTS };
  }

  const remainingBaseSum =
    BASE_WEIGHTS.self_rating +
    BASE_WEIGHTS.project_count +
    BASE_WEIGHTS.cert_count; // 0.20 + 0.25 + 0.10 = 0.55

  return {
    self_rating: BASE_WEIGHTS.self_rating / remainingBaseSum, // 0.20 / 0.55 = 4/11 (~0.3636)
    quiz_score: 0,
    project_count: BASE_WEIGHTS.project_count / remainingBaseSum, // 0.25 / 0.55 = 5/11 (~0.4545)
    cert_count: BASE_WEIGHTS.cert_count / remainingBaseSum, // 0.10 / 0.55 = 2/11 (~0.1818)
  };
}

/**
 * Normalizes raw skill signals into 0–100 sub-scores.
 *
 * Rules:
 * - self_rating: (rating / 5) * 100 (clamped 0–5)
 * - quiz_score: 0–100 as-is (null if skipped)
 * - project_count: capped at 5 projects = 100 (linear scaling below)
 * - cert_count: capped at 3 certs = 100 (linear scaling below)
 */
export function normalizeSubScores(inputs: RawSkillInputs): SkillSubScores {
  // Clamp self_rating to [0, 5]
  const clampedSelfRating = Math.max(0, Math.min(5, inputs.self_rating));
  const selfRatingSub = (clampedSelfRating / 5) * 100;

  // Quiz score: clamped to [0, 100] if non-null
  let quizSub: number | null = null;
  if (inputs.quiz_score !== null && inputs.quiz_score !== undefined && !Number.isNaN(inputs.quiz_score)) {
    quizSub = Math.max(0, Math.min(100, inputs.quiz_score));
  }

  // Project count: capped at 5 -> (count / 5) * 100
  const clampedProjectCount = Math.max(0, inputs.project_count);
  const projectSub = Math.min(100, (clampedProjectCount / 5) * 100);

  // Cert count: capped at 3 -> (count / 3) * 100
  const clampedCertCount = Math.max(0, inputs.cert_count);
  const certSub = Math.min(100, (clampedCertCount / 3) * 100);

  return {
    self_rating: roundTo(selfRatingSub, 2),
    quiz_score: quizSub !== null ? roundTo(quizSub, 2) : null,
    project_count: roundTo(projectSub, 2),
    cert_count: roundTo(certSub, 2),
  };
}

/**
 * Maps a 0–100 score to a proficiency tier:
 * - 0–40: Beginner
 * - 41–70: Intermediate
 * - 71–100: Advanced
 */
export function mapScoreToTier(score: number): SkillTier {
  if (score <= 40) {
    return 'Beginner';
  }
  if (score <= 70) {
    return 'Intermediate';
  }
  return 'Advanced';
}

/**
 * Pure function to compute a single skill's score and tier.
 *
 * @param skill - Name of the skill (e.g. 'React', 'Python', 'PostgreSQL')
 * @param inputs - Raw signals (self_rating, quiz_score, project_count, cert_count)
 * @returns Structured result with skill, raw_inputs, sub_scores, final_score, and tier
 */
export function calculateSkillScore(skill: string, inputs: RawSkillInputs): SkillScoreResult {
  const subScores = normalizeSubScores(inputs);
  const hasQuiz = subScores.quiz_score !== null;
  const weights = getEffectiveWeights(hasQuiz);

  let rawWeightedScore =
    subScores.self_rating * weights.self_rating +
    subScores.project_count * weights.project_count +
    subScores.cert_count * weights.cert_count;

  if (hasQuiz && subScores.quiz_score !== null) {
    rawWeightedScore += subScores.quiz_score * weights.quiz_score;
  }

  // Clamp final score between 0 and 100 and round to 2 decimal places
  const finalScore = roundTo(Math.max(0, Math.min(100, rawWeightedScore)), 2);
  const tier = mapScoreToTier(finalScore);

  return {
    skill,
    raw_inputs: {
      self_rating: inputs.self_rating,
      quiz_score: inputs.quiz_score ?? null,
      project_count: inputs.project_count,
      cert_count: inputs.cert_count,
    },
    sub_scores: subScores,
    final_score: finalScore,
    tier,
  };
}

/**
 * Batch processes multiple skills for a user profile.
 */
export function calculateBatchSkillScores(
  skillEntries: Array<{ skill: string; inputs: RawSkillInputs }>
): SkillScoreResult[] {
  return skillEntries.map((entry) => calculateSkillScore(entry.skill, entry.inputs));
}

/**
 * Utility to round numbers cleanly to specified decimal places.
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
