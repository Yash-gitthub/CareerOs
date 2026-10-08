import type { UserProfile } from '../types/user';
import type { CareerState } from './types';
import type { CareerTwin } from './careerTwin';
import { portfolioChecks } from './careerReadiness';

export interface PortfolioFinding {
  severity: 'info' | 'warning' | 'strength';
  title: string;
  detail: string;
}

export interface PortfolioAnalysis {
  score: number;
  missing: string[];
  findings: PortfolioFinding[];
  current: { crud: number; ai: number; realtime: number; deployed: number; total: number };
  missingCategories: string[];
}

const CRUD_RE = /\b(crud|todo|to-do|blog|notes?|library management|management system|inventory|clone|portfolio website|calculator|weather app)\b/i;
const AI_RE = /\b(ml|machine learning|ai|llm|gpt|rag|model|neural|classifier|nlp|vision|pytorch|tensorflow|scikit)\b/i;
const REALTIME_RE = /\b(real-?time|websocket|socket\.io|streaming|kafka|live|chat|webrtc|pub\/?sub)\b/i;
const METRIC_RE = /\d/;

export const analyzePortfolio = (profile: UserProfile, state: CareerState, twin: CareerTwin): PortfolioAnalysis => {
  const checks = portfolioChecks(profile, state);
  const missing = checks.filter(c => !c.passed).map(c => c.label);
  const findings: PortfolioFinding[] = [];

  const text = (p: { title: string; description: string; techStack: string[] }) => `${p.title} ${p.description} ${p.techStack.join(' ')}`;
  const projects = state.projects;
  const crud = projects.filter(p => CRUD_RE.test(text(p)) && !AI_RE.test(text(p)) && !REALTIME_RE.test(text(p))).length;
  const ai = projects.filter(p => AI_RE.test(text(p))).length;
  const realtime = projects.filter(p => REALTIME_RE.test(text(p))).length;
  const deployed = projects.filter(p => p.deployUrl.trim()).length;

  projects.forEach(p => {
    if (p.description.trim().length < 80) {
      findings.push({ severity: 'warning', title: `Weak description: ${p.title}`, detail: 'Describe the problem, your role, the stack and the outcome in 2–3 sentences (80+ characters).' });
    } else if (!METRIC_RE.test(p.description)) {
      findings.push({ severity: 'info', title: `Add a measurable outcome to ${p.title}`, detail: 'Recruiters look for numbers you can verify — users, latency, accuracy, dataset size. Only add numbers you actually measured.' });
    }
    if (p.techStack.length < 2) {
      findings.push({ severity: 'warning', title: `Missing technical depth: ${p.title}`, detail: 'List the full stack (language, framework, database, deployment) so reviewers see the depth.' });
    }
    if (!p.repoUrl.trim()) {
      findings.push({ severity: 'info', title: `No repository linked for ${p.title}`, detail: 'Link the GitHub repo so the work can be verified.' });
    }
  });

  if (crud >= 2) {
    findings.push({ severity: 'warning', title: 'Repetitive projects', detail: `${crud} projects look like basic CRUD apps. One differentiated project is worth more than another CRUD app.` });
  }

  const stacks = projects.map(p => [...p.techStack].map(t => t.toLowerCase()).sort().join('+')).filter(Boolean);
  if (new Set(stacks).size < stacks.length) {
    findings.push({ severity: 'info', title: 'Duplicated tech stacks', detail: 'Several projects use the exact same stack. Vary at least one layer to show range.' });
  }

  const uncovered = twin.gaps.filter(g => g.bucket === 'critical' && !projects.some(p => p.techStack.some(t => t.toLowerCase() === g.skill.toLowerCase())));
  if (uncovered.length) {
    findings.push({ severity: 'warning', title: 'Skill gaps not shown in any project', detail: `${uncovered.slice(0, 4).map(g => g.skill).join(', ')} — required for ${twin.career.targetRole} but no project demonstrates them.` });
  }

  // Strengths (only from real data)
  if (deployed) findings.push({ severity: 'strength', title: `${deployed} deployed project${deployed > 1 ? 's' : ''}`, detail: 'Live demos make your work easy to verify.' });
  if (projects.length >= 3) findings.push({ severity: 'strength', title: `${projects.length} projects tracked`, detail: 'A solid base to choose your best 2–3 for the resume.' });
  if ((state.leetcode.snapshot?.total || 0) >= 100) findings.push({ severity: 'strength', title: `${state.leetcode.snapshot?.total} LeetCode problems solved`, detail: 'Strong problem-solving evidence.' });
  if ((state.github.snapshot?.stars || 0) >= 5) findings.push({ severity: 'strength', title: `${state.github.snapshot?.stars} GitHub stars`, detail: 'Others have found your code useful.' });
  twin.gaps.filter(g => g.bucket === 'strong').slice(0, 2).forEach(g =>
    findings.push({ severity: 'strength', title: `${g.skill} meets the role bar`, detail: `${Math.round(g.current)} vs. ${g.required} required.` })
  );

  const missingCategories: string[] = [];
  const domain = twin.career.domain;
  if (!ai && (domain === 'AI / ML' || domain === 'Backend & Systems')) missingCategories.push('AI');
  if (!realtime && domain !== 'AI / ML') missingCategories.push('Real-time systems');
  if (!deployed) missingCategories.push('Production deployment');

  return {
    score: Math.round((checks.filter(c => c.passed).length / checks.length) * 100),
    missing,
    findings,
    current: { crud, ai, realtime, deployed, total: projects.length },
    missingCategories,
  };
};
