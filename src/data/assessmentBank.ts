import type { AssessmentSection } from '../engine/types';
import type { Domain } from '../engine/roleRequirements';

export interface AssessmentQuestion {
  id: string;
  section: AssessmentSection;
  topic: string; // DSA topic key, core CS key, 'programming', or domain skill
  question: string;
  options: string[];
  correct: number;
}

const q = (
  id: string, section: AssessmentSection, topic: string,
  question: string, options: string[], correct: number
): AssessmentQuestion => ({ id, section, topic, question, options, correct });

export const PROGRAMMING_QUESTIONS: AssessmentQuestion[] = [
  q('p1', 'programming', 'programming', 'What does a function return in most languages if it reaches the end without a return statement (e.g. Python)?',
    ['0', 'An empty string', 'None / undefined / void', 'It raises a compile error'], 2),
  q('p2', 'programming', 'programming', 'Which statement about pass-by-reference semantics for mutable objects (e.g. a Python list passed to a function) is correct?',
    ['The function receives a deep copy', 'Mutations inside the function are visible to the caller', 'The list becomes immutable inside the function', 'Only primitive values can be passed'], 1),
  q('p3', 'programming', 'programming', 'What is the output of integer division 7 // 2 in Python?',
    ['3.5', '3', '4', '2'], 1),
  q('p4', 'programming', 'programming', 'Which construct is best for handling an operation that may fail at runtime, such as reading a file?',
    ['A while loop', 'try / catch (except) blocks', 'A switch statement', 'Recursion'], 1),
  q('p5', 'programming', 'programming', 'A hash map lookup by key has what average time complexity?',
    ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'], 0),
];

export const DSA_QUESTIONS: AssessmentQuestion[] = [
  q('d-arrays', 'dsa', 'arrays', 'Which technique finds a pair summing to a target in a sorted array in O(N) time?',
    ['Nested loops', 'Two pointers from both ends', 'Binary search for every pair', 'Sorting again'], 1),
  q('d-strings', 'dsa', 'strings', 'What is the most efficient way to check whether two strings are anagrams?',
    ['Compare all permutations', 'Count character frequencies and compare', 'Compare lengths only', 'Reverse one string and compare'], 1),
  q('d-ll', 'dsa', 'linked_lists', 'How do you detect a cycle in a singly linked list using O(1) extra space?',
    ['Store visited nodes in a set', 'Fast and slow pointers (Floyd)', 'Reverse the list', 'Sort the nodes'], 1),
  q('d-stack', 'dsa', 'stack', 'Which data structure is the natural fit for checking balanced parentheses?',
    ['Queue', 'Stack', 'Heap', 'Graph'], 1),
  q('d-queue', 'dsa', 'queue', 'Breadth-first traversal of a tree level by level typically uses which structure?',
    ['Stack', 'Queue', 'Hash set', 'Trie'], 1),
  q('d-trees', 'dsa', 'trees', 'An in-order traversal of a Binary Search Tree visits nodes in what order?',
    ['Random order', 'Sorted ascending order', 'Level order', 'Reverse insertion order'], 1),
  q('d-graphs', 'dsa', 'graphs', 'Which algorithm finds the shortest path in an unweighted graph?',
    ['Depth-first search', 'Breadth-first search', 'Kruskal\'s algorithm', 'Topological sort'], 1),
  q('d-sorting', 'dsa', 'sorting', 'What is the worst-case time complexity of Merge Sort?',
    ['O(N)', 'O(N log N)', 'O(N²)', 'O(log N)'], 1),
  q('d-search', 'dsa', 'searching', 'Binary search requires the input to be:',
    ['Unsorted', 'Sorted (or monotonic)', 'A linked list', 'Unique values only'], 1),
  q('d-dp', 'dsa', 'dp', 'Dynamic programming is applicable when a problem has:',
    ['No repeated work', 'Overlapping subproblems and optimal substructure', 'Only one input', 'A greedy choice property only'], 1),
];

export const CORE_CS_QUESTIONS: AssessmentQuestion[] = [
  q('c-oop', 'core_cs', 'oop', 'Which OOP principle lets a subclass provide its own implementation of a parent method?',
    ['Encapsulation', 'Polymorphism (method overriding)', 'Abstraction', 'Composition'], 1),
  q('c-dbms', 'core_cs', 'dbms', 'Which normal form removes partial dependency on a composite primary key?',
    ['1NF', '2NF', '3NF', 'BCNF'], 1),
  q('c-os', 'core_cs', 'os', 'A deadlock requires mutual exclusion, hold-and-wait, no preemption, and:',
    ['Starvation', 'Circular wait', 'Paging', 'Context switching'], 1),
  q('c-cn', 'core_cs', 'cn', 'Which transport protocol guarantees ordered, reliable delivery?',
    ['UDP', 'TCP', 'IP', 'ICMP'], 1),
  q('c-coa', 'core_cs', 'coa', 'What is the main purpose of CPU cache memory?',
    ['Permanent storage', 'Reduce average memory access time', 'Increase disk size', 'Manage network packets'], 1),
];

export const DOMAIN_QUESTIONS: Record<Domain, AssessmentQuestion[]> = {
  aiml: [
    q('a1', 'domain', 'Machine Learning', 'A model performs well on training data but poorly on validation data. This is:',
      ['Underfitting', 'Overfitting', 'Data leakage', 'Convergence'], 1),
    q('a2', 'domain', 'Machine Learning', 'Which metric is most informative for a heavily imbalanced binary classification problem?',
      ['Accuracy', 'F1-score / PR-AUC', 'Mean squared error', 'R²'], 1),
    q('a3', 'domain', 'Deep Learning', 'What does backpropagation compute?',
      ['The model\'s predictions', 'Gradients of the loss with respect to the weights', 'The learning rate', 'The batch size'], 1),
    q('a4', 'domain', 'LLMs', 'In a transformer, what does self-attention allow each token to do?',
      ['Skip the embedding layer', 'Weigh information from other tokens in the sequence', 'Reduce vocabulary size', 'Avoid training'], 1),
    q('a5', 'domain', 'RAG', 'Retrieval-Augmented Generation mainly improves an LLM by:',
      ['Increasing its parameter count', 'Grounding answers in retrieved documents', 'Removing the tokenizer', 'Training without data'], 1),
  ],
  web: [
    q('w1', 'domain', 'JavaScript', 'What does `await` do inside an async function?',
      ['Blocks the whole browser', 'Pauses the function until the promise settles', 'Creates a new thread', 'Converts a value to a string'], 1),
    q('w2', 'domain', 'React', 'In React, when does a component re-render?',
      ['Only on page reload', 'When its state or props change', 'Every second', 'Only when the DOM is clicked'], 1),
    q('w3', 'domain', 'CSS', 'Which CSS layout is designed for two-dimensional (rows and columns) layouts?',
      ['Flexbox', 'Grid', 'Float', 'Inline-block'], 1),
    q('w4', 'domain', 'HTML', 'Why use semantic HTML elements like <nav> and <main>?',
      ['They load faster', 'Accessibility and meaning for assistive tech and SEO', 'They replace CSS', 'They are required by JavaScript'], 1),
    q('w5', 'domain', 'TypeScript', 'What is the main benefit of TypeScript over JavaScript?',
      ['Faster runtime', 'Static type checking at compile time', 'No need for a browser', 'Automatic styling'], 1),
  ],
  backend: [
    q('b1', 'domain', 'REST APIs', 'Which HTTP status code best represents a successfully created resource?',
      ['200 OK', '201 Created', '204 No Content', '302 Found'], 1),
    q('b2', 'domain', 'PostgreSQL', 'What does adding an index on a frequently filtered column usually do?',
      ['Slows down reads', 'Speeds up reads at some write/storage cost', 'Deletes duplicates', 'Encrypts the column'], 1),
    q('b3', 'domain', 'System Design', 'Which technique helps a read-heavy service scale and reduce database load?',
      ['Removing indexes', 'Caching (e.g. Redis) frequently read data', 'Using a single thread', 'Disabling pagination'], 1),
    q('b4', 'domain', 'REST APIs', 'An idempotent HTTP method produces the same result when repeated. Which is idempotent?',
      ['POST', 'PUT', 'PATCH (always)', 'None of them'], 1),
    q('b5', 'domain', 'Docker', 'What does a Docker container image package?',
      ['Only source code', 'An application with its runtime and dependencies', 'A full virtual machine with its own kernel', 'Database backups'], 1),
  ],
  cloud: [
    q('k1', 'domain', 'Docker', 'How does a container differ from a virtual machine?',
      ['Containers include a full guest OS', 'Containers share the host kernel', 'Containers cannot run Linux', 'There is no difference'], 1),
    q('k2', 'domain', 'Kubernetes', 'In Kubernetes, what is a Pod?',
      ['A physical server', 'The smallest deployable unit, wrapping one or more containers', 'A load balancer', 'A storage bucket'], 1),
    q('k3', 'domain', 'CI/CD', 'What is the main goal of a CI pipeline?',
      ['Manually deploying code', 'Automatically building and testing every change', 'Writing documentation', 'Monitoring costs'], 1),
    q('k4', 'domain', 'Linux', 'Which command shows running processes on a Linux system?',
      ['ls', 'ps', 'cd', 'mv'], 1),
    q('k5', 'domain', 'Information Security', 'What does the principle of least privilege mean?',
      ['Give admins full access', 'Grant only the permissions needed for a task', 'Disable all passwords', 'Encrypt everything twice'], 1),
  ],
};

export const COMMUNICATION_ITEMS = [
  'I can clearly explain a technical project I built to a non-technical person.',
  'I am comfortable thinking out loud while solving a problem in an interview.',
  'I can write clear documentation / README files for my projects.',
  'I can present my work confidently in front of a group.',
];

export const buildAssessment = (domain: Domain): AssessmentQuestion[] => [
  ...PROGRAMMING_QUESTIONS,
  ...DSA_QUESTIONS,
  ...CORE_CS_QUESTIONS,
  ...DOMAIN_QUESTIONS[domain],
];

export const ASSESSMENT_VERSION = 'v1';
