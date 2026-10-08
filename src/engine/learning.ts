import type { UserProfile } from '../types/user';
import type { CareerState } from './types';
import type { CareerTwin } from './careerTwin';
import type { LearningResource, Difficulty } from '../data/learningResources';
import { LEARNING_RESOURCES, METHOD_TO_TYPES } from '../data/learningResources';
import { DSA_TOPICS } from './roleRequirements';

export interface RankedResource {
  resource: LearningResource;
  score: number;
  reason: string;
  relatedSkill: string;
  relatedMilestone: string | null;
  completed: boolean;
}

const difficultyFor = (score: number): Difficulty => (score < 40 ? 'beginner' : score < 70 ? 'intermediate' : 'advanced');
const DIFF_RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export const rankResources = (profile: UserProfile, state: CareerState, twin: CareerTwin): RankedResource[] => {
  const preferredTypes = new Set((profile.learningPreferences.methods || []).flatMap(m => METHOD_TO_TYPES[m] || []));
  const gapBySkill = new Map(twin.gaps.map(g => [g.skill.toLowerCase(), g]));
  const skillScore = new Map(twin.skills.map(s => [s.skill.toLowerCase(), s.score]));
  const milestones = state.roadmap?.milestones || [];

  return LEARNING_RESOURCES.map(resource => {
    let relatedSkill = resource.skill;
    let need = 0;
    let reason = '';
    let level = 50;

    if (resource.skill.startsWith('DSA:')) {
      const key = resource.skill.slice(4);
      const topic = twin.coding.topics.find(t => t.key === key);
      const label = DSA_TOPICS.find(t => t.key === key)?.label || key;
      relatedSkill = `DSA · ${label}`;
      level = topic?.score ?? 30;
      const isWeak = twin.coding.weakAreas.some(w => w.key === key) || state.focusTopics.includes(key);
      need = topic?.score === null || topic === undefined ? 25 : Math.max(0, 70 - (topic.score || 0));
      if (isWeak) need += 25;
      reason = topic && topic.score !== null
        ? `${label} is at ${Math.round(topic.score)}/100${isWeak ? ' — one of your weakest DSA topics' : ''}.`
        : `${label} hasn't been measured yet — practice builds evidence.`;
    } else {
      const gap = gapBySkill.get(resource.skill.toLowerCase());
      level = skillScore.get(resource.skill.toLowerCase()) ?? 0;
      if (gap) {
        need = Math.max(0, gap.gap) * gap.weight + (gap.bucket === 'critical' ? 20 : 0);
        reason = gap.bucket === 'strong'
          ? `${gap.skill} already meets the bar (${Math.round(gap.current)}/${gap.required}) — useful for going deeper.`
          : `${gap.bucket === 'critical' ? 'Critical gap' : 'Developing skill'}: ${gap.skill} is ${Math.round(gap.current)} vs. ${gap.required} required for ${twin.career.targetRole}.`;
      } else if (state.focusSkills.some(s => s.toLowerCase() === resource.skill.toLowerCase())) {
        need = 30;
        reason = `${resource.skill} is a focus area from your weekly review.`;
      } else if (skillScore.has(resource.skill.toLowerCase())) {
        need = 5;
        reason = `You listed ${resource.skill}; this strengthens it (not required for your target role).`;
      } else {
        need = 0;
        reason = `Not part of your target role requirements.`;
      }
    }

    const milestone = milestones.find(m =>
      m.status !== 'completed' && m.status !== 'skipped' &&
      (m.skill.toLowerCase() === resource.skill.toLowerCase() || (resource.skill.startsWith('DSA') && m.skill === 'DSA'))
    );
    if (milestone) need += milestone.status === 'active' ? 20 : 8;

    const formatBonus = preferredTypes.has(resource.type) ? 10 : 0;
    const diffPenalty = Math.abs(DIFF_RANK[resource.difficulty] - DIFF_RANK[difficultyFor(level)]) * 8;
    const completed = state.completedResourceIds.includes(resource.id);

    return {
      resource,
      score: need + formatBonus - diffPenalty - (completed ? 100 : 0),
      reason: formatBonus ? `${reason} Matches your preferred learning style.` : reason,
      relatedSkill,
      relatedMilestone: milestone ? milestone.title : null,
      completed,
    };
  }).sort((a, b) => b.score - a.score);
};
