export type UserRole = 'student' | 'mentor' | 'placement_officer';

export type SkillProficiency = 'Beginner' | 'Familiar' | 'Intermediate' | 'Advanced';

export interface SelectedSkill {
  name: string;
  category: string;
  level?: SkillProficiency; // what the student claimed
  verifiedLevel?: SkillProficiency; // what the skill verification test measured
  verifiedAt?: string;
}

export interface EducationInfo {
  degree: string;
  branch: string;
  year: string;
  semester: string;
  college: string;
  graduationYear: string;
  cgpa?: string;
  backlogs?: string;
}

export interface SkillsProfile {
  programming: SelectedSkill[];
  web: SelectedSkill[];
  database: SelectedSkill[];
  aiMl: SelectedSkill[];
  cloudDevOps: SelectedSkill[];
  coreCS: SelectedSkill[];
}

export interface CareerDirection {
  interestedRoles: string[];
  targetRole: string;
  dreamCompany: string;
  goal: string;
  timeline: string;
  preferredLocation?: string;
}

export interface LearningPreferences {
  methods: string[];
  dailyStudyTime: string;
  preferredStudyTime: string;
  workingStyle: string;
  reminderPreference: string;
}

export interface CareerTwinState {
  currentLevel: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  readinessScore: string | null;
  consistencyScore: string | null;
  status: 'pending_assessment' | 'ready' | 'analyzing';
  lastUpdated: string;
}

// 'cloud': backed by a Supabase Auth account (id === auth.users.id)
// 'local': Supabase not configured; data lives only in this browser
// 'demo':  sandbox session, never synced
export type AccountType = 'cloud' | 'local' | 'demo';

export interface UserProfile {
  id: string;
  accountType?: AccountType;
  fullName: string;
  email: string;
  // Form-only fields. Stripped before persisting anywhere (see sanitizeForStorage).
  password?: string;
  confirmPassword?: string;
  phone: string;
  profilePhoto?: string;
  role: UserRole;
  createdAt: string;
  registrationSource: string;
  education: EducationInfo;
  skills: SkillsProfile;
  career: CareerDirection;
  learningPreferences: LearningPreferences;
  careerTwin: CareerTwinState;
}

export type OnboardingScreen =
  | 'welcome'
  | 'role-selection'
  | 'login'
  | 'mentor-registration'
  | 'step-1-profile'
  | 'step-2-education'
  | 'step-3-skills'
  | 'step-4-career'
  | 'step-5-goals'
  | 'step-6-preferences'
  | 'step-7-review'
  | 'twin-generation'
  | 'dashboard';
