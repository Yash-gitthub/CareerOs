export interface CareerRoleOption {
  id: string;
  title: string;
  description: string;
  badge?: string;
}

export const CAREER_ROLES: CareerRoleOption[] = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    description: 'Build reliable, scalable enterprise applications, algorithms, and systems.'
  },
  {
    id: 'fullstack-dev',
    title: 'Full Stack Developer',
    description: 'Architect and develop modern end-to-end web applications with client & server logic.'
  },
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    description: 'Craft responsive, intuitive, and performant user interfaces and interactions.'
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    description: 'Design robust APIs, microservices, databases, and core server architecture.'
  },
  {
    id: 'aiml-engineer',
    title: 'AI / ML Engineer',
    description: 'Train models, implement deep learning algorithms, LLMs, and intelligent pipelines.'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Extract statistical insights, build predictive analytics, and process complex data.'
  },
  {
    id: 'data-engineer',
    title: 'Data Engineer',
    description: 'Build robust data infrastructure, ETL pipelines, streaming systems, and data lakes.'
  },
  {
    id: 'cloud-engineer',
    title: 'Cloud Engineer',
    description: 'Deploy, automate, and maintain resilient cloud infrastructure on AWS/GCP/Azure.'
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Streamline CI/CD pipelines, container orchestration, monitoring, and developer velocity.'
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst / Engineer',
    description: 'Protect systems, audit vulnerabilities, conduct penetration testing, and security hygiene.'
  },
  {
    id: 'mobile-dev',
    title: 'Mobile App Developer',
    description: 'Develop iOS and Android mobile experiences using React Native, Flutter, Swift, or Kotlin.'
  },
  {
    id: 'ui-ux',
    title: 'UI/UX & Product Designer',
    description: 'Conduct user research, design wireframes, design systems, and delightful digital products.'
  },
  {
    id: 'product-manager',
    title: 'Associate Product Manager',
    description: 'Bridge engineering, business, and user experience to shape product roadmaps.'
  },
  {
    id: 'exploring',
    title: 'I\'m still exploring / Not sure yet',
    description: 'Discover your strengths and find the perfect match with your Career Twin.'
  }
];

export const CAREER_GOALS = [
  { id: 'internship', title: 'Internship', desc: 'Secure an industry internship within this academic year' },
  { id: 'placement', title: 'Campus Placement / Full-time', desc: 'Crack tier-1 dream campus placements and on-campus drives' },
  { id: 'freelancing', title: 'Freelancing & Consulting', desc: 'Build independent client projects and remote income' },
  { id: 'higher-studies', title: 'Higher Studies (MS / M.Tech / MBA)', desc: 'Prepare for top graduate universities and research' },
  { id: 'entrepreneurship', title: 'Startup & Entrepreneurship', desc: 'Launch technical products, MVPs, and tech ventures' },
  { id: 'skill-development', title: 'Pure Skill Development', desc: 'Level up engineering fundamentals without immediate job pressure' },
  { id: 'exploring', title: 'Exploring Career Options', desc: 'Explore diverse tracks before locking in a direction' }
];

export const TARGET_TIMELINES = [
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  'No fixed timeline'
];

export const WORK_LOCATIONS = [
  'India',
  'Remote (Global / India)',
  'Abroad (US / Europe / APAC)',
  'Hybrid',
  'No preference'
];

export const LEARNING_METHODS = [
  { id: 'hands-on', label: 'Hands-on coding', icon: 'Terminal' },
  { id: 'projects', label: 'Building real projects', icon: 'FolderGit2' },
  { id: 'video', label: 'Video tutorials', icon: 'Video' },
  { id: 'practice', label: 'Practice problems & DSA', icon: 'Code' },
  { id: 'docs', label: 'Official Documentation', icon: 'BookOpen' },
  { id: 'quizzes', label: 'Interactive quizzes', icon: 'Sparkles' },
  { id: 'articles', label: 'Articles & Blogs', icon: 'FileText' },
  { id: 'books', label: 'Books & Deep Guides', icon: 'Bookmark' }
];

export const STUDY_TIME_OPTIONS = [
  'Less than 1 hour',
  '1–2 hours',
  '2–3 hours',
  '3–5 hours',
  '5+ hours'
];

export const STUDY_SCHEDULE_OPTIONS = [
  'Morning (Early riser)',
  'Afternoon (Post-college/classes)',
  'Evening (Dedicated study block)',
  'Late night (Night owl)',
  'Flexible (Varies day-to-day)'
];

export const WORKING_STYLES = [
  { id: 'short', label: 'Short focused sessions (25–30 min Pomodoros)', desc: 'Frequent breaks, high intensity' },
  { id: 'deep', label: 'Long deep-work sessions (90–120 min)', desc: 'Immersion and uninterrupted flow' },
  { id: 'mix', label: 'Mix of both', desc: 'Short sprint for theory, deep sessions for coding' }
];

export const REMINDER_PREFERENCES = [
  { id: 'important', label: 'Important reminders only', desc: 'Milestones, roadmap deadlines, and exam prep' },
  { id: 'regular', label: 'Regular reminders', desc: 'Weekly summaries and gentle habit nudges' },
  { id: 'accountability', label: 'Daily accountability', desc: 'Daily check-ins to build unbroken consistency' },
  { id: 'later', label: 'I\'ll decide later', desc: 'Keep it quiet for now' }
];
