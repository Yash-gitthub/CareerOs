// Domain model for the Career OS. Mirrors supabase/migrations/002_core.sql so the
// local store can later be swapped for the Supabase tables without changing the UI.

import type { SkillProficiency } from '../types/user';

export type DashboardTab =
  | 'overview' | 'tasks' | 'roadmap' | 'coding' | 'projects'
  | 'learning' | 'analytics' | 'portfolio' | 'review';

// ---------- Tasks ----------
export type TaskCategory = 'dsa' | 'learning' | 'project' | 'github' | 'core_cs' | 'personal';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskSource = 'roadmap' | 'intervention' | 'personal' | 'project' | 'review';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  estMinutes: number;
  dueDate: string;
  status: TaskStatus;
  source: TaskSource;
  milestoneId?: string;
  weekId?: string;
  projectId?: string;
  projectMilestoneId?: string;
  skill?: string;
  topic?: string;
  problems?: number;
  skipReason?: string;
  genKey?: string;
  rescheduledCount?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ---------- Roadmap ----------
export type RoadmapItemStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface RoadmapWeek {
  id: string;
  position: number;
  title: string;
  topics: string[];
  startDate: string;
  status: RoadmapItemStatus;
}

export interface RoadmapMilestone {
  id: string;
  position: number;
  title: string;
  skill: string;
  description: string;
  status: RoadmapItemStatus;
  weeks: RoadmapWeek[];
}

export interface RoadmapParams {
  timeline: string;
  dailyStudyTime: string;
}

export interface Roadmap {
  id: string;
  targetRole: string;
  careerGoal: string;
  dreamCompany: string;
  createdAt: string;
  params: RoadmapParams;
  milestones: RoadmapMilestone[];
}

// ---------- Assessment ----------
export type AssessmentSection = 'programming' | 'dsa' | 'core_cs' | 'domain';

export interface AssessmentAnswer {
  questionId: string;
  section: AssessmentSection;
  topic: string;
  choice: number;
  correct: boolean;
}

// Claimed vs. measured level for one declared skill.
export interface SkillCheck {
  skill: string; // question-set key, or 'DSA' (scored from the DSA section)
  appliesTo: string[]; // profile skill names this check covers
  claimed: SkillProficiency;
  verified: SkillProficiency;
  correct: number | null;
  total: number | null;
  score: number; // 0–100
  status: 'verified' | 'above' | 'below';
}

export interface AssessmentResult {
  id: string;
  completedAt: string;
  targetRole: string;
  domain: string;
  answers: AssessmentAnswer[];
  sectionScores: Record<AssessmentSection, number>;
  topicScores: Record<string, number>;
  communication: number;
  skillChecks?: SkillCheck[]; // absent on attempts taken before skill verification existed
}

// ---------- Integrations ----------
export type SyncErrorCode =
  | 'missing_username' | 'invalid_username' | 'not_found' | 'rate_limited'
  | 'auth_failed' | 'timeout' | 'upstream_error' | 'empty' | 'unavailable';

export interface IntegrationState<TSnapshot> {
  username: string;
  status: 'idle' | 'syncing' | 'connected' | 'error';
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  lastError?: string;
  lastErrorCode?: SyncErrorCode;
  snapshot?: TSnapshot;
}

export interface GitHubRepo {
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  isFork: boolean;
  homepage: string | null;
  topics: string[];
}

export interface GitHubSnapshot {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  repos: GitHubRepo[];
  languages: Record<string, number>;
  stars: number;
  forks: number;
  pushDays30: number;
  activeDates: string[];
  syncedAt: string;
}

export interface LeetCodeSnapshot {
  username: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  tagCounts: Record<string, number>;
  contestRating: number | null;
  contestsAttended: number | null;
  submissionsByDate: Record<string, number>;
  source: 'api' | 'manual';
  syncedAt: string;
}

// ---------- Projects & portfolio ----------
export type ProjectStage = 'idea' | 'planning' | 'development' | 'testing' | 'deployment' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completedAt?: string;
}

export interface ProjectBlueprint {
  key: string;
  name: string;
  problem: string;
  why: string[];
  skillsLearned: string[];
  stack: string[];
  architecture: string[];
  features: string[];
  milestones: { title: string; weeks: number }[];
  timelineWeeks: number;
  deployment: string[];
  githubStructure: string;
  resumeBullets: string[];
  interviewPoints: string[];
  coverage: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  stage: ProjectStage;
  repoUrl: string;
  deployUrl: string;
  startDate: string;
  deadline: string;
  milestones: ProjectMilestone[];
  isRecommended: boolean;
  blueprint?: ProjectBlueprint;
  createdAt: string;
  updatedAt: string;
}

export type PortfolioKind = 'achievement' | 'education' | 'experience' | 'certification' | 'link';

export interface PortfolioItem {
  id: string;
  kind: PortfolioKind;
  title: string;
  organization: string;
  detail: string;
  date: string;
  url: string;
}

// ---------- Notifications & interventions ----------
export type NotificationType =
  | 'task_reminder' | 'upcoming_task' | 'overdue' | 'github_reminder'
  | 'learning_reminder' | 'weekly_review' | 'twin_update' | 'intervention';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  tab?: DashboardTab;
  dedupeKey: string;
}

export interface NotificationPrefs {
  enabled: Record<NotificationType, boolean>;
  browser: boolean;
}

export type InterventionChange =
  | { kind: 'workload'; multiplier: number }
  | { kind: 'recovery'; skill: string; topic?: string }
  | { kind: 'dsa_boost'; topic: string }
  | { kind: 'project_task'; projectId: string }
  | { kind: 'advance_week'; weekId: string };

export interface Intervention {
  id: string;
  rule: 'overload' | 'weak_area' | 'low_coding' | 'project_stale' | 'accelerating' | 'ahead';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  recommendation: string;
  change: InterventionChange;
  status: 'open' | 'accepted' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

// ---------- Progress ----------
export type ReadinessKey =
  | 'technical_skills' | 'dsa' | 'projects' | 'coding_activity'
  | 'portfolio' | 'learning_consistency' | 'core_cs' | 'goal_alignment';

export interface ReadinessComponent {
  key: ReadinessKey;
  label: string;
  weight: number;
  value: number | null;
  contribution: number;
  hint: string;
}

export interface ReadinessSnapshot {
  id: string;
  score: number;
  contributions: Record<ReadinessKey, number>;
  skills: Record<string, number>;
  consistency: number | null;
  reason: string;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  createdAt: string;
  metrics: {
    tasksPlanned: number;
    tasksCompleted: number;
    tasksSkipped: number;
    tasksMissed: number;
    completionRate: number;
    byCategory: Record<string, { planned: number; completed: number }>;
    learningMinutes: number;
    dsaProblems: number;
    projectMilestones: number;
    consistency: number | null;
    readinessStart: number | null;
    readinessEnd: number | null;
    componentDeltas: Partial<Record<ReadinessKey, number>>;
  };
  strongestArea: string;
  needsAttention: string;
  recommendations: string[];
  nextWeek: { multiplier: number; focusSkills: string[]; focusTopics: string[] };
}

export interface LearningLog {
  id: string;
  skill: string;
  minutes: number;
  resourceId?: string;
  taskId?: string;
  note: string;
  date: string;
}

export interface ActivityEvent {
  id: string;
  type:
    | 'task.completed' | 'task.skipped' | 'task.missed' | 'task.updated' | 'task.created'
    | 'assessment.completed' | 'github.synced' | 'leetcode.synced' | 'project.updated'
    | 'learning.completed' | 'weekly_review.completed' | 'roadmap.updated'
    | 'intervention.resolved' | 'portfolio.updated' | 'system.reconcile';
  summary: string;
  createdAt: string;
}

export interface CareerState {
  schema: 1;
  createdAt: string;
  assessments: AssessmentResult[];
  roadmap: Roadmap | null;
  tasks: Task[];
  projects: Project[];
  portfolio: PortfolioItem[];
  learningLog: LearningLog[];
  completedResourceIds: string[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPrefs;
  interventions: Intervention[];
  readinessHistory: ReadinessSnapshot[];
  leetcodeHistory: { date: string; total: number }[];
  weeklyGoals: Record<string, Partial<Record<WeeklyGoalCategory, number>>>;
  weeklyReviews: WeeklyReview[];
  github: IntegrationState<GitHubSnapshot>;
  leetcode: IntegrationState<LeetCodeSnapshot>;
  workloadMultiplier: number;
  focusSkills: string[];
  focusTopics: string[];
  dsaBoostUntil?: string;
  twinVersion: number;
  twinUpdatedAt: string;
  events: ActivityEvent[];
  // Progressive feature unlocks. Once unlocked a tab stays unlocked.
  unlockedTabs: DashboardTab[];
  visitedTabs: DashboardTab[];
}

export type WeeklyGoalCategory = 'dsa' | 'learning' | 'project' | 'github';
