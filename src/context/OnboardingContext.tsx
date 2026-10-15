import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, OnboardingScreen, SelectedSkill, SkillProficiency } from '../types/user';
import {
  syncProfileToSupabase,
  fetchOwnProfile,
  lastProfileFetchError,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getSession,
  isSupabaseConfigured,
  supabase
} from '../lib/supabase';
import { clearAllCareerState, OPEN_ROADMAP_KEY } from '../store/keys';

const openRoadmapAfterSignIn = () => {
  try {
    sessionStorage.setItem(OPEN_ROADMAP_KEY, '1');
  } catch {
    // Storage unavailable: the dashboard opens on its last tab instead.
  }
};


const STORAGE_KEY = 'ai_careeros_user_profile';
const SCREEN_KEY = 'ai_careeros_active_screen';
// Per-account copy of a completed cloud profile. Kept on sign-out (like career data) so signing
// back in on this device restores it even if the Supabase copy is missing or incomplete.
const PROFILE_CACHE_PREFIX = 'careeros_profile_cache_';

// Credentials must never reach localStorage or the database.
const sanitizeForStorage = (profile: UserProfile): UserProfile => {
  const copy = { ...profile };
  delete copy.password;
  delete copy.confirmPassword;
  return copy;
};

// Password rules for new accounts. Returns an error message, or null when the password is acceptable.
export const passwordProblem = (password: string): string | null => {
  if (!password) return 'Please create a password for your account.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Include at least one number and one special character.';
  return null;
};

const ONBOARDING_SCREENS: OnboardingScreen[] = [
  'step-1-profile', 'step-2-education', 'step-3-skills', 'step-4-career',
  'step-5-goals', 'step-6-preferences', 'step-7-review', 'twin-generation',
];

const isOnboardingComplete = (profile: UserProfile) => profile.careerTwin?.status === 'ready';

const loadCachedProfile = (userId: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

const createInitialProfile = (): UserProfile => ({
  id: 'usr_' + Math.random().toString(36).substring(2, 9),
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

// A profile row created by the signup trigger has empty JSON objects; fill every field the UI relies on.
const withProfileDefaults = (profile: UserProfile): UserProfile => {
  const base = createInitialProfile();
  return {
    ...base,
    ...profile,
    education: { ...base.education, ...profile.education },
    skills: { ...base.skills, ...profile.skills },
    career: { ...base.career, ...profile.career },
    learningPreferences: { ...base.learningPreferences, ...profile.learningPreferences },
    careerTwin: { ...base.careerTwin, ...profile.careerTwin },
  };
};

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
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  createAccount: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  syncToDatabase: (overrideUser?: UserProfile) => Promise<boolean>;
  isSyncing: boolean;
  isAuthenticating: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  dbStatus: 'synced' | 'unsynced' | 'connecting';
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Profile saved on this device. Demo and local-only profiles from older builds are dropped:
// every account is now a Supabase account.
const readSavedProfile = (): UserProfile | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    // Older builds persisted the password; drop it on load.
    const profile = sanitizeForStorage(JSON.parse(saved));
    const legacyType = (profile as { accountType?: string }).accountType;
    return legacyType === 'demo' || legacyType === 'local' ? null : profile;
  } catch {
    return null;
  }
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => readSavedProfile() || createInitialProfile());

  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(() => {
    try {
      const saved = localStorage.getItem(SCREEN_KEY);
      if (saved && readSavedProfile()) {
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
      if (user.accountType === 'cloud' && isOnboardingComplete(user)) {
        localStorage.setItem(PROFILE_CACHE_PREFIX + user.id, JSON.stringify(sanitizeForStorage(user)));
      }
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
  const screenRef = useRef(currentScreen);
  useEffect(() => {
    screenRef.current = currentScreen;
  }, [currentScreen]);

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

    getSession().then(async session => {
      if (cancelled) return;
      const current = userRef.current;
      if (!session) {
        if (current.accountType === 'cloud') setCurrentScreen(prev => (prev === 'dashboard' ? 'login' : prev));
        return;
      }
      // Mid-onboarding: stay on the current step.
      const onboarding = screenRef.current.startsWith('step-') || screenRef.current === 'twin-generation';
      if (onboarding && (current.accountType !== 'cloud' || current.id === session.user.id)) return;
      await openAccountRef.current(session.user.id, session.user.email || '', false);
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
        // Onboarding belongs to an account; anyone here without one creates it first.
        if (user.accountType !== 'cloud') {
          setCurrentScreen('signup');
          break;
        }
        if (validateStep(1)) setCurrentScreen('step-2-education');
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
      case 'signup':
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
        // "Not signed in" is expected while an email confirmation is pending; anything else is a real failure.
        if (res.error && res.error !== 'Not signed in') {
          setAuthNotice(`Your profile couldn't be saved to the cloud (${res.error}). It is still saved on this device.`);
        }
        return false;
      }
    } catch {
      setDbStatus('unsynced');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Opens a signed-in account. A completed profile goes straight to the dashboard: the Supabase
  // copy is used first, then this device's copy (which is then pushed to Supabase).
  // An unfinished profile continues onboarding with whatever Supabase already has.
  const openAccount = async (userId: string, email: string, fromSignIn: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    const fetchedRaw = await fetchOwnProfile(userId);
    const fetched = fetchedRaw ? withProfileDefaults(fetchedRaw) : null;
    const local = userRef.current;
    const sameAccount = (p: UserProfile | null) =>
      Boolean(p && (p.id === userId || (normalizedEmail && p.email && p.email.trim().toLowerCase() === normalizedEmail)));

    const cached = loadCachedProfile(userId);
    const completed = [fetched, cached, sameAccount(local) ? local : null]
      .find((p): p is UserProfile => Boolean(p && isOnboardingComplete(p)));
    if (completed) {
      const restored = withProfileDefaults({ ...sanitizeForStorage(completed), id: userId, accountType: 'cloud' });
      setUser(restored);
      setAuthNotice(null);
      if (fromSignIn) openRoadmapAfterSignIn();
      setCurrentScreen('dashboard');
      if (completed === fetched) setDbStatus('synced');
      else await syncToDatabase(restored);
      return;
    }

    if (fetched) {
      setUser({ ...fetched, email: fetched.email || normalizedEmail });
      setAuthNotice(null);
      const saved = fetched.careerTwin.onboardingStep;
      setCurrentScreen(saved && ONBOARDING_SCREENS.includes(saved) ? saved : 'step-1-profile');
      return;
    }

    // No Supabase profile visible: continue with this device's copy if it is the same account.
    const adopted: UserProfile = sameAccount(local)
      ? { ...sanitizeForStorage(local), id: userId, accountType: 'cloud' }
      : { ...createInitialProfile(), id: userId, email: normalizedEmail, accountType: 'cloud' };
    setUser(adopted);
    // Say why, when Supabase refused to return the profile rather than having none.
    setAuthNotice(lastProfileFetchError
      ? `Couldn't load your saved profile from Supabase (${lastProfileFetchError}). The database permissions need to be set up: run supabase/setup_accounts.sql in the Supabase SQL Editor.`
      : null);
    setCurrentScreen(adopted.fullName ? 'step-2-education' : 'step-1-profile');
  };
  const openAccountRef = useRef(openAccount);
  useEffect(() => {
    openAccountRef.current = openAccount;
  });

  // Creates the Supabase account, then starts onboarding for it. The profile row is saved as the
  // student fills in each step.
  const createAccount = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();
    setIsAuthenticating(true);
    try {
      const res = await signUpWithEmail(normalizedEmail, password, fullName.trim());
      if (!res.success) {
        return {
          success: false,
          error: /already (registered|exists)/i.test(res.error)
            ? 'An account with this email already exists. Sign in instead.'
            : res.error,
        };
      }
      if (!res.hasSession) {
        // Email confirmation is switched on in Supabase: the student signs in after confirming.
        return { success: true, needsConfirmation: true };
      }
      setUser({ ...createInitialProfile(), id: res.userId, email: normalizedEmail, fullName: fullName.trim(), role: 'student', accountType: 'cloud' });
      setErrors({});
      setAuthNotice(null);
      setCurrentScreen('step-1-profile');
      return { success: true };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured for this deployment.' };
    }

    setIsAuthenticating(true);
    try {
      const res = await signInWithEmail(normalizedEmail, password);
      if (!res.success) return res;
      await openAccount(res.userId, normalizedEmail, true);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Remember which onboarding step the student reached (saved with the profile).
  useEffect(() => {
    if (user.accountType !== 'cloud' || !ONBOARDING_SCREENS.includes(currentScreen)) return;
    if (user.careerTwin.onboardingStep === currentScreen) return;
    setUser(prev => ({ ...prev, careerTwin: { ...prev.careerTwin, onboardingStep: currentScreen } }));
  }, [currentScreen, user.accountType, user.careerTwin.onboardingStep]);

  // Keep the Supabase profile (education, skills incl. verified levels, goals…) in step with every
  // change, from the first onboarding step onwards.
  useEffect(() => {
    if (user.accountType !== 'cloud') return;
    const timer = window.setTimeout(() => { syncToDatabase(user); }, 1200);
    return () => window.clearTimeout(timer);
  }, [user, syncToDatabase]);

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
        loginWithEmail,
        createAccount,
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
