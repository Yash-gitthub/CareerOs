import type { SkillProficiency } from '../types/user';

// Tiered questions that verify the level a student claims for a skill.
// Every skill has one question per tier; the number answered correctly sets the
// verified level (0 → Beginner, 1 → Familiar, 2 → Intermediate, 3 → Advanced).

export type VerificationTier = 'basic' | 'intermediate' | 'advanced';

export interface VerificationQuestion {
  id: string;
  skill: string; // bank key, e.g. 'SQL'
  tier: VerificationTier;
  question: string;
  options: string[];
  correct: number;
}

type Tiered = [question: string, options: string[], correct: number];

const set = (skill: string, basic: Tiered, intermediate: Tiered, advanced: Tiered): VerificationQuestion[] => {
  const slug = skill.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return ([['basic', basic], ['intermediate', intermediate], ['advanced', advanced]] as const).map(([tier, [question, options, correct]]) => ({
    id: `v-${slug}-${tier}`,
    skill,
    tier,
    question,
    options,
    correct,
  }));
};

export const VERIFICATION_BANK: Record<string, VerificationQuestion[]> = {
  Python: set('Python',
    ['What does `len([1, 2, 3])` return?', ['2', '3', '4', 'An error'], 1],
    ['What does `[x * 2 for x in range(3)]` evaluate to?', ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '(0, 2, 4)'], 0],
    ['Why is `def f(items=[])` a common Python bug?', ['Lists cannot be default arguments', 'The default list is created once and shared across calls', 'It makes the function a generator', 'It forces items to be a tuple'], 1],
  ),
  Java: set('Java',
    ['Which method is the entry point of a standalone Java program?', ['start()', 'run()', 'public static void main(String[] args)', 'init()'], 2],
    ['What does `==` compare when used on two String objects?', ['Their characters', 'Their references (identity)', 'Their lengths', 'Their hash codes'], 1],
    ['Which collection is safe for concurrent updates from many threads without external locking?', ['HashMap', 'ArrayList', 'ConcurrentHashMap', 'TreeMap'], 2],
  ),
  C: set('C',
    ['Which function prints formatted output in C?', ['print()', 'printf()', 'cout', 'echo()'], 1],
    ['If `int *p = &x;`, what does `*p` give you?', ['The address of x', 'The value stored in x', 'The size of x', 'A copy of the pointer'], 1],
    ['What happens if memory from `malloc` is never passed to `free`?', ['It is freed automatically at the end of the function', 'A memory leak', 'A compile-time error', 'The pointer becomes NULL'], 1],
  ),
  'C++': set('C++',
    ['Which header provides `std::cout`?', ['<stdio.h>', '<iostream>', '<string>', '<vector>'], 1],
    ['What is the main purpose of a virtual function?', ['Faster function calls', 'Runtime polymorphism through base-class pointers', 'Allowing default arguments', 'Making a function inline'], 1],
    ['What does `std::move` actually do?', ['Copies the object', 'Casts to an rvalue reference so the object can be moved from', 'Frees the object\'s memory', 'Moves the object to the heap'], 1],
  ),
  JavaScript: set('JavaScript',
    ['Which keyword declares a variable that cannot be reassigned?', ['var', 'let', 'const', 'static'], 2],
    ['What does `[1, 2, 3].map(x => x * 2)` return?', ['[1, 2, 3]', '[2, 4, 6]', '6', 'undefined'], 1],
    ['In what order are these logged: `console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3));`?', ['1 2 3', '1 3 2', '3 1 2', '2 3 1'], 1],
  ),
  TypeScript: set('TypeScript',
    ['How do you declare that a variable holds a number?', ['let n: number', 'let n = number', 'number n', 'let n<number>'], 0],
    ['What does `Partial<User>` produce?', ['A User with all properties required', 'A User with all properties optional', 'Only the first property of User', 'A read-only User'], 1],
    ['What is a discriminated union mainly used for?', ['Merging two interfaces', 'Narrowing a union by checking a shared literal field', 'Declaring enums at runtime', 'Making types mutable'], 1],
  ),
  HTML: set('HTML',
    ['Which tag creates a hyperlink?', ['<link>', '<a>', '<href>', '<url>'], 1],
    ['Which attribute gives an image a text alternative for screen readers?', ['title', 'alt', 'src', 'name'], 1],
    ['Why should a form input have an associated <label>?', ['It speeds up page load', 'It gives the input an accessible name and a larger click target', 'It is required for the form to submit', 'It validates the input'], 1],
  ),
  CSS: set('CSS',
    ['Which property changes the text color?', ['font-color', 'text-color', 'color', 'foreground'], 2],
    ['Which selector has the highest specificity?', ['.card', 'div', '#header', 'div p'], 2],
    ['What creates a new stacking context so z-index is compared only among its children?', ['display: block', 'position: relative with a z-index (or opacity < 1)', 'margin: auto', 'float: left'], 1],
  ),
  React: set('React',
    ['What is JSX?', ['A database for React', 'A syntax extension that looks like HTML inside JavaScript', 'A CSS framework', 'A testing library'], 1],
    ['Why does React need a `key` on list items?', ['For styling', 'To identify items across renders so it can reconcile them correctly', 'To sort the list', 'To make items clickable'], 1],
    ['What causes a "stale closure" bug in `useEffect`?', ['Using too many effects', 'Reading state or props in an effect whose dependency array omits them', 'Returning a cleanup function', 'Calling setState inside an event handler'], 1],
  ),
  'Node.js': set('Node.js',
    ['Which command installs project dependencies listed in package.json?', ['node install', 'npm install', 'npm start', 'node run'], 1],
    ['Why should you avoid `fs.readFileSync` inside a request handler?', ['It cannot read text files', 'It blocks the event loop so other requests wait', 'It is deprecated', 'It only works on Windows'], 1],
    ['When do callbacks queued with `process.nextTick` run?', ['After all timers', 'Before other queued promise and I/O callbacks, right after the current operation', 'Only on the next HTTP request', 'In a separate thread'], 1],
  ),
  'REST APIs': set('REST APIs',
    ['Which HTTP method is typically used to read a resource?', ['POST', 'GET', 'DELETE', 'PUT'], 1],
    ['What status code should a request for a resource that doesn\'t exist return?', ['200', '301', '404', '500'], 2],
    ['A client retries a payment POST after a timeout. What prevents a double charge?', ['Using GET instead', 'An idempotency key the server checks before processing', 'Returning 204', 'Disabling retries in the browser'], 1],
  ),
  SQL: set('SQL',
    ['Which statement reads rows from a table?', ['GET', 'SELECT', 'FETCH', 'READ'], 1],
    ['What is the difference between WHERE and HAVING?', ['There is none', 'WHERE filters rows before grouping; HAVING filters groups after GROUP BY', 'HAVING is faster', 'WHERE works only on numbers'], 1],
    ['Which transaction isolation anomaly does REPEATABLE READ still allow in the SQL standard?', ['Dirty reads', 'Non-repeatable reads', 'Phantom reads', 'Lost commits'], 2],
  ),
  MongoDB: set('MongoDB',
    ['How does MongoDB store records?', ['Rows in tables', 'Documents in collections', 'Key-value pairs only', 'Graphs'], 1],
    ['Which operator matches documents where a field is greater than a value?', ['$gt', '$more', '$max', '$above'], 0],
    ['When is embedding a sub-document usually better than referencing another collection?', ['When the data is unbounded and shared by many parents', 'When the data is read together with its parent and bounded in size', 'Never; always reference', 'When you need joins'], 1],
  ),
  Redis: set('Redis',
    ['Redis is primarily what kind of data store?', ['Relational database', 'In-memory key-value store', 'File system', 'Search engine'], 1],
    ['Which command sets a key to expire after a number of seconds?', ['EXPIRE', 'DELETE', 'TIMEOUT', 'DROP'], 0],
    ['What is the "cache stampede" problem?', ['Redis running out of keys', 'Many requests rebuilding the same expired key at once and overloading the database', 'Keys being evicted alphabetically', 'Replication lag'], 1],
  ),
  'Machine Learning': set('Machine Learning',
    ['Predicting a house price from features is which kind of task?', ['Classification', 'Regression', 'Clustering', 'Reinforcement learning'], 1],
    ['Why do we keep a separate validation set?', ['To train faster', 'To tune choices on data the model didn\'t train on', 'To increase dataset size', 'To remove outliers'], 1],
    ['What does L2 regularization do to a linear model?', ['Removes features entirely', 'Penalizes large weights to reduce overfitting', 'Increases the learning rate', 'Adds more layers'], 1],
  ),
  'Deep Learning': set('Deep Learning',
    ['What is an epoch?', ['One weight update', 'One full pass over the training data', 'One layer of the network', 'One prediction'], 1],
    ['Why is ReLU often preferred over sigmoid in hidden layers?', ['It outputs probabilities', 'It reduces vanishing gradients and is cheap to compute', 'It never outputs zero', 'It needs no weights'], 1],
    ['What does batch normalization mainly help with?', ['Reducing dataset size', 'Stabilizing and speeding up training by normalizing layer inputs', 'Replacing dropout in all cases', 'Making the model smaller'], 1],
  ),
  Docker: set('Docker',
    ['Which command lists running containers?', ['docker ps', 'docker ls', 'docker images', 'docker run'], 0],
    ['What is the difference between an image and a container?', ['They are the same', 'An image is a template; a container is a running instance of it', 'A container builds images', 'Images run only on Linux'], 1],
    ['Why copy package.json and install dependencies before copying source code in a Dockerfile?', ['Docker requires that order', 'So the dependency layer is cached and reused when only source changes', 'To reduce security risk', 'It makes containers start faster at runtime'], 1],
  ),
  Kubernetes: set('Kubernetes',
    ['Which tool is used to interact with a Kubernetes cluster from the command line?', ['docker', 'kubectl', 'helmctl', 'kubeadm-cli'], 1],
    ['What does a Deployment manage?', ['DNS records', 'A desired number of identical Pod replicas and their rollouts', 'Persistent disks', 'Cluster nodes'], 1],
    ['What is the difference between a liveness and a readiness probe?', ['None', 'Liveness failure restarts the container; readiness failure stops sending it traffic', 'Readiness restarts the Pod', 'Liveness runs only at startup'], 1],
  ),
  Linux: set('Linux',
    ['Which command prints the current directory?', ['ls', 'pwd', 'cd', 'dir'], 1],
    ['What does `chmod 755 script.sh` give the owner?', ['Read only', 'Read, write and execute', 'Execute only', 'No permissions'], 1],
    ['What does `2>&1` do in `cmd > out.log 2>&1`?', ['Runs cmd twice', 'Sends stderr to the same place as stdout', 'Discards all output', 'Appends instead of overwriting'], 1],
  ),
  AWS: set('AWS',
    ['Which AWS service provides object storage?', ['EC2', 'S3', 'RDS', 'Lambda'], 1],
    ['What is an IAM role used for?', ['Billing alerts', 'Granting temporary permissions to services or users without long-lived keys', 'Hosting websites', 'Creating VPCs'], 1],
    ['A Lambda in a private subnet needs to call the internet. What does it need?', ['A public IP on the Lambda', 'A NAT gateway route from the private subnet', 'An S3 bucket policy', 'A larger memory setting'], 1],
  ),
  'CI/CD': set('CI/CD',
    ['What does CI stand for?', ['Code Inspection', 'Continuous Integration', 'Cloud Infrastructure', 'Container Image'], 1],
    ['Where are GitHub Actions workflows defined?', ['package.json', '.github/workflows/*.yml', 'Dockerfile', 'README.md'], 1],
    ['How should a pipeline handle secrets such as deploy keys?', ['Commit them in the repo', 'Store them in the CI secret store and inject them as masked environment variables', 'Print them in logs for debugging', 'Hard-code them in the Dockerfile'], 1],
  ),
  OOP: set('OOP',
    ['What is a class?', ['A running program', 'A blueprint for creating objects', 'A database table', 'A function call'], 1],
    ['What does encapsulation mean?', ['Inheriting from many classes', 'Hiding internal state behind a controlled interface', 'Writing code in one file', 'Using global variables'], 1],
    ['Which SOLID principle says subclasses must be usable wherever their base class is expected?', ['Single responsibility', 'Open/closed', 'Liskov substitution', 'Dependency inversion'], 2],
  ),
  DBMS: set('DBMS',
    ['What does a primary key guarantee?', ['Fast inserts', 'Each row is uniquely identified', 'Data is encrypted', 'Rows are sorted'], 1],
    ['What does the "A" in ACID stand for?', ['Availability', 'Atomicity', 'Accuracy', 'Authorization'], 1],
    ['Why can an index on (last_name, first_name) not speed up a query filtering only on first_name?', ['Indexes only work on numbers', 'A composite index is ordered by its leftmost column first', 'first_name is too long', 'Indexes are ignored for WHERE clauses'], 1],
  ),
  'Operating Systems': set('Operating Systems',
    ['What is a process?', ['A file on disk', 'A program in execution', 'A CPU core', 'A device driver'], 1],
    ['How do threads of the same process differ from separate processes?', ['Threads share the same address space', 'Threads cannot run in parallel', 'Threads each have their own heap', 'There is no difference'], 0],
    ['What is thrashing?', ['A CPU overheating', 'Excessive paging where the system spends more time swapping than executing', 'A deadlock between two threads', 'Disk fragmentation'], 1],
  ),
  'Computer Networks': set('Computer Networks',
    ['What does DNS do?', ['Encrypts traffic', 'Translates domain names to IP addresses', 'Assigns MAC addresses', 'Routes packets between ISPs'], 1],
    ['How many layers does the OSI model have?', ['4', '5', '7', '9'], 2],
    ['Why does TCP use a three-way handshake?', ['To encrypt the connection', 'To synchronize sequence numbers on both sides before sending data', 'To pick a port number', 'To compress headers'], 1],
  ),
  'System Design': set('System Design',
    ['What does a load balancer do?', ['Stores files', 'Distributes incoming requests across servers', 'Compiles code', 'Backs up databases'], 1],
    ['What does horizontal scaling mean?', ['Buying a bigger server', 'Adding more machines to share the load', 'Adding more columns to a table', 'Increasing timeouts'], 1],
    ['By the CAP theorem, what must a distributed store give up during a network partition?', ['Durability or latency', 'Consistency or availability', 'Security or speed', 'Nothing'], 1],
  ),
};

// Profile skill names that are verified with another skill's questions.
const ALIASES: Record<string, string> = {
  mysql: 'SQL',
  postgresql: 'SQL',
  sqlite: 'SQL',
  'github actions': 'CI/CD',
  express: 'Node.js',
};

export const verificationKey = (skill: string): string | null => {
  const norm = skill.trim().toLowerCase();
  if (ALIASES[norm]) return ALIASES[norm];
  return Object.keys(VERIFICATION_BANK).find(k => k.toLowerCase() === norm) || null;
};

export const LEVELS: SkillProficiency[] = ['Beginner', 'Familiar', 'Intermediate', 'Advanced'];

export const levelRank = (level: SkillProficiency | undefined): number => LEVELS.indexOf(level || 'Familiar');

// Questions answered correctly out of 3 → verified level.
export const levelFromCorrect = (correct: number): SkillProficiency => LEVELS[Math.max(0, Math.min(3, correct))];

// DSA is verified by the 10-topic DSA section of the main assessment instead of a tiered set.
export const levelFromPercent = (pct: number): SkillProficiency =>
  pct >= 80 ? 'Advanced' : pct >= 50 ? 'Intermediate' : pct >= 25 ? 'Familiar' : 'Beginner';

// Most skills tested per attempt, so the test stays around 15 minutes.
export const MAX_VERIFIED_SKILLS = 6;
