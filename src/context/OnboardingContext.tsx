import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, OnboardingScreen, SelectedSkill, SkillProficiency } from '../types/user';
import { syncProfileToSupabase, fetchProfileFromSupabase } from '../lib/supabase';


const STORAGE_KEY = 'ai_careeros_user_profile';
const SCREEN_KEY = 'ai_careeros_active_screen';

const initialProfile: UserProfile = {
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
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepNumber: number) => void;
  resetAll: () => void;
  completeOnboarding: () => void;
  loginAsDemoUser: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  syncToDatabase: (overrideUser?: UserProfile) => Promise<boolean>;
  isSyncing: boolean;
  dbStatus: 'synced' | 'unsynced' | 'connecting';
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return initialProfile;
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
  const [dbStatus, setDbStatus] = useState<'synced' | 'unsynced' | 'connecting'>('unsynced');

  // Sync with local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
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

  const nextStep = () => {
    switch (currentScreen) {
      case 'step-1-profile':
        if (validateStep(1)) setCurrentScreen('step-2-education');
        break;
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

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SCREEN_KEY);
    setUser(initialProfile);
    setCurrentScreen('welcome');
    setErrors({});
  };

  const syncToDatabase = useCallback(async (overrideUser?: UserProfile): Promise<boolean> => {
    const profileToSync = overrideUser || user;
    if (!profileToSync.email && !profileToSync.fullName) return false;
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

  const loginWithEmail = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    try {
      const fetched = await fetchProfileFromSupabase(email);
      if (fetched) {
        setUser(fetched);
        setCurrentScreen('dashboard');
        setDbStatus('synced');
        return { success: true };
      }

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setCurrentScreen('dashboard');
        return { success: true };
      }

      return {
        success: false,
        error: 'No account found with this email. Please complete the quick student onboarding to register, or use Demo Sign-in.'
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    } finally {
      setIsSyncing(false);
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


  const loginAsDemoUser = () => {
    setUser({
      ...initialProfile,
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
        currentLevel: 'Aspiring AI Specialist',
        strengths: ['Strong DSA foundation', 'Python & PyTorch hands-on projects', 'Consistent daily practice'],
        weaknesses: ['Advanced System Design', 'Distributed Systems'],
        skillGaps: ['RAG Pipeline deployment', 'Model Optimization (TensorRT)'],
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
