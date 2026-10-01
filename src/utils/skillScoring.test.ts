import { describe, it, expect } from 'vitest';
import {
  calculateSkillScore,
  calculateBatchSkillScores,
  getEffectiveWeights,
  normalizeSubScores,
  mapScoreToTier,
  BASE_WEIGHTS,
  type RawSkillInputs,
} from './skillScoring';

describe('Skill-Level Scoring Module', () => {
  describe('Weight Redistribution Math', () => {
    it('uses standard base weights when quiz_score is present', () => {
      const weights = getEffectiveWeights(true);
      expect(weights).toEqual(BASE_WEIGHTS);
      expect(weights.self_rating).toBe(0.20);
      expect(weights.quiz_score).toBe(0.45);
      expect(weights.project_count).toBe(0.25);
      expect(weights.cert_count).toBe(0.10);

      const sum = weights.self_rating + weights.quiz_score + weights.project_count + weights.cert_count;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('redistributes 0.45 quiz weight proportionally across other 3 when quiz_score is null, summing to 1.0', () => {
      const weights = getEffectiveWeights(false);

      expect(weights.quiz_score).toBe(0);

      // Base sum of non-quiz weights = 0.20 + 0.25 + 0.10 = 0.55
      // Expected proportional weights:
      // self_rating: 0.20 / 0.55 = 4/11 ≈ 0.363636...
      // project_count: 0.25 / 0.55 = 5/11 ≈ 0.454545...
      // cert_count: 0.10 / 0.55 = 2/11 ≈ 0.181818...
      expect(weights.self_rating).toBeCloseTo(4 / 11, 10);
      expect(weights.project_count).toBeCloseTo(5 / 11, 10);
      expect(weights.cert_count).toBeCloseTo(2 / 11, 10);

      const totalSum = weights.self_rating + weights.project_count + weights.cert_count;
      expect(totalSum).toBeCloseTo(1.0, 10);
      expect(Math.abs(totalSum - 1.0)).toBeLessThan(1e-12);
    });
  });

  describe('Sub-score Normalization', () => {
    it('normalizes self_rating from 1–5 to 0–100', () => {
      expect(normalizeSubScores({ self_rating: 1, quiz_score: 50, project_count: 0, cert_count: 0 }).self_rating).toBe(20);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 0 }).self_rating).toBe(60);
      expect(normalizeSubScores({ self_rating: 5, quiz_score: 50, project_count: 0, cert_count: 0 }).self_rating).toBe(100);
    });

    it('passes quiz_score through as-is when present, or returns null if skipped', () => {
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 82.5, project_count: 0, cert_count: 0 }).quiz_score).toBe(82.5);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: null, project_count: 0, cert_count: 0 }).quiz_score).toBeNull();
    });

    it('caps projects at 5 = 100 and scales linearly below', () => {
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 0 }).project_count).toBe(0);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 2, cert_count: 0 }).project_count).toBe(40);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 5, cert_count: 0 }).project_count).toBe(100);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 10, cert_count: 0 }).project_count).toBe(100);
    });

    it('caps certs at 3 = 100 and scales linearly below', () => {
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 0 }).cert_count).toBe(0);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 1 }).cert_count).toBe(33.33);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 3 }).cert_count).toBe(100);
      expect(normalizeSubScores({ self_rating: 3, quiz_score: 50, project_count: 0, cert_count: 7 }).cert_count).toBe(100);
    });
  });

  describe('Tier Mapping', () => {
    it('correctly maps scores to Beginner (0–40)', () => {
      expect(mapScoreToTier(0)).toBe('Beginner');
      expect(mapScoreToTier(25)).toBe('Beginner');
      expect(mapScoreToTier(40)).toBe('Beginner');
    });

    it('correctly maps scores to Intermediate (41–70)', () => {
      expect(mapScoreToTier(40.1)).toBe('Intermediate');
      expect(mapScoreToTier(41)).toBe('Intermediate');
      expect(mapScoreToTier(55)).toBe('Intermediate');
      expect(mapScoreToTier(70)).toBe('Intermediate');
    });

    it('correctly maps scores to Advanced (71–100)', () => {
      expect(mapScoreToTier(70.1)).toBe('Advanced');
      expect(mapScoreToTier(71)).toBe('Advanced');
      expect(mapScoreToTier(95)).toBe('Advanced');
      expect(mapScoreToTier(100)).toBe('Advanced');
    });
  });

  describe('Core Acceptance Criteria', () => {
    it('AC1: computes score with all inputs present', () => {
      const inputs: RawSkillInputs = {
        self_rating: 4, // sub-score = 80
        quiz_score: 90, // sub-score = 90
        project_count: 3, // sub-score = 60
        cert_count: 2, // sub-score = 66.67
      };

      const result = calculateSkillScore('TypeScript', inputs);

      // Math verification:
      // 80 * 0.20 = 16.0
      // 90 * 0.45 = 40.5
      // 60 * 0.25 = 15.0
      // (2/3 * 100) * 0.10 = 6.6666...
      // Expected = 16.0 + 40.5 + 15.0 + 6.6666... = 78.17 (Advanced)
      expect(result.skill).toBe('TypeScript');
      expect(result.raw_inputs).toEqual(inputs);
      expect(result.sub_scores.self_rating).toBe(80);
      expect(result.sub_scores.quiz_score).toBe(90);
      expect(result.sub_scores.project_count).toBe(60);
      expect(result.sub_scores.cert_count).toBe(66.67);
      expect(result.final_score).toBe(78.17);
      expect(result.tier).toBe('Advanced');
    });

    it('AC2: handles missing quiz_score (null) by redistributing weight proportionally', () => {
      const inputs: RawSkillInputs = {
        self_rating: 4, // sub-score: 80
        quiz_score: null, // skipped quiz
        project_count: 3, // sub-score: 60
        cert_count: 1, // sub-score: 33.33
      };

      const result = calculateSkillScore('Python', inputs);

      // Math verification with redistributed weights:
      // W_self = 4/11, W_proj = 5/11, W_cert = 2/11
      // Score = 80 * (4/11) + 60 * (5/11) + 33.333... * (2/11)
      //       = (320 + 300 + 66.666...) / 11
      //       = 686.666... / 11 = 62.42 (Intermediate)
      expect(result.skill).toBe('Python');
      expect(result.sub_scores.quiz_score).toBeNull();
      expect(result.final_score).toBe(62.42);
      expect(result.tier).toBe('Intermediate');
    });

    it('AC3: does NOT floor at 0 for a user with zero projects and zero certs when quiz and self-rating are high', () => {
      const inputs: RawSkillInputs = {
        self_rating: 5, // sub-score: 100
        quiz_score: 95, // sub-score: 95
        project_count: 0, // sub-score: 0
        cert_count: 0, // sub-score: 0
      };

      const result = calculateSkillScore('Algorithms', inputs);

      // Math verification:
      // 100 * 0.20 = 20.0
      // 95 * 0.45 = 42.75
      // 0 * 0.25 = 0
      // 0 * 0.10 = 0
      // Final = 62.75 -> Intermediate
      expect(result.final_score).toBe(62.75);
      expect(result.final_score).toBeGreaterThan(0);
      expect(result.tier).toBe('Intermediate');
    });

    it('AC4: is a pure function with no side effects or mutations', () => {
      const inputs: RawSkillInputs = {
        self_rating: 3,
        quiz_score: 75,
        project_count: 2,
        cert_count: 1,
      };

      const originalInputsClone = JSON.parse(JSON.stringify(inputs));

      const result1 = calculateSkillScore('React', inputs);
      const result2 = calculateSkillScore('React', inputs);

      // Verify idempotency and equality
      expect(result1).toEqual(result2);

      // Verify inputs object was not mutated
      expect(inputs).toEqual(originalInputsClone);
    });

    it('AC5: returns structured breakdown showing raw_inputs and sub_scores for explainability', () => {
      const inputs: RawSkillInputs = {
        self_rating: 2,
        quiz_score: 35,
        project_count: 1,
        cert_count: 0,
      };

      const result = calculateSkillScore('Docker', inputs);

      expect(result).toHaveProperty('skill', 'Docker');
      expect(result).toHaveProperty('raw_inputs');
      expect(result).toHaveProperty('sub_scores');
      expect(result).toHaveProperty('final_score');
      expect(result).toHaveProperty('tier', 'Beginner');

      // 40 * 0.20 + 35 * 0.45 + 20 * 0.25 + 0 = 8 + 15.75 + 5 = 28.75
      expect(result.final_score).toBe(28.75);
    });

    it('supports batch scoring multiple skills for a user profile', () => {
      const batchEntries = [
        { skill: 'React', inputs: { self_rating: 4, quiz_score: 85, project_count: 4, cert_count: 1 } },
        { skill: 'Docker', inputs: { self_rating: 2, quiz_score: null, project_count: 1, cert_count: 0 } },
      ];

      const results = calculateBatchSkillScores(batchEntries);
      expect(results).toHaveLength(2);
      expect(results[0].skill).toBe('React');
      expect(results[1].skill).toBe('Docker');
    });
  });
});
