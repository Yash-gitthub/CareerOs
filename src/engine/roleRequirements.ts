// Client copy of the role_requirements seed in supabase/migrations/002_core.sql.
// required = 0–100 skill score expected for an entry-level hire; weight = importance (0–1).

export interface RoleRequirement {
  skill: string;
  required: number;
  weight: number;
}

type Row = [string, number, number];

const rows = (list: Row[]): RoleRequirement[] =>
  list.map(([skill, required, weight]) => ({ skill, required, weight }));

export const ROLE_REQUIREMENTS: Record<string, RoleRequirement[]> = {
  'Software Engineer': rows([
    ['DSA', 75, 1.0], ['OOP', 70, 0.8], ['DBMS', 60, 0.7], ['Operating Systems', 60, 0.7],
    ['Computer Networks', 55, 0.6], ['System Design', 50, 0.6], ['Java', 65, 0.6],
    ['Python', 60, 0.5], ['REST APIs', 55, 0.5], ['Linux', 45, 0.4],
  ]),
  'Full Stack Developer': rows([
    ['JavaScript', 75, 1.0], ['TypeScript', 60, 0.7], ['React', 70, 0.9], ['Node.js', 65, 0.9],
    ['REST APIs', 70, 0.8], ['PostgreSQL', 60, 0.7], ['HTML', 70, 0.6], ['CSS', 65, 0.6],
    ['DSA', 55, 0.6], ['Docker', 45, 0.4],
  ]),
  'Frontend Developer': rows([
    ['JavaScript', 80, 1.0], ['TypeScript', 65, 0.8], ['React', 75, 1.0], ['HTML', 80, 0.8],
    ['CSS', 75, 0.8], ['Tailwind CSS', 55, 0.5], ['Next.js', 55, 0.5], ['REST APIs', 55, 0.5],
    ['DSA', 50, 0.5],
  ]),
  'Backend Developer': rows([
    ['DSA', 65, 0.8], ['REST APIs', 75, 1.0], ['PostgreSQL', 70, 0.9], ['DBMS', 70, 0.8],
    ['Node.js', 60, 0.6], ['Java', 60, 0.6], ['Redis', 50, 0.5], ['System Design', 60, 0.8],
    ['Docker', 55, 0.6], ['Operating Systems', 55, 0.5], ['Computer Networks', 55, 0.5],
  ]),
  'AI / ML Engineer': rows([
    ['Python', 80, 1.0], ['Machine Learning', 75, 1.0], ['Deep Learning', 65, 0.9],
    ['PyTorch', 60, 0.8], ['Scikit-Learn', 60, 0.6], ['LLMs', 55, 0.7], ['RAG', 50, 0.6],
    ['DSA', 65, 0.7], ['System Design', 45, 0.5], ['Docker', 45, 0.4],
  ]),
  'Data Scientist': rows([
    ['Python', 80, 1.0], ['Machine Learning', 70, 1.0], ['Scikit-Learn', 65, 0.8],
    ['PostgreSQL', 60, 0.7], ['MySQL', 55, 0.5], ['Deep Learning', 50, 0.5], ['NLP', 45, 0.4],
    ['DSA', 50, 0.5],
  ]),
  'Data Engineer': rows([
    ['Python', 75, 1.0], ['PostgreSQL', 75, 1.0], ['DBMS', 70, 0.8], ['Cassandra', 45, 0.4],
    ['AWS', 55, 0.7], ['Docker', 55, 0.6], ['Linux', 55, 0.6], ['DSA', 55, 0.6],
    ['System Design', 50, 0.6],
  ]),
  'Cloud Engineer': rows([
    ['AWS', 75, 1.0], ['Linux', 70, 0.9], ['Docker', 65, 0.8], ['Kubernetes', 55, 0.7],
    ['Terraform', 55, 0.7], ['Computer Networks', 65, 0.8], ['CI/CD', 55, 0.6], ['Python', 55, 0.5],
  ]),
  'DevOps Engineer': rows([
    ['Linux', 75, 1.0], ['Docker', 75, 1.0], ['Kubernetes', 65, 0.9], ['CI/CD', 70, 0.9],
    ['GitHub Actions', 60, 0.6], ['Terraform', 55, 0.7], ['AWS', 60, 0.7],
    ['Computer Networks', 60, 0.6], ['Python', 50, 0.5],
  ]),
  'Cybersecurity Analyst / Engineer': rows([
    ['Information Security', 75, 1.0], ['Computer Networks', 75, 1.0], ['Linux', 70, 0.9],
    ['Operating Systems', 65, 0.8], ['Python', 60, 0.6], ['DBMS', 50, 0.4], ['AWS', 45, 0.4],
  ]),
  'Mobile App Developer': rows([
    ['Kotlin', 65, 0.8], ['Swift', 60, 0.7], ['JavaScript', 60, 0.6], ['React', 55, 0.5],
    ['Firebase', 55, 0.6], ['REST APIs', 60, 0.7], ['OOP', 65, 0.7], ['DSA', 55, 0.6],
  ]),
  'UI/UX & Product Designer': rows([
    ['HTML', 60, 0.7], ['CSS', 65, 0.8], ['Tailwind CSS', 50, 0.5], ['React', 45, 0.5],
    ['JavaScript', 45, 0.5], ['Software Engineering', 45, 0.5],
  ]),
  'Associate Product Manager': rows([
    ['Software Engineering', 65, 1.0], ['System Design', 45, 0.6], ['DBMS', 45, 0.5],
    ['MySQL', 45, 0.5], ['Python', 40, 0.4], ['REST APIs', 40, 0.4],
  ]),
};

export const resolveRole = (targetRole: string): string =>
  ROLE_REQUIREMENTS[targetRole] ? targetRole : 'Software Engineer';

export const getRoleRequirements = (targetRole: string): RoleRequirement[] =>
  ROLE_REQUIREMENTS[resolveRole(targetRole)];

export type Domain = 'aiml' | 'web' | 'backend' | 'cloud';

export const roleDomain = (targetRole: string): Domain => {
  const role = resolveRole(targetRole);
  if (role === 'AI / ML Engineer' || role === 'Data Scientist') return 'aiml';
  if (['Full Stack Developer', 'Frontend Developer', 'Mobile App Developer', 'UI/UX & Product Designer'].includes(role)) return 'web';
  if (['Cloud Engineer', 'DevOps Engineer', 'Cybersecurity Analyst / Engineer'].includes(role)) return 'cloud';
  return 'backend';
};

export const DOMAIN_LABEL: Record<Domain, string> = {
  aiml: 'AI / ML',
  web: 'Web Development',
  backend: 'Backend & Systems',
  cloud: 'Cloud, DevOps & Security',
};

// Skills whose assessment evidence comes from the domain section.
export const DOMAIN_SKILLS: Record<Domain, string[]> = {
  aiml: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Scikit-Learn', 'LLMs', 'RAG', 'NLP', 'TensorFlow'],
  web: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Next.js', 'Tailwind CSS', 'Node.js'],
  backend: ['REST APIs', 'PostgreSQL', 'Redis', 'System Design', 'Node.js', 'Docker'],
  cloud: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Terraform', 'Information Security'],
};

// ---------- DSA topics ----------
export interface DsaTopic {
  key: string;
  label: string;
  lcTags: string[];
  target: number; // problems solved for full coverage
  lcSlug: string;
}

export const DSA_TOPICS: DsaTopic[] = [
  { key: 'arrays', label: 'Arrays', lcTags: ['Array', 'Two Pointers', 'Sliding Window', 'Prefix Sum'], target: 40, lcSlug: 'array' },
  { key: 'strings', label: 'Strings', lcTags: ['String'], target: 25, lcSlug: 'string' },
  { key: 'linked_lists', label: 'Linked Lists', lcTags: ['Linked List'], target: 15, lcSlug: 'linked-list' },
  { key: 'stack', label: 'Stack', lcTags: ['Stack', 'Monotonic Stack'], target: 12, lcSlug: 'stack' },
  { key: 'queue', label: 'Queue', lcTags: ['Queue', 'Heap (Priority Queue)'], target: 10, lcSlug: 'queue' },
  { key: 'trees', label: 'Trees', lcTags: ['Tree', 'Binary Tree', 'Binary Search Tree'], target: 25, lcSlug: 'tree' },
  { key: 'graphs', label: 'Graphs', lcTags: ['Graph', 'Breadth-First Search', 'Depth-First Search', 'Union Find', 'Topological Sort'], target: 20, lcSlug: 'graph' },
  { key: 'sorting', label: 'Sorting', lcTags: ['Sorting'], target: 15, lcSlug: 'sorting' },
  { key: 'searching', label: 'Searching', lcTags: ['Binary Search'], target: 15, lcSlug: 'binary-search' },
  { key: 'recursion', label: 'Recursion', lcTags: ['Recursion', 'Backtracking'], target: 15, lcSlug: 'backtracking' },
  { key: 'greedy', label: 'Greedy', lcTags: ['Greedy'], target: 15, lcSlug: 'greedy' },
  { key: 'dp', label: 'Dynamic Programming', lcTags: ['Dynamic Programming', 'Memoization'], target: 25, lcSlug: 'dynamic-programming' },
];

export const CORE_CS_TOPICS = [
  { key: 'oop', label: 'OOP', skill: 'OOP' },
  { key: 'dbms', label: 'DBMS', skill: 'DBMS' },
  { key: 'os', label: 'Operating Systems', skill: 'Operating Systems' },
  { key: 'cn', label: 'Computer Networks', skill: 'Computer Networks' },
  { key: 'coa', label: 'Computer Architecture', skill: 'Computer Architecture' },
];

export const STUDY_MINUTES: Record<string, number> = {
  'Less than 1 hour': 45,
  '1–2 hours': 90,
  '2–3 hours': 150,
  '3–5 hours': 210,
  '5+ hours': 300,
};

export const TIMELINE_WEEKS: Record<string, number> = {
  '3 months': 12,
  '6 months': 24,
  '1 year': 48,
  '2 years': 96,
  'No fixed timeline': 24,
};
