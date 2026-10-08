import { createClient, type Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/user';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// createClient throws on an empty URL, so use a harmless placeholder when unconfigured.
// Every helper below checks isSupabaseConfigured before touching the client.
export const supabase = createClient(
  supabaseUrl || 'http://localhost.invalid',
  supabaseAnonKey || 'unconfigured',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

type AuthResult = { success: true; userId: string; hasSession: boolean } | { success: false; error: string };

const toMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// ---------- Auth ----------

export const signUpWithEmail = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase credentials not configured' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      }
      return { success: false, error: error.message };
    }

    // With "Confirm email" enabled, Supabase returns a user with no identities for an
    // existing address instead of an error.
    if (!data.user || data.user.identities?.length === 0) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    return { success: true, userId: data.user.id, hasSession: Boolean(data.session) };
  } catch (err: unknown) {
    return { success: false, error: toMessage(err) };
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase credentials not configured' };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      if (error && /email not confirmed/i.test(error.message)) {
        return { success: false, error: 'Please confirm your email address first, then sign in.' };
      }
      return { success: false, error: 'Incorrect email or password.' };
    }
    return { success: true, userId: data.user.id, hasSession: Boolean(data.session) };
  } catch (err: unknown) {
    return { success: false, error: toMessage(err) };
  }
};

export const signOut = async () => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign-out failed:', toMessage(err));
  }
};

export const getSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
};

// ---------- Profiles ----------

// Convert camelCase UserProfile to database schema format.
// Requires an authenticated session; RLS only allows writing your own row.
export const syncProfileToSupabase = async (user: UserProfile): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase credentials not configured' };

  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Not signed in' };

    const payload = {
      id: session.user.id,
      user_id: session.user.id,
      full_name: user.fullName || 'Anonymous Student',
      email: session.user.email || user.email || '',
      phone: user.phone || '',
      profile_photo: user.profilePhoto || null,
      role: user.role || 'student',
      registration_source: user.registrationSource || 'Direct Web Registration',
      education: user.education || {},
      skills: user.skills || {},
      career: user.career || {},
      learning_preferences: user.learningPreferences || {},
      career_twin: user.careerTwin || {},
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase profile sync error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = toMessage(err);
    console.warn('Failed to sync to Supabase:', message);
    return { success: false, error: message };
  }
};

// Fetch the signed-in user's own profile. RLS guarantees only that row is visible.
export const fetchOwnProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const profile: UserProfile = {
      id: data.id,
      accountType: 'cloud',
      fullName: data.full_name || '',
      email: data.email || '',
      phone: data.phone || '',
      profilePhoto: data.profile_photo || '',
      role: data.role || 'student',
      createdAt: data.created_at || new Date().toISOString(),
      registrationSource: data.registration_source || 'Direct Web Registration',
      education: data.education || {},
      skills: data.skills || {},
      career: data.career || {},
      learningPreferences: data.learning_preferences || {},
      careerTwin: data.career_twin || {
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

    return profile;
  } catch (err) {
    console.warn('Error fetching profile from Supabase:', err);
    return null;
  }
};

// Save mentor registration
export interface MentorRegistrationData {
  name: string;
  email: string;
  role: 'mentor' | 'placement_officer';
  institution: string;
  designation: string;
  phone: string;
}

export const submitMentorRegistration = async (data: MentorRegistrationData) => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('mentor_registrations')
      .insert([data]);

    if (error) {
      console.warn('Mentor registration insert error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: toMessage(err) };
  }
};

// Record assessment result (owner-only via RLS; skipped when not signed in)
export const recordAssessmentResult = async (params: {
  userId: string;
  targetRole: string;
  score: number;
  totalQuestions: number;
}) => {
  if (!isSupabaseConfigured) return { success: false };

  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Not signed in' };

    const { error } = await supabase
      .from('assessment_results')
      .insert([{
        user_id: session.user.id,
        target_role: params.targetRole,
        score: params.score,
        total_questions: params.totalQuestions
      }]);

    if (error) {
      console.warn('Assessment result error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn('Failed recording assessment:', err);
    return { success: false };
  }
};
