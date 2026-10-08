import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, OnboardingScreen, SelectedSkill, SkillProficiency } from '../types/user';
import {
  syncProfileToSupabase,
  fetchOwnProfile,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getSession,
  isSupabaseConfigured,
  supabase
} from '../lib/supabase';
import { clearAllCareerState } from '../store/keys';


const STORAGE_KEY = 'ai_careeros_user_profile';
const SCREEN_KEY = 'ai_careeros_active_screen';

// Credentials must never reach localStorage or the database.
const sanitizeForStorage = (profile: UserProfile): UserProfile => {
  const copy = { ...profile };
  delete copy.password;
  delete copy.confirmPassword;
  return copy;
};

// A password is only collected when it will create a real Supabase account.
export const needsPassword = (profile: UserProfile): boolean =>
  isSupabaseConfigured && profile.accountType !== 'cloud' && profile.accountType !== 'demo';

const isOnboardingComplete = (profile: UserProfile) => profile.careerTwin?.status === 'ready';

const createInitialProfile = (): UserProfile => ({
  id: 'usr_' + Math.random().toString(36).substring(2, 9),
  accountType: isSupabaseConfigured ? undefined : 'local',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  profilePhoto: '',
  role: 'student',
  createdAt: new Date().toISOString(),
  registrationSource: 'Direct Web Registration',
  education: {
    degree: 'B.E. (Bachelor of Engineering)',
    branch: 'Computer Engineering',
    year: 'Third Year (TE / 3rd Year)',
    semester: 'Semester 5',
    college: '',
    graduationYear: '2026',
    cgpa: '',
    backlogs: 'None (All clear)',
  },
  skills: {
    programming: [],
    web: [],
    database: [],
    aiMl: [],
    cloudDevOps: [],
    coreCS: [],
  },
  career: {
    interestedRoles: ['AI / ML Engineer'],
    targetRole: 'AI / ML Engineer',
    dreamCompany: 'NVIDIA',
    goal: 'Campus Placement / Full-time',
    timeline: '1 year',
    preferredLocation: 'India',
  },
  learningPreferences: {
    methods: ['Building real projects', 'Hands-on coding', 'Video tutorials'],
    dailyStudyTime: '2–3 hours',
    preferredStudyTime: 'Evening (Dedicated study block)',
    workingStyle: 'Mix of both',
    reminderPreference: 'Regular reminders',
  },
  careerTwin: {
    currentLevel: 'Undergraduate Explorer',
    strengths: [],
    weaknesses: [],
    skillGaps: [],
    readinessScore: null,
    consistencyScore: null,
    status: 'pending_assessment',
    lastUpdated: new Date().toISOString(),
  }
});

interface ValidationErrors {
  [key: string]: string;
}

interface OnboardingContextType {
  user: UserProfile;
  currentScreen: OnboardingScreen;
  errors: ValidationErrors;
  setCurrentScreen: (screen: OnboardingScreen) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateEducation: (updates: Partial<UserProfile['education']>) => void;
  updateCareer: (updates: Partial<UserProfile['career']>) => void;
  updatePreferences: (updates: Partial<UserProfile['learningPreferences']>) => void;
  toggleSkill: (categoryKey: keyof UserProfile['skills'], skillName: string, level?: SkillProficiency) => void;
  setSkillLevel: (categoryKey: keyof UserProfile['skills'], skillName: string, level: SkillProficiency) => void;
  hasSkill: (categoryKey: keyof UserProfile['skills'], skillName: string) => boolean;
  getSkillLevel: (categoryKey: keyof UserProfile['skills'], skillName: string) => SkillProficiency | undefined;
  validateStep: (stepNumber: number) => boolean;
  clearError: (field: string) => void;
  setError: (field: string, message: string) => void;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  goToStep: (stepNumber: number) => void;
  resetAll: () => Promise<void>;
  completeOnboarding: () => void;
  loginAsDemoUser: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  syncToDatabase: (overrideUser?: UserProfile) => Promise<boolean>;
  isSyncing: boolean;
  isAuthenticating: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  dbStatus: 'synced' | 'unsynced' | 'connecting';
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Older builds persisted the password; drop it on load.
        return sanitizeForStorage(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
    return createInitialProfile();
  });

  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(() => {
    try {
      const saved = localStorage.getItem(SCREEN_KEY);
      if (saved) {
        return saved as OnboardingScreen;
      }
    } catch {
      // Fallback
    }
    return 'welcome';
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'synced' | 'unsynced' | 'connecting'>('unsynced');

  // Sync with local storage (credentials stripped)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForStorage(user)));
    } catch (e) {
      console.warn('Could not save profile to localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(SCREEN_KEY, currentScreen);
    } catch (e) {
      console.warn('Could not save screen to localStorage', e);
    }
  }, [currentScreen]);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Set while we sign out on purpose, so the auth listener doesn't also reset state.
  const intentionalSignOut = useRef(false);

  const signOutIntentionally = async () => {
    intentionalSignOut.current = true;
    try {
      await signOut();
    } finally {
      intentionalSignOut.current = false;
    }
  };

  // Session guard: a cloud account may only see the dashboard with a valid session for that account.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    getSession().then(session => {
      if (cancelled) return;
      const current = userRef.current;
      if (current.accountType !== 'cloud') return;
      if (!session || session.user.id !== current.id) {
        setCurrentScreen(prev => (prev === 'dashboard' ? 'login' : prev));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(event => {
      if (event !== 'SIGNED_OUT' || intentionalSignOut.current) return;
      if (userRef.current.accountType !== 'cloud') return;
      // Session ended elsewhere (expired, revoked, signed out in another tab).
      localStorage.removeItem(STORAGE_KEY);
      setUser(createInitialProfile());
      setCurrentScreen('login');
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const clearError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const updateEducation = (updates: Partial<UserProfile['education']>) => {
    setUser(prev => ({
      ...prev,
      education: { ...prev.education, ...updates }
    }));
  };

  const updateCareer = (updates: Partial<UserProfile['career']>) => {
    setUser(prev => ({
      ...prev,
      career: { ...prev.career, ...updates }
    }));
  };

  const updatePreferences = (updates: Partial<UserProfile['learningPreferences']>) => {
    setUser(prev => ({
      ...prev,
      learningPreferences: { ...prev.learningPreferences, ...updates }
    }));
  };

  const toggleSkill = (categoryKey: keyof UserProfile['skills'], skillName: string, level?: SkillProficiency) => {
    setUser(prev => {
      const currentList = prev.skills[categoryKey] || [];
      const exists = currentList.some(s => s.name.toLowerCase() === skillName.toLowerCase());
      
      let updatedList: SelectedSkill[];
      if (exists) {
        updatedList = currentList.filter(s => s.name.toLowerCase() !== skillName.toLowerCase());
      } else {
        updatedList = [...currentList, { name: skillName, category: categoryKey, level: level || 'Intermediate' }];
      }

      return {
        ...prev,
        skills: {
          ...prev.skills,
          [categoryKey]: updatedList
        }
      };
    });
  };

  const setSkillLevel = (categoryKey: keyof UserProfile['skills'], skillName: string, level: SkillProficiency) => {
    setUser(prev => {
      const currentList = prev.skills[categoryKey] || [];
      const updatedList = currentList.map(s => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          return { ...s, level };
        }
        return s;
      });

      return {
        ...prev,
        skills: {
          ...prev.skills,
          [categoryKey]: updatedList
        }
      };
    });
  };

  const hasSkill = (categoryKey: keyof UserProfile['skills'], skillName: string): boolean => {
    return (user.skills[categoryKey] || []).some(s => s.name.toLowerCase() === skillName.toLowerCase());
  };

  const getSkillLevel = (categoryKey: keyof UserProfile['skills'], skillName: string): SkillProficiency | undefined => {
    return (user.skills[categoryKey] || []).find(s => s.name.toLowerCase() === skillName.toLowerCase())?.level;
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (stepNumber === 1) {
      if (!user.fullName.trim()) {
        newErrors.fullName = 'Please enter your full name to get started.';
      }
      if (!user.email.trim()) {
        newErrors.email = 'Please enter your email address.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        newErrors.email = "That email doesn't look right. Check it and try again.";
      }
      
      if (needsPassword(user)) {
        if (!user.password) {
          newErrors.password = 'Please create a password for your account.';
        } else if (user.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long.';
        } else if (!/[0-9]/.test(user.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(user.password)) {
          newErrors.password = 'Include at least one number and one special character.';
        }

        if (user.password && user.password !== user.confirmPassword) {
          newErrors.confirmPassword = "Passwords don't match. Please re-enter.";
        }
      }

      if (!user.phone.trim()) {
        newErrors.phone = 'Please enter a valid contact phone number.';
      } else if (!/^\+?[\d\s-]{8,15}$/.test(user.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number (8-15 digits).';
      }
    }

    if (stepNumber === 2) {
      if (!user.education.degree) {
        newErrors.degree = 'Please select your degree.';
      }
      if (!user.education.branch) {
        newErrors.branch = 'Please choose your branch or specialization.';
      }
      if (!user.education.year) {
        newErrors.year = 'Choose your current year to continue.';
      }
      if (!user.education.college.trim()) {
        newErrors.college = 'Please enter or select your college/university name.';
      }
      if (!user.education.graduationYear) {
        newErrors.graduationYear = 'Please select your expected graduation year.';
      }
    }

    if (stepNumber === 3) {
      const totalSkills = Object.values(user.skills).reduce((acc, curr) => acc + curr.length, 0);
      if (totalSkills === 0) {
        newErrors.skills = 'Select at least 1 or 2 skills you are familiar with, or choose your primary language.';
      }
    }

    if (stepNumber === 4) {
      if (user.career.interestedRoles.length === 0) {
        newErrors.interestedRoles = 'Select at least one career direction or choose "Still exploring".';
      }
    }

    if (stepNumber === 5) {
      if (!user.career.goal) {
        newErrors.goal = 'Please select your primary career goal.';
      }
      if (!user.career.timeline) {
        newErrors.timeline = 'Please select your target timeline.';
      }
    }

    if (stepNumber === 6) {
      if (user.learningPreferences.methods.length === 0) {
        newErrors.methods = 'Select at least one preferred learning style.';
      }
      if (!user.learningPreferences.dailyStudyTime) {
        newErrors.dailyStudyTime = 'Select how much time you can realistically give each day.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    switch (currentScreen) {
      case 'step-1-profile': {
        if (!validateStep(1)) break;

        if (needsPassword(user)) {
          setIsAuthenticating(true);
          const res = await signUpWithEmail(user.email.trim(), user.password || '', user.fullName.trim());
          setIsAuthenticating(false);

          if (!res.success) {
            setError('email', res.error);
            break;
          }

          setUser(prev => sanitizeForStorage({ ...prev, id: res.userId, email: prev.email.trim(), accountType: 'cloud' }));
          setAuthNotice(
            res.hasSession
              ? null
              : `We sent a confirmation link to ${user.email.trim()}. Your progress is saved on this device and will sync to the cloud after you confirm and sign in.`
          );
        } else {
          setUser(prev => sanitizeForStorage(prev));
        }

        setCurrentScreen('step-2-education');
        break;
      }
      case 'step-2-education':
        if (validateStep(2)) setCurrentScreen('step-3-skills');
        break;
      case 'step-3-skills':
        if (validateStep(3)) setCurrentScreen('step-4-career');
        break;
      case 'step-4-career':
        if (validateStep(4)) setCurrentScreen('step-5-goals');
        break;
      case 'step-5-goals':
        if (validateStep(5)) setCurrentScreen('step-6-preferences');
        break;
      case 'step-6-preferences':
        if (validateStep(6)) setCurrentScreen('step-7-review');
        break;
      case 'step-7-review':
        setCurrentScreen('twin-generation');
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentScreen) {
      case 'role-selection':
        setCurrentScreen('welcome');
        break;
      case 'login':
        setCurrentScreen('welcome');
        break;
      case 'mentor-registration':
        setCurrentScreen('role-selection');
        break;
      case 'step-1-profile':
        setCurrentScreen('role-selection');
        break;
      case 'step-2-education':
        setCurrentScreen('step-1-profile');
        break;
      case 'step-3-skills':
        setCurrentScreen('step-2-education');
        break;
      case 'step-4-career':
        setCurrentScreen('step-3-skills');
        break;
      case 'step-5-goals':
        setCurrentScreen('step-4-career');
        break;
      case 'step-6-preferences':
        setCurrentScreen('step-5-goals');
        break;
      case 'step-7-review':
        setCurrentScreen('step-6-preferences');
        break;
      default:
        break;
    }
  };

  const goToStep = (stepNumber: number) => {
    const screens: OnboardingScreen[] = [
      'step-1-profile',
      'step-2-education',
      'step-3-skills',
      'step-4-career',
      'step-5-goals',
      'step-6-preferences',
      'step-7-review'
    ];
    if (stepNumber >= 1 && stepNumber <= 7) {
      setCurrentScreen(screens[stepNumber - 1]);
    }
  };

  // Signs out (for cloud accounts) and clears everything stored on this device.
  const resetAll = async () => {
    if (user.accountType === 'cloud') {
      // Career data for cloud accounts is kept (keyed by user id) so signing back in restores it.
      await signOutIntentionally();
    } else {
      clearAllCareerState();
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SCREEN_KEY);
    setUser(createInitialProfile());
    setCurrentScreen('welcome');
    setErrors({});
    setAuthNotice(null);
    setDbStatus('unsynced');
  };

  const syncToDatabase = useCallback(async (overrideUser?: UserProfile): Promise<boolean> => {
    const profileToSync = overrideUser || user;
    // Only real accounts sync; demo and local-only profiles stay on this device.
    if (profileToSync.accountType !== 'cloud') return false;
    setIsSyncing(true);
    try {
      const res = await syncProfileToSupabase(profileToSync);
      if (res.success) {
        setDbStatus('synced');
        return true;
      } else {
        setDbStatus('unsynced');
        return false;
      }
    } catch {
      setDbStatus('unsynced');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Local-only mode: there is no server to verify credentials, so sign-in can only
    // reopen the profile already stored in this browser.
    if (!isSupabaseConfigured) {
      if (user.email && user.email.toLowerCase() === normalizedEmail) {
        setCurrentScreen(isOnboardingComplete(user) ? 'dashboard' : 'step-1-profile');
        return { success: true };
      }
      return {
        success: false,
        error: 'Cloud accounts are not configured on this deployment. Only a profile created in this browser can be reopened.'
      };
    }

    setIsAuthenticating(true);
    try {
      const res = await signInWithEmail(normalizedEmail, password);
      if (!res.success) return res;

      const fetched = await fetchOwnProfile(res.userId);
      if (fetched) {
        setUser(fetched);
        setDbStatus('synced');
        setAuthNotice(null);
        setCurrentScreen(isOnboardingComplete(fetched) ? 'dashboard' : 'step-2-education');
        return { success: true };
      }

      // No cloud profile yet (e.g. onboarding finished before the email was confirmed).
      // Adopt the profile on this device if it belongs to the same email, otherwise start onboarding.
      const local = userRef.current;
      const adopted: UserProfile =
        local.email && local.email.trim().toLowerCase() === normalizedEmail
          ? { ...sanitizeForStorage(local), id: res.userId, accountType: 'cloud' }
          : { ...createInitialProfile(), id: res.userId, email: normalizedEmail, accountType: 'cloud' };

      setUser(adopted);
      setAuthNotice(null);
      if (isOnboardingComplete(adopted)) {
        setCurrentScreen('dashboard');
        await syncToDatabase(adopted);
      } else {
        setCurrentScreen(adopted.fullName ? 'step-2-education' : 'step-1-profile');
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const completeOnboarding = () => {
    const updatedUser: UserProfile = {
      ...user,
      careerTwin: {
        ...user.careerTwin,
        status: 'ready',
        lastUpdated: new Date().toISOString()
      }
    };
    setUser(updatedUser);
    setCurrentScreen('dashboard');
    syncToDatabase(updatedUser);
  };


  // Sandbox profile with sample onboarding answers. Never synced; the Career Twin starts
  // empty and is filled only by real activity (no fabricated strengths or scores).
  const loginAsDemoUser = async () => {
    if (user.accountType === 'cloud') {
      await signOutIntentionally();
    }
    setAuthNotice(null);
    setDbStatus('unsynced');
    setUser({
      ...createInitialProfile(),
      id: 'demo_' + Math.random().toString(36).substring(2, 9),
      accountType: 'demo',
      registrationSource: 'Demo Sandbox',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      education: {
        degree: 'B.E. (Bachelor of Engineering)',
        branch: 'Computer Engineering',
        year: 'Third Year (TE / 3rd Year)',
        semester: 'Semester 6',
        college: 'College of Engineering Pune (COEP)',
        graduationYear: '2026',
        cgpa: '8.85',
        backlogs: 'None (All clear)',
      },
      skills: {
        programming: [
          { name: 'Python', category: 'programming', level: 'Advanced' },
          { name: 'C++', category: 'programming', level: 'Intermediate' },
          { name: 'JavaScript', category: 'programming', level: 'Intermediate' }
        ],
        web: [
          { name: 'React', category: 'web', level: 'Intermediate' },
          { name: 'FastAPI', category: 'web', level: 'Intermediate' },
          { name: 'Node.js', category: 'web', level: 'Familiar' }
        ],
        database: [
          { name: 'PostgreSQL', category: 'database', level: 'Intermediate' },
          { name: 'Redis', category: 'database', level: 'Familiar' }
        ],
        aiMl: [
          { name: 'Machine Learning', category: 'aiMl', level: 'Intermediate' },
          { name: 'Deep Learning', category: 'aiMl', level: 'Familiar' },
          { name: 'PyTorch', category: 'aiMl', level: 'Familiar' }
        ],
        cloudDevOps: [
          { name: 'Docker', category: 'cloudDevOps', level: 'Familiar' },
          { name: 'GitHub Actions', category: 'cloudDevOps', level: 'Intermediate' }
        ],
        coreCS: [
          { name: 'DSA', category: 'coreCS', level: 'Advanced' },
          { name: 'DBMS', category: 'coreCS', level: 'Intermediate' },
          { name: 'Operating Systems', category: 'coreCS', level: 'Intermediate' }
        ]
      },
      career: {
        interestedRoles: ['AI / ML Engineer', 'Software Engineer'],
        targetRole: 'AI / ML Engineer',
        dreamCompany: 'NVIDIA',
        goal: 'Campus Placement / Full-time',
        timeline: '1 year',
        preferredLocation: 'India',
      },
      learningPreferences: {
        methods: ['Building real projects', 'Hands-on coding', 'Practice problems & DSA'],
        dailyStudyTime: '2–3 hours',
        preferredStudyTime: 'Evening (Dedicated study block)',
        workingStyle: 'Mix of both',
        reminderPreference: 'Regular reminders',
      },
      careerTwin: {
        currentLevel: 'Undergraduate Explorer',
        strengths: [],
        weaknesses: [],
        skillGaps: [],
        readinessScore: null,
        consistencyScore: null,
        status: 'ready',
        lastUpdated: new Date().toISOString()
      }
    });
    setCurrentScreen('dashboard');
  };

  return (
    <OnboardingContext.Provider
      value={{
        user,
        currentScreen,
        errors,
        setCurrentScreen,
        updateUser,
        updateEducation,
        updateCareer,
        updatePreferences,
        toggleSkill,
        setSkillLevel,
        hasSkill,
        getSkillLevel,
        validateStep,
        clearError,
        setError,
        nextStep,
        prevStep,
        goToStep,
        resetAll,
        completeOnboarding,
        loginAsDemoUser,
        loginWithEmail,
        syncToDatabase,
        isSyncing,
        isAuthenticating,
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
        dbStatus
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
