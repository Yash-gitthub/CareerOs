import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types/user';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Convert camelCase UserProfile to database schema format
export const syncProfileToSupabase = async (user: UserProfile): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase credentials not configured' };

  try {
    const payload = {
      id: user.id,
      full_name: user.fullName || 'Anonymous Student',
      email: user.email || '',
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
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Failed to sync to Supabase:', message);
    return { success: false, error: message };
  }
};

// Fetch user profile from Supabase
export const fetchProfileFromSupabase = async (userIdOrEmail: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const profile: UserProfile = {
      id: data.id,
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
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
};

// Record assessment result
export const recordAssessmentResult = async (params: {
  userId: string;
  targetRole: string;
  score: number;
  totalQuestions: number;
}) => {
  if (!isSupabaseConfigured) return { success: false };

  try {
    const { error } = await supabase
      .from('assessment_results')
      .insert([{
        user_id: params.userId,
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
