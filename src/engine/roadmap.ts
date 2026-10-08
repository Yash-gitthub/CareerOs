import type { UserProfile } from '../types/user';
import type { Roadmap, RoadmapMilestone, RoadmapWeek, CareerState } from './types';
import type { SkillGapItem, DsaTopicScore } from './skillGap';
import { addDays, uid, weekStart, today as todayISO } from './dates';
import { TIMELINE_WEEKS, resolveRole } from './roleRequirements';

// Week-by-week curricula. Each inner array is one week's topics.
const CURRICULA: Record<string, string[][]> = {
  'Machine Learning': [
    ['Statistics & probability refresher', 'Exploratory data analysis with pandas'],
    ['Linear regression', 'Gradient descent', 'Regularization'],
    ['Logistic regression & classification', 'Decision trees & ensembles'],
    ['Model evaluation: cross-validation, precision/recall, ROC'],
  ],
  'Deep Learning': [
    ['Neural network fundamentals', 'Backpropagation'],
    ['CNNs for vision', 'Training tricks: batch norm, dropout'],
    ['Sequence models & attention', 'Transformers'],
  ],
  PyTorch: [
    ['Tensors & autograd', 'Datasets and DataLoaders'],
    ['Training loops', 'Saving, loading and evaluating models'],
  ],
  'Scikit-Learn': [['Pipelines & preprocessing', 'Model selection with GridSearchCV']],
  LLMs: [
    ['Tokenization & embeddings', 'Prompting patterns'],
    ['Fine-tuning vs. prompting', 'Evaluating LLM outputs'],
  ],
  RAG: [
    ['Chunking & embeddings', 'Vector search'],
    ['Building a RAG pipeline', 'Evaluating retrieval quality'],
  ],
  Python: [
    ['Core syntax, data structures, comprehensions'],
    ['OOP in Python, modules, virtual environments', 'Testing with pytest'],
  ],
  JavaScript: [
    ['Types, scope, closures', 'Arrays & objects'],
    ['Promises & async/await', 'DOM & events', 'ES modules'],
  ],
  TypeScript: [['Types, interfaces, generics', 'Typing React components and APIs']],
  React: [
    ['Components, props, state', 'Hooks: useState, useEffect'],
    ['Data fetching & forms', 'Context & state management'],
    ['Performance & testing React apps'],
  ],
  'Node.js': [
    ['Node runtime & npm', 'Building an Express server'],
    ['Middleware, validation, error handling', 'Auth basics'],
  ],
  'REST APIs': [
    ['HTTP methods, status codes, idempotency', 'Resource design'],
    ['Pagination, versioning, validation', 'API security basics'],
  ],
  PostgreSQL: [
    ['SQL joins & aggregations', 'Schema design'],
    ['Indexes & query plans', 'Transactions & isolation levels'],
  ],
  DBMS: [
    ['ER modelling & normalization', 'SQL fundamentals'],
    ['Transactions, ACID, concurrency control', 'Indexing (B+ trees)'],
  ],
  'Operating Systems': [
    ['Processes, threads, scheduling'],
    ['Synchronization, deadlocks', 'Memory management & paging'],
  ],
  'Computer Networks': [
    ['OSI/TCP-IP layers', 'TCP vs UDP'],
    ['HTTP, DNS, TLS', 'Routing basics'],
  ],
  OOP: [['Encapsulation, inheritance, polymorphism', 'SOLID principles', 'Common design patterns']],
  'System Design': [
    ['Scalability basics, load balancing', 'Caching'],
    ['Databases at scale: replication, sharding', 'Message queues'],
    ['Design walkthroughs: URL shortener, chat system'],
  ],
  Docker: [['Images & containers', 'Dockerfiles & multi-stage builds', 'Docker Compose']],
  Kubernetes: [
    ['Pods, Deployments, Services'],
    ['ConfigMaps, Secrets, scaling', 'Helm basics'],
  ],
  AWS: [
    ['IAM, EC2, S3'],
    ['VPC networking', 'Managed databases & serverless (Lambda)'],
  ],
  Linux: [['Shell & filesystem', 'Processes, permissions, networking commands', 'Bash scripting']],
  'CI/CD': [['Pipeline concepts', 'Automated tests & builds', 'Deployment strategies']],
  Java: [
    ['Syntax, OOP in Java', 'Collections framework'],
    ['Exceptions, generics, streams', 'Concurrency basics'],
  ],
  'Information Security': [
    ['OWASP Top 10', 'Authentication & session security'],
    ['Network security basics', 'Hands-on labs'],
  ],
};

const genericCurriculum = (skill: string): string[][] => [
  [`${skill} fundamentals`, `Core ${skill} concepts`],
  [`Hands-on ${skill} exercises`, `Mini project using ${skill}`],
];

export const dsaCurriculum = (topics: DsaTopicScore[]): string[][] => {
  // Weakest topics first, two per week.
  const ordered = [...topics].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).map(t => t.label);
  const weeks: string[][] = [];
  for (let i = 0; i < ordered.length; i += 2) weeks.push(ordered.slice(i, i + 2));
  return weeks;
};

export interface RoadmapInputs {
  profile: UserProfile;
  state: CareerState;
  gaps: SkillGapItem[];
  dsaTopics: DsaTopicScore[];
  timeline?: string;
  dailyStudyTime?: string;
  now?: Date;
}

const makeWeeks = (curriculum: string[][], milestoneTitle: string, startDate: string): RoadmapWeek[] =>
  curriculum.map((topics, i) => ({
    id: uid('wk'),
    position: i,
    title: `${milestoneTitle} · Week ${i + 1}`,
    topics,
    startDate: addDays(startDate, i * 7),
    status: 'pending',
  }));

export const generateRoadmap = ({ profile, state, gaps, dsaTopics, timeline, dailyStudyTime, now = new Date() }: RoadmapInputs): Roadmap => {
  const tl = timeline || profile.career.timeline || 'No fixed timeline';
  const daily = dailyStudyTime || profile.learningPreferences.dailyStudyTime || '1–2 hours';
  const budgetWeeks = TIMELINE_WEEKS[tl] ?? 24;
  // Less daily time → each curriculum week is spread over more calendar weeks.
  const pace = daily === 'Less than 1 hour' ? 2 : 1;

  const focus = gaps.filter(g => g.bucket !== 'strong');
  const ordered = focus.length ? focus : gaps.slice(0, 3);

  type Plan = { title: string; skill: string; description: string; curriculum: string[][] };
  const plans: Plan[] = ordered.map(g => ({
    title: g.skill === 'DSA' ? 'Data Structures & Algorithms' : `${g.skill} ${g.bucket === 'critical' ? 'Foundations' : 'Deep Dive'}`,
    skill: g.skill,
    description: g.current > 0
      ? `Raise ${g.skill} from ${Math.round(g.current)} to ${g.required} (${g.bucket === 'critical' ? 'critical gap' : 'developing'}).`
      : `${g.skill} is required for ${resolveRole(profile.career.targetRole)} and has no evidence yet.`,
    curriculum: g.skill === 'DSA' ? dsaCurriculum(dsaTopics) : CURRICULA[g.skill] || genericCurriculum(g.skill),
  }));

  // Portfolio project milestone if there is no deployed project yet.
  if (!state.projects.some(p => p.deployUrl || p.stage === 'completed')) {
    plans.splice(Math.min(2, plans.length), 0, {
      title: 'Portfolio Project',
      skill: 'Projects',
      description: 'Build and deploy one role-relevant project (see Projects → Recommended).',
      curriculum: [
        ['Pick a recommended project & write the plan', 'Set up the repository'],
        ['Build the core features'],
        ['Testing, deployment & README'],
      ],
    });
  }

  // Dream-company interview prep always closes the roadmap, so its weeks are reserved up front.
  const interviewPlan: Plan | null = profile.career.dreamCompany
    ? {
        title: `Interview Prep for ${profile.career.dreamCompany}`,
        skill: 'Interview',
        description: `Company-focused practice for ${profile.career.dreamCompany}.`,
        curriculum: [
          ['Company-tagged DSA practice', 'Timed mock coding rounds'],
          ['Role-specific & system design questions', 'Resume and project storytelling'],
        ],
      }
    : null;
  const paced = (plan: Plan) =>
    pace === 2
      ? plan.curriculum.flatMap(w => [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))]).filter(w => w.length)
      : plan.curriculum;
  const reserved = interviewPlan ? paced(interviewPlan).length : 0;

  // Fit to the timeline budget.
  const start = weekStart(todayISO(now));
  const milestones: RoadmapMilestone[] = [];
  let usedWeeks = 0;
  for (const plan of [...plans, ...(interviewPlan ? [interviewPlan] : [])]) {
    const curriculum = paced(plan);
    const isInterview = plan === interviewPlan;
    if (!isInterview && milestones.length >= 2 && usedWeeks + curriculum.length > budgetWeeks - reserved) continue;
    milestones.push({
      id: uid('ms'),
      position: milestones.length,
      title: plan.title,
      skill: plan.skill,
      description: plan.description,
      status: 'pending',
      weeks: makeWeeks(curriculum, plan.title, addDays(start, usedWeeks * 7)),
    });
    usedWeeks += curriculum.length;
  }
  // Keep at most 8 milestones, always retaining the interview milestone last.
  if (milestones.length > 8) {
    const last = milestones[milestones.length - 1];
    if (last.skill === 'Interview') {
      milestones.splice(7);
      milestones.push(last);
    } else {
      milestones.splice(8);
    }
  }
  // Re-derive sequential dates after trimming.
  let cursor = start;
  milestones.forEach((m, i) => {
    m.position = i;
    m.weeks.forEach(w => {
      w.startDate = cursor;
      cursor = addDays(cursor, 7);
    });
  });

  if (milestones.length) {
    milestones[0].status = 'active';
    milestones[0].weeks[0].status = 'active';
  }

  return {
    id: uid('rm'),
    targetRole: resolveRole(profile.career.targetRole),
    careerGoal: profile.career.goal,
    dreamCompany: profile.career.dreamCompany,
    createdAt: now.toISOString(),
    params: { timeline: tl, dailyStudyTime: daily },
    milestones,
  };
};

// ---------- Mutations ----------

// Re-derive sequential start dates after any reorder/skip/reschedule.
export const reflowRoadmap = (roadmap: Roadmap, anchor?: string): Roadmap => {
  let cursor = anchor || roadmap.milestones[0]?.weeks[0]?.startDate || weekStart(todayISO());
  roadmap.milestones.forEach((m, mi) => {
    m.position = mi;
    m.weeks.forEach(w => {
      if (w.status === 'completed' || w.status === 'skipped') return;
      if (w.startDate < cursor) w.startDate = cursor;
      cursor = addDays(w.startDate, 7);
    });
  });
  return activateNext(roadmap);
};

// Exactly one active week: the first pending/active one. Milestone status follows its weeks.
export const activateNext = (roadmap: Roadmap): Roadmap => {
  let activated = false;
  roadmap.milestones.forEach(m => {
    m.weeks.forEach(w => {
      if (w.status === 'completed' || w.status === 'skipped') return;
      w.status = activated ? 'pending' : 'active';
      activated = true;
    });
    const open = m.weeks.filter(w => w.status === 'active' || w.status === 'pending');
    if (m.status === 'skipped') return;
    if (!open.length) m.status = m.weeks.some(w => w.status === 'completed') ? 'completed' : 'skipped';
    else m.status = open.some(w => w.status === 'active') ? 'active' : 'pending';
  });
  return roadmap;
};

export const findWeek = (roadmap: Roadmap | null, weekId: string) => {
  if (!roadmap) return null;
  for (const m of roadmap.milestones) {
    const w = m.weeks.find(x => x.id === weekId);
    if (w) return { milestone: m, week: w };
  }
  return null;
};

export const activeWeek = (roadmap: Roadmap | null) => {
  if (!roadmap) return null;
  for (const m of roadmap.milestones) {
    const w = m.weeks.find(x => x.status === 'active');
    if (w) return { milestone: m, week: w };
  }
  return null;
};

export const setWeekStatus = (roadmap: Roadmap, weekId: string, status: 'completed' | 'skipped'): Roadmap => {
  const found = findWeek(roadmap, weekId);
  if (found) found.week.status = status;
  return reflowRoadmap(roadmap, weekStart(todayISO()));
};

// Push this week and everything after it back by one week.
export const rescheduleWeek = (roadmap: Roadmap, weekId: string): Roadmap => {
  let shifting = false;
  roadmap.milestones.forEach(m => m.weeks.forEach(w => {
    if (w.id === weekId) shifting = true;
    if (shifting && w.status !== 'completed' && w.status !== 'skipped') w.startDate = addDays(w.startDate, 7);
  }));
  return activateNext(roadmap);
};

export const skipMilestone = (roadmap: Roadmap, milestoneId: string): Roadmap => {
  const m = roadmap.milestones.find(x => x.id === milestoneId);
  if (m) {
    m.status = 'skipped';
    m.weeks.forEach(w => {
      if (w.status !== 'completed') w.status = 'skipped';
    });
  }
  return reflowRoadmap(roadmap, weekStart(todayISO()));
};

export const moveMilestone = (roadmap: Roadmap, milestoneId: string, direction: -1 | 1): Roadmap => {
  const i = roadmap.milestones.findIndex(m => m.id === milestoneId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= roadmap.milestones.length) return roadmap;
  const list = roadmap.milestones;
  [list[i], list[j]] = [list[j], list[i]];
  // Recompute dates from the current week for all unfinished weeks.
  const anchor = weekStart(todayISO());
  list.forEach(m => m.weeks.forEach(w => {
    if (w.status !== 'completed' && w.status !== 'skipped') w.startDate = anchor;
  }));
  return reflowRoadmap(roadmap, anchor);
};
