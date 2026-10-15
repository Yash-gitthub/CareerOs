-- CareerOS — account data in Supabase.
-- Run once in the Supabase SQL Editor (safe to run again). Every table is owner-only:
-- a signed-in student can read and write only their own rows.

-- ─────────────────────────────────────────────────────────────
-- 1. Profiles: name, phone, education, skills (claimed + verified levels),
--    career goals, learning preferences, Career Twin summary.
--    Rows are created by the signup trigger from SUPABASE_SETUP.md.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Profiles owner select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner update" ON public.profiles;

CREATE POLICY "Profiles owner select" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Profiles owner insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND id = auth.uid()::text);
CREATE POLICY "Profiles owner update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- 2. Career data: roadmap, tasks, projects, portfolio, learning log,
--    notifications, readiness history, feature unlocks, test history.
--    One JSON document per student, saved automatically by the app.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_states (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.career_states ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.career_states TO authenticated;

DROP POLICY IF EXISTS "Career state owner select" ON public.career_states;
DROP POLICY IF EXISTS "Career state owner insert" ON public.career_states;
DROP POLICY IF EXISTS "Career state owner update" ON public.career_states;

CREATE POLICY "Career state owner select" ON public.career_states
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Career state owner insert" ON public.career_states
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Career state owner update" ON public.career_states
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. Skill test results, one row per attempt, with full details:
--    every answer, section and topic scores, claimed vs. verified level per skill.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  target_role     TEXT,
  score           INTEGER,
  total_questions INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Detail columns (added separately so an older score-only table is upgraded in place).
ALTER TABLE public.assessment_results
  ADD COLUMN IF NOT EXISTS attempt_id     TEXT,
  ADD COLUMN IF NOT EXISTS domain         TEXT,
  ADD COLUMN IF NOT EXISTS completed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS section_scores JSONB,
  ADD COLUMN IF NOT EXISTS topic_scores   JSONB,
  ADD COLUMN IF NOT EXISTS communication  INTEGER,
  ADD COLUMN IF NOT EXISTS skill_checks   JSONB,
  ADD COLUMN IF NOT EXISTS answers        JSONB;

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.assessment_results TO authenticated;

-- Remove the open policies from supabase/schema.sql (they let anyone read every result).
DROP POLICY IF EXISTS "Allow assessment insert" ON public.assessment_results;
DROP POLICY IF EXISTS "Allow assessment select" ON public.assessment_results;
DROP POLICY IF EXISTS "Own assessment results: insert" ON public.assessment_results;
DROP POLICY IF EXISTS "Own assessment results: read" ON public.assessment_results;

CREATE POLICY "Own assessment results: insert" ON public.assessment_results
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Own assessment results: read" ON public.assessment_results
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- 4. Mentor / placement officer registration form (no account needed).
-- ─────────────────────────────────────────────────────────────
GRANT INSERT ON public.mentor_registrations TO anon, authenticated;

-- Make the new tables and columns visible to the API immediately.
NOTIFY pgrst, 'reload schema';
