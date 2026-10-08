// Curated seed list of learning resources (mirrors the learning_resources table).
// Links point to official documentation or long-standing public course pages.
// The team should review and extend this list — recommendations are only ever
// ranked from here, never invented.

export type ResourceType = 'video' | 'documentation' | 'course' | 'article' | 'practice' | 'project';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  skill: string; // skill name, or "DSA:<topicKey>" for DSA topics
  difficulty: Difficulty;
  estMinutes: number;
  provider: string;
}

const r = (
  id: string, title: string, url: string, type: ResourceType, skill: string,
  difficulty: Difficulty, estMinutes: number, provider: string
): LearningResource => ({ id, title, url, type, skill, difficulty, estMinutes, provider });

export const LEARNING_RESOURCES: LearningResource[] = [
  // Programming languages
  r('py-tutorial', 'The Python Tutorial', 'https://docs.python.org/3/tutorial/', 'documentation', 'Python', 'beginner', 360, 'python.org'),
  r('js-guide', 'JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'documentation', 'JavaScript', 'beginner', 480, 'MDN'),
  r('ts-handbook', 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'documentation', 'TypeScript', 'intermediate', 300, 'typescriptlang.org'),
  r('java-learn', 'Learn Java', 'https://dev.java/learn/', 'course', 'Java', 'beginner', 600, 'dev.java'),
  r('cpp-learn', 'LearnCpp', 'https://www.learncpp.com/', 'course', 'C++', 'beginner', 900, 'learncpp.com'),
  r('kotlin-start', 'Kotlin: Get started', 'https://kotlinlang.org/docs/getting-started.html', 'documentation', 'Kotlin', 'beginner', 240, 'kotlinlang.org'),
  r('swift-book', 'The Swift Programming Language', 'https://docs.swift.org/swift-book/', 'documentation', 'Swift', 'beginner', 480, 'swift.org'),

  // Web
  r('react-learn', 'React: Learn', 'https://react.dev/learn', 'course', 'React', 'beginner', 420, 'react.dev'),
  r('next-learn', 'Next.js Learn course', 'https://nextjs.org/learn', 'course', 'Next.js', 'intermediate', 480, 'nextjs.org'),
  r('css-learn', 'Learn CSS', 'https://web.dev/learn/css', 'course', 'CSS', 'beginner', 360, 'web.dev'),
  r('mdn-learn', 'MDN Learn web development', 'https://developer.mozilla.org/en-US/docs/Learn', 'course', 'HTML', 'beginner', 600, 'MDN'),
  r('node-learn', 'Introduction to Node.js', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'documentation', 'Node.js', 'beginner', 240, 'nodejs.org'),
  r('http-overview', 'An overview of HTTP', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'article', 'REST APIs', 'beginner', 45, 'MDN'),

  // Databases
  r('pg-tutorial', 'PostgreSQL Tutorial', 'https://www.postgresql.org/docs/current/tutorial.html', 'documentation', 'PostgreSQL', 'beginner', 240, 'postgresql.org'),
  r('cmu-db', 'CMU 15-445 Database Systems', 'https://15445.courses.cs.cmu.edu/', 'course', 'DBMS', 'advanced', 1800, 'Carnegie Mellon University'),
  r('redis-docs', 'Redis documentation', 'https://redis.io/docs/latest/', 'documentation', 'Redis', 'intermediate', 180, 'redis.io'),
  r('firebase-docs', 'Firebase documentation', 'https://firebase.google.com/docs', 'documentation', 'Firebase', 'beginner', 180, 'Google'),

  // AI / ML
  r('ml-crash', 'Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course', 'course', 'Machine Learning', 'beginner', 900, 'Google'),
  r('sklearn-tut', 'scikit-learn tutorials', 'https://scikit-learn.org/stable/tutorial/index.html', 'documentation', 'Scikit-Learn', 'intermediate', 300, 'scikit-learn.org'),
  r('nn-3b1b', 'Neural networks (visual series)', 'https://www.3blue1brown.com/topics/neural-networks', 'video', 'Deep Learning', 'beginner', 120, '3Blue1Brown'),
  r('cs231n', 'CS231n: Deep Learning for Computer Vision notes', 'https://cs231n.github.io/', 'course', 'Deep Learning', 'advanced', 1200, 'Stanford'),
  r('pytorch-basics', 'PyTorch: Learn the Basics', 'https://pytorch.org/tutorials/beginner/basics/intro.html', 'documentation', 'PyTorch', 'beginner', 240, 'pytorch.org'),
  r('hf-learn', 'Hugging Face courses', 'https://huggingface.co/learn', 'course', 'LLMs', 'intermediate', 900, 'Hugging Face'),
  r('hf-nlp', 'Hugging Face courses (NLP)', 'https://huggingface.co/learn', 'course', 'NLP', 'intermediate', 900, 'Hugging Face'),
  r('contextual-retrieval', 'Introducing Contextual Retrieval', 'https://www.anthropic.com/news/contextual-retrieval', 'article', 'RAG', 'intermediate', 30, 'Anthropic'),
  r('stats-ka', 'Statistics and probability', 'https://www.khanacademy.org/math/statistics-probability', 'course', 'Machine Learning', 'beginner', 900, 'Khan Academy'),

  // Cloud / DevOps
  r('docker-start', 'Docker: Get started', 'https://docs.docker.com/get-started/', 'documentation', 'Docker', 'beginner', 180, 'docker.com'),
  r('k8s-basics', 'Learn Kubernetes Basics', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'course', 'Kubernetes', 'intermediate', 240, 'kubernetes.io'),
  r('aws-start', 'Getting started with AWS', 'https://aws.amazon.com/getting-started/', 'course', 'AWS', 'beginner', 300, 'AWS'),
  r('tf-tutorials', 'Terraform tutorials', 'https://developer.hashicorp.com/terraform/tutorials', 'course', 'Terraform', 'intermediate', 300, 'HashiCorp'),
  r('gh-actions', 'GitHub Actions documentation', 'https://docs.github.com/en/actions', 'documentation', 'GitHub Actions', 'beginner', 180, 'GitHub'),
  r('gh-actions-cicd', 'GitHub Actions for CI/CD', 'https://docs.github.com/en/actions', 'documentation', 'CI/CD', 'beginner', 180, 'GitHub'),
  r('linux-journey', 'Linux Journey', 'https://linuxjourney.com/', 'course', 'Linux', 'beginner', 600, 'linuxjourney.com'),
  r('git-book', 'Pro Git book', 'https://git-scm.com/book/en/v2', 'documentation', 'Git', 'beginner', 480, 'git-scm.com'),

  // Security
  r('owasp-top10', 'OWASP Top Ten', 'https://owasp.org/www-project-top-ten/', 'article', 'Information Security', 'beginner', 90, 'OWASP'),
  r('portswigger', 'Web Security Academy', 'https://portswigger.net/web-security', 'practice', 'Information Security', 'intermediate', 1200, 'PortSwigger'),

  // Core CS
  r('ostep', 'Operating Systems: Three Easy Pieces', 'https://pages.cs.wisc.edu/~remzi/OSTEP/', 'course', 'Operating Systems', 'intermediate', 1800, 'UW–Madison'),
  r('beej-net', "Beej's Guide to Network Programming", 'https://beej.us/guide/bgnet/', 'documentation', 'Computer Networks', 'intermediate', 480, 'beej.us'),
  r('refactoring-guru', 'Design Patterns', 'https://refactoring.guru/design-patterns', 'article', 'OOP', 'intermediate', 300, 'Refactoring.Guru'),
  r('sd-primer', 'The System Design Primer', 'https://github.com/donnemartin/system-design-primer', 'article', 'System Design', 'intermediate', 900, 'GitHub'),

  // DSA
  r('neetcode-roadmap', 'NeetCode roadmap', 'https://neetcode.io/roadmap', 'practice', 'DSA', 'beginner', 2400, 'NeetCode'),
  r('cp-algorithms', 'CP-Algorithms', 'https://cp-algorithms.com/', 'documentation', 'DSA', 'advanced', 1200, 'cp-algorithms.com'),
  r('lc-array', 'LeetCode: Array problems', 'https://leetcode.com/tag/array/', 'practice', 'DSA:arrays', 'beginner', 300, 'LeetCode'),
  r('lc-string', 'LeetCode: String problems', 'https://leetcode.com/tag/string/', 'practice', 'DSA:strings', 'beginner', 300, 'LeetCode'),
  r('lc-ll', 'LeetCode: Linked List problems', 'https://leetcode.com/tag/linked-list/', 'practice', 'DSA:linked_lists', 'beginner', 240, 'LeetCode'),
  r('lc-stack', 'LeetCode: Stack problems', 'https://leetcode.com/tag/stack/', 'practice', 'DSA:stack', 'intermediate', 240, 'LeetCode'),
  r('lc-queue', 'LeetCode: Queue problems', 'https://leetcode.com/tag/queue/', 'practice', 'DSA:queue', 'intermediate', 180, 'LeetCode'),
  r('lc-tree', 'LeetCode: Tree problems', 'https://leetcode.com/tag/tree/', 'practice', 'DSA:trees', 'intermediate', 360, 'LeetCode'),
  r('lc-graph', 'LeetCode: Graph problems', 'https://leetcode.com/tag/graph/', 'practice', 'DSA:graphs', 'intermediate', 360, 'LeetCode'),
  r('cpa-graphs', 'CP-Algorithms: Graph traversal (BFS)', 'https://cp-algorithms.com/graph/breadth-first-search.html', 'article', 'DSA:graphs', 'intermediate', 45, 'cp-algorithms.com'),
  r('lc-sorting', 'LeetCode: Sorting problems', 'https://leetcode.com/tag/sorting/', 'practice', 'DSA:sorting', 'beginner', 240, 'LeetCode'),
  r('lc-bsearch', 'LeetCode: Binary Search problems', 'https://leetcode.com/tag/binary-search/', 'practice', 'DSA:searching', 'intermediate', 240, 'LeetCode'),
  r('lc-backtracking', 'LeetCode: Backtracking problems', 'https://leetcode.com/tag/backtracking/', 'practice', 'DSA:recursion', 'intermediate', 240, 'LeetCode'),
  r('lc-greedy', 'LeetCode: Greedy problems', 'https://leetcode.com/tag/greedy/', 'practice', 'DSA:greedy', 'intermediate', 240, 'LeetCode'),
  r('lc-dp', 'LeetCode: Dynamic Programming problems', 'https://leetcode.com/tag/dynamic-programming/', 'practice', 'DSA:dp', 'advanced', 480, 'LeetCode'),
];

// Map onboarding learning-method labels to the resource formats they prefer.
export const METHOD_TO_TYPES: Record<string, ResourceType[]> = {
  'Hands-on coding': ['practice', 'project'],
  'Building real projects': ['project', 'practice'],
  'Video tutorials': ['video', 'course'],
  'Practice problems & DSA': ['practice'],
  'Official Documentation': ['documentation'],
  'Interactive quizzes': ['practice', 'course'],
  'Articles & Blogs': ['article'],
  'Books & Deep Guides': ['documentation', 'course'],
};
