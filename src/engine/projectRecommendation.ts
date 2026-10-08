import type { UserProfile } from '../types/user';
import type { ProjectBlueprint } from './types';
import type { CareerTwin } from './careerTwin';
import type { PortfolioAnalysis } from './portfolioAnalyzer';
import { roleDomain, STUDY_MINUTES } from './roleRequirements';

type Template = Omit<ProjectBlueprint, 'why' | 'coverage' | 'timelineWeeks'> & {
  domains: ('aiml' | 'web' | 'backend' | 'cloud')[];
  categories: string[]; // portfolio categories it fills: 'AI', 'Real-time systems', 'Production deployment'
  baseWeeks: number;
};

// Resume bullets keep [placeholders] for numbers the student must measure themselves.
const TEMPLATES: Template[] = [
  {
    key: 'rag-assistant',
    domains: ['aiml', 'backend'],
    categories: ['AI', 'Production deployment'],
    name: 'Domain Knowledge Assistant (RAG)',
    problem: 'Students and engineers waste time searching long documentation. Build an assistant that answers questions grounded in a document collection, with citations.',
    skillsLearned: ['Python', 'LLMs', 'RAG', 'FastAPI', 'PostgreSQL', 'Docker', 'System Design'],
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'LLMs', 'RAG', 'React', 'Docker'],
    architecture: [
      'Ingestion worker: chunk documents → compute embeddings → store in Postgres (pgvector)',
      'Query API (FastAPI): embed question → vector search → rerank → prompt LLM with retrieved chunks',
      'React client with streaming answers and source citations',
      'Evaluation script: question set with expected sources to measure retrieval quality',
    ],
    features: ['Document upload & ingestion', 'Grounded answers with citations', 'Streaming responses', 'Retrieval evaluation dashboard', 'Rate limiting & caching'],
    milestones: [
      { title: 'Ingestion pipeline & vector store', weeks: 1 },
      { title: 'Retrieval API + prompt design', weeks: 1 },
      { title: 'Frontend with citations & streaming', weeks: 1 },
      { title: 'Evaluation, Docker & deployment', weeks: 1 },
    ],
    deployment: ['Containerise API and worker with Docker', 'Deploy to a cloud VM or Render/Fly.io', 'Managed Postgres with pgvector', 'Secrets via environment variables'],
    githubStructure: 'rag-assistant/\n├── api/            # FastAPI app\n├── ingest/         # chunking & embedding worker\n├── web/            # React client\n├── eval/           # retrieval evaluation set & script\n├── docker-compose.yml\n└── README.md',
    resumeBullets: [
      'Built a retrieval-augmented Q&A assistant over [N] documents using FastAPI, PostgreSQL (pgvector) and an LLM, returning cited answers.',
      'Designed an evaluation set of [N] questions and improved retrieval hit-rate from [X]% to [Y]% via chunking and reranking.',
      'Containerised and deployed the system with Docker; added caching that cut average latency to [X] ms.',
    ],
    interviewPoints: ['Chunk size vs. retrieval quality trade-offs', 'How you evaluate hallucination and grounding', 'Caching and cost control for LLM calls', 'Scaling the ingestion pipeline'],
    baseWeeks: 4,
  },
  {
    key: 'ml-prediction-service',
    domains: ['aiml'],
    categories: ['AI', 'Production deployment'],
    name: 'End-to-End ML Prediction Service',
    problem: 'Most student ML projects stop at a notebook. Train a model on a real public dataset and ship it as a monitored API.',
    skillsLearned: ['Python', 'Machine Learning', 'Scikit-Learn', 'PyTorch', 'Docker', 'REST APIs'],
    stack: ['Python', 'Scikit-Learn', 'PyTorch', 'FastAPI', 'Docker', 'GitHub Actions'],
    architecture: ['Reproducible training pipeline with versioned data splits', 'Model registry (saved artifacts + metrics)', 'FastAPI inference service with input validation', 'CI pipeline that retrains/tests and builds the image'],
    features: ['EDA report', 'Baseline vs. improved model comparison', 'Prediction API with validation', 'Basic drift/latency monitoring', 'CI with tests'],
    milestones: [
      { title: 'Dataset, EDA & baseline model', weeks: 1 },
      { title: 'Model improvement & evaluation', weeks: 1 },
      { title: 'Inference API & tests', weeks: 1 },
      { title: 'CI/CD, Docker & deployment', weeks: 1 },
    ],
    deployment: ['Docker image built in GitHub Actions', 'Deploy API to a cloud service', 'Store model artifacts with version tags'],
    githubStructure: 'ml-service/\n├── data/           # download scripts (no raw data committed)\n├── notebooks/      # EDA\n├── src/train/      # training pipeline\n├── src/api/        # FastAPI inference\n├── tests/\n├── .github/workflows/\n└── README.md',
    resumeBullets: [
      'Trained and compared [N] models on [dataset], improving [metric] from [X] to [Y] over the baseline.',
      'Shipped the model as a validated FastAPI service with CI/CD in GitHub Actions and Docker.',
      'Added latency and input-drift monitoring for the deployed model.',
    ],
    interviewPoints: ['Why you chose your evaluation metric', 'Preventing data leakage', 'Serving latency vs. model size', 'How you would detect model drift'],
    baseWeeks: 4,
  },
  {
    key: 'realtime-collab',
    domains: ['web', 'backend'],
    categories: ['Real-time systems', 'Production deployment'],
    name: 'Real-time Collaborative Task Board',
    problem: 'Teams need to see changes instantly. Build a multi-user board where updates sync live across clients with presence indicators.',
    skillsLearned: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'System Design'],
    stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    architecture: ['React client with optimistic updates', 'Node.js WebSocket gateway', 'Redis pub/sub to fan out events across server instances', 'PostgreSQL as the source of truth with conflict resolution'],
    features: ['Auth & boards', 'Live card updates & presence', 'Optimistic UI with conflict handling', 'Activity history', 'Horizontal scaling with Redis'],
    milestones: [
      { title: 'Data model, auth & REST API', weeks: 1 },
      { title: 'WebSocket sync & presence', weeks: 1 },
      { title: 'Conflict handling & activity log', weeks: 1 },
      { title: 'Load test, Docker & deploy', weeks: 1 },
    ],
    deployment: ['Docker Compose for local', 'Deploy app + managed Postgres/Redis', 'CI pipeline running tests on every PR'],
    githubStructure: 'realtime-board/\n├── client/         # React + TypeScript\n├── server/         # Node.js API + WebSocket gateway\n├── db/migrations/\n├── loadtest/\n├── docker-compose.yml\n└── README.md',
    resumeBullets: [
      'Built a real-time collaborative board with React, Node.js WebSockets and Redis pub/sub supporting [N] concurrent users in load tests.',
      'Implemented optimistic updates with server-side conflict resolution backed by PostgreSQL.',
      'Deployed with Docker and CI; p95 update latency measured at [X] ms.',
    ],
    interviewPoints: ['WebSockets vs. polling vs. SSE', 'Scaling WebSocket servers horizontally', 'Conflict resolution strategies', 'Consistency vs. latency trade-offs'],
    baseWeeks: 4,
  },
  {
    key: 'api-platform',
    domains: ['backend', 'web'],
    categories: ['Production deployment'],
    name: 'Production-grade URL Shortener & Analytics API',
    problem: 'A classic system design question, built for real: short links with click analytics, rate limiting and caching.',
    skillsLearned: ['REST APIs', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Java'],
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker'],
    architecture: ['Stateless API servers behind a load balancer', 'Base62 ID generation', 'Redis cache for hot links + rate limiting', 'Async click-event processing into an analytics table'],
    features: ['Create/resolve short links', 'Click analytics', 'Per-user rate limits', 'Cache hit-rate metrics', 'OpenAPI documentation'],
    milestones: [
      { title: 'Core API & schema', weeks: 1 },
      { title: 'Caching & rate limiting', weeks: 1 },
      { title: 'Analytics pipeline', weeks: 1 },
      { title: 'Docs, tests & deployment', weeks: 1 },
    ],
    deployment: ['Docker image', 'Managed Postgres + Redis', 'Health checks and structured logging'],
    githubStructure: 'shortener/\n├── src/main/java/...\n├── src/test/java/...\n├── db/migrations/\n├── docker-compose.yml\n└── README.md  # includes design doc & capacity estimates',
    resumeBullets: [
      'Designed and built a URL shortener API (Spring Boot, PostgreSQL, Redis) with caching that achieved a [X]% cache hit rate in load tests.',
      'Implemented per-user rate limiting and an asynchronous analytics pipeline for click events.',
      'Documented capacity estimates and design trade-offs in a written design doc.',
    ],
    interviewPoints: ['ID generation and collisions', 'Cache invalidation strategy', 'Read/write ratio and scaling', 'Rate limiting algorithms'],
    baseWeeks: 4,
  },
  {
    key: 'iac-platform',
    domains: ['cloud'],
    categories: ['Production deployment'],
    name: 'Infrastructure-as-Code Deployment Platform',
    problem: 'Show you can take any app to production reliably: provision infrastructure with code and deploy through a CI/CD pipeline with monitoring.',
    skillsLearned: ['Terraform', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
    stack: ['Terraform', 'AWS', 'Docker', 'Kubernetes', 'GitHub Actions'],
    architecture: ['Terraform modules for network, cluster and database', 'Container registry + Kubernetes deployment', 'GitHub Actions: test → build → deploy with approvals', 'Metrics and alerting'],
    features: ['One-command environment provisioning', 'Blue/green or rolling deploys', 'Secrets management', 'Dashboards & alerts', 'Cost notes in README'],
    milestones: [
      { title: 'Terraform networking & cluster', weeks: 1 },
      { title: 'Containerise sample app & deploy', weeks: 1 },
      { title: 'CI/CD pipeline with approvals', weeks: 1 },
      { title: 'Monitoring, alerts & teardown docs', weeks: 1 },
    ],
    deployment: ['Everything provisioned via Terraform', 'Deploys via GitHub Actions only', 'Documented teardown to control cost'],
    githubStructure: 'platform/\n├── terraform/modules/\n├── terraform/envs/\n├── k8s/\n├── app/\n├── .github/workflows/\n└── README.md',
    resumeBullets: [
      'Provisioned a production-style AWS environment entirely with Terraform modules ([N] resources).',
      'Built a GitHub Actions pipeline deploying containerised services to Kubernetes with rolling updates.',
      'Added monitoring and alerting; documented cost and teardown procedures.',
    ],
    interviewPoints: ['State management in Terraform', 'Rolling vs. blue/green deploys', 'Secrets handling', 'Debugging a failing deployment'],
    baseWeeks: 4,
  },
  {
    key: 'security-scanner',
    domains: ['cloud'],
    categories: ['Production deployment'],
    name: 'Web Vulnerability Scanner & Report Generator',
    problem: 'Automate checks for common OWASP Top 10 misconfigurations on a test application you own, producing a readable report.',
    skillsLearned: ['Information Security', 'Python', 'Computer Networks', 'Linux', 'Docker'],
    stack: ['Python', 'Docker', 'Linux'],
    architecture: ['Deliberately vulnerable local test app (never scan systems you don\'t own)', 'Python scanner modules per check (headers, TLS, injection probes)', 'Report generator (HTML/Markdown)'],
    features: ['Security header checks', 'TLS configuration checks', 'Basic injection probes against the test app', 'Severity-ranked report'],
    milestones: [
      { title: 'Test app & scanner skeleton', weeks: 1 },
      { title: 'Check modules', weeks: 2 },
      { title: 'Reporting & documentation', weeks: 1 },
    ],
    deployment: ['Run in Docker against a local target', 'Publish the tool and a sample report'],
    githubStructure: 'scanner/\n├── scanner/checks/\n├── target-app/\n├── reports/\n└── README.md  # scope & ethics statement',
    resumeBullets: [
      'Built a Python scanner with [N] check modules for OWASP Top 10 issues, validated against a deliberately vulnerable test app.',
      'Generated severity-ranked reports with remediation guidance.',
    ],
    interviewPoints: ['Responsible scope and authorization', 'How each check works', 'False positives handling'],
    baseWeeks: 4,
  },
  {
    key: 'perf-frontend',
    domains: ['web'],
    categories: ['Production deployment'],
    name: 'Accessible, High-Performance Dashboard App',
    problem: 'Build a data-heavy dashboard that stays fast and accessible — the kind of UI product companies ship.',
    skillsLearned: ['TypeScript', 'React', 'Next.js', 'CSS', 'Tailwind CSS', 'REST APIs'],
    stack: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS', 'REST APIs'],
    architecture: ['Next.js app with server-side data fetching', 'Virtualised tables for large datasets', 'Accessible component library (keyboard + screen reader)', 'Performance budget checks in CI'],
    features: ['Filterable, virtualised data table', 'Charts with keyboard navigation', 'Dark mode', 'Lighthouse/performance checks in CI'],
    milestones: [
      { title: 'App shell & data layer', weeks: 1 },
      { title: 'Table, filters & charts', weeks: 1 },
      { title: 'Accessibility & performance pass', weeks: 1 },
      { title: 'Deploy & document', weeks: 1 },
    ],
    deployment: ['Deploy on Vercel', 'Performance budget in CI'],
    githubStructure: 'dashboard/\n├── app/\n├── components/\n├── lib/\n├── tests/\n└── README.md',
    resumeBullets: [
      'Built an accessible Next.js dashboard rendering [N]+ rows with virtualisation; Lighthouse performance score [X].',
      'Implemented keyboard-navigable charts and a reusable component library with TypeScript.',
    ],
    interviewPoints: ['Rendering strategies (SSR/SSG/CSR)', 'Virtualisation', 'Accessibility testing', 'Measuring performance'],
    baseWeeks: 4,
  },
];

export const recommendProjects = (profile: UserProfile, twin: CareerTwin, portfolio: PortfolioAnalysis): ProjectBlueprint[] => {
  const domain = roleDomain(profile.career.targetRole);
  const gapSkills = twin.gaps.filter(g => g.bucket !== 'strong').map(g => g.skill.toLowerCase());
  const company = profile.career.dreamCompany;
  const minutes = STUDY_MINUTES[profile.learningPreferences.dailyStudyTime] ?? 90;
  const existing = new Set(twin.project.technologies.map(t => t.toLowerCase()));

  return TEMPLATES
    .map(t => {
      const covered = t.skillsLearned.filter(s => gapSkills.includes(s.toLowerCase()));
      const fills = t.categories.filter(c => portfolio.missingCategories.includes(c));
      const domainFit = t.domains.includes(domain) ? 1 : 0;
      const coverage = covered.length * 2 + fills.length * 1.5 + domainFit * 3;
      // Assume ~45% of daily study time goes to the project.
      const timelineWeeks = Math.max(2, Math.round(t.baseWeeks * (90 / Math.max(45, minutes * 0.9))));

      const why: string[] = [];
      if (domainFit) why.push(`Directly relevant to ${twin.career.targetRole} roles${company ? ` at companies like ${company}` : ''}.`);
      if (covered.length) why.push(`Closes your skill gaps: ${covered.join(', ')}.`);
      if (fills.length) why.push(`Fills portfolio gaps: ${fills.join(', ')}.`);
      const newTech = t.stack.filter(s => !existing.has(s.toLowerCase()));
      if (portfolio.current.crud >= 2) why.push(`Differentiates you from your ${portfolio.current.crud} CRUD-style projects.`);
      if (newTech.length) why.push(`Adds new stack experience: ${newTech.slice(0, 4).join(', ')}.`);

      const { domains: _d, categories: _c, baseWeeks: _b, ...rest } = t;
      void _d; void _c; void _b;
      return {
        ...rest,
        milestones: rest.milestones.map(m => ({ ...m, weeks: Math.max(1, Math.round(m.weeks * timelineWeeks / t.baseWeeks)) })),
        why,
        coverage,
        timelineWeeks,
      };
    })
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 3);
};
