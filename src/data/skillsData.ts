export interface SkillCategoryItem {
  id: string;
  name: string;
  categoryKey: 'programming' | 'web' | 'database' | 'aiMl' | 'cloudDevOps' | 'coreCS';
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategoryItem[] = [
  {
    id: 'programming',
    name: 'Programming Languages',
    categoryKey: 'programming',
    skills: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Kotlin', 'Go', 'Rust', 'Swift', 'C#', 'PHP']
  },
  {
    id: 'web',
    name: 'Web Development',
    categoryKey: 'web',
    skills: ['HTML', 'CSS', 'React', 'Next.js', 'Node.js', 'Express', 'Spring Boot', 'FastAPI', 'Vue.js', 'Angular', 'Tailwind CSS', 'Django', 'GraphQL', 'REST APIs']
  },
  {
    id: 'database',
    name: 'Databases & Storage',
    categoryKey: 'database',
    skills: ['MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'Redis', 'Supabase', 'SQLite', 'Cassandra', 'DynamoDB', 'Neo4j']
  },
  {
    id: 'aiMl',
    name: 'AI & Machine Learning',
    categoryKey: 'aiMl',
    skills: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Generative AI', 'LLMs', 'RAG', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Hugging Face', 'LangChain', 'OpenCV']
  },
  {
    id: 'cloudDevOps',
    name: 'Cloud & DevOps',
    categoryKey: 'cloudDevOps',
    skills: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'Linux', 'Terraform', 'Nginx', 'Vercel']
  },
  {
    id: 'coreCS',
    name: 'Core Computer Science',
    categoryKey: 'coreCS',
    skills: ['DSA', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'System Design', 'Software Engineering', 'Compiler Design', 'Information Security']
  }
];
