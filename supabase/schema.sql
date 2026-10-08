-- ========================================================
-- AI CareerOS - Supabase Database Schema
-- Run this script in your Supabase Project's SQL Editor:
-- https://supabase.com/dashboard/project/vcjwjidfttfqxdfehbkm/sql
--
-- IMPORTANT: always run supabase/migrations/002_core.sql afterwards.
-- The open "USING (true)" policies below are replaced there by owner-only RLS.
-- ========================================================

-- 1. Student / User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profile_photo TEXT,
  role TEXT DEFAULT 'student',
  registration_source TEXT DEFAULT 'Direct Web Registration',
  education JSONB DEFAULT '{}'::jsonb,
  skills JSONB DEFAULT '{}'::jsonb,
  career JSONB DEFAULT '{}'::jsonb,
  learning_preferences JSONB DEFAULT '{}'::jsonb,
  career_twin JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
CREATE POLICY "Allow select for all"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.profiles;
CREATE POLICY "Allow insert for all"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.profiles;
CREATE POLICY "Allow update for all"
  ON public.profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- 2. Mentor & Placement Officer Registrations
CREATE TABLE IF NOT EXISTS public.mentor_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  institution TEXT NOT NULL,
  designation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentor_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow mentor insert" ON public.mentor_registrations;
CREATE POLICY "Allow mentor insert"
  ON public.mentor_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow mentor select" ON public.mentor_registrations;
CREATE POLICY "Allow mentor select"
  ON public.mentor_registrations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Diagnostics / Assessment Results Table
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  target_role TEXT,
  score INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow assessment insert" ON public.assessment_results;
CREATE POLICY "Allow assessment insert"
  ON public.assessment_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow assessment select" ON public.assessment_results;
CREATE POLICY "Allow assessment select"
  ON public.assessment_results
  FOR SELECT
  TO anon, authenticated
  USING (true);
