-- ========================================================
-- AI CareerOS - Migration 002: Auth-linked data + core Career Twin tables
-- Run AFTER supabase/schema.sql, in the Supabase SQL Editor.
--
-- What this does:
--   1. Replaces the open "USING (true)" policies with owner-only RLS.
--   2. Links profiles to auth.users (profiles.id = auth.uid()::text).
--   3. Creates the core tables used by the Career Twin feedback loop.
--   4. Seeds configuration: readiness weights + role requirements.
--
-- NOTE: profile rows created before this migration have no user_id and
-- become invisible to clients. They can be removed or re-linked manually.
-- ========================================================

-- --------------------------------------------------------
-- 1. Lock down existing tables
-- --------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS leetcode_username TEXT,
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workload_multiplier NUMERIC(3,2) DEFAULT 1.0;

DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner update" ON public.profiles;

CREATE POLICY "Profiles owner select" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Profiles owner insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND id = auth.uid()::text);
CREATE POLICY "Profiles owner update" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND id = auth.uid()::text);

-- Mentor registration is a public form: anyone may submit, nobody may read via the anon key.
DROP POLICY IF EXISTS "Allow mentor select" ON public.mentor_registrations;

DROP POLICY IF EXISTS "Allow assessment insert" ON public.assessment_results;
DROP POLICY IF EXISTS "Allow assessment select" ON public.assessment_results;
DROP POLICY IF EXISTS "Assessment results owner select" ON public.assessment_results;
DROP POLICY IF EXISTS "Assessment results owner insert" ON public.assessment_results;
CREATE POLICY "Assessment results owner select" ON public.assessment_results
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Assessment results owner insert" ON public.assessment_results
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- --------------------------------------------------------
-- 2. Core tables (all owned by user_id = auth.uid())
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'leetcode')),
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'syncing', 'error')),
  last_success_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.github_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repos JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '{}'::jsonb,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  push_days_30 INTEGER NOT NULL DEFAULT 0,
  contribution_calendar JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leetcode_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  easy INTEGER NOT NULL DEFAULT 0,
  medium INTEGER NOT NULL DEFAULT 0,
  hard INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  tag_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  contest JSONB,
  submission_calendar JSONB,
  is_partial BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  target_role TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  communication_self JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skill_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  category TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  tier TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill)
);

CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  required NUMERIC(5,2) NOT NULL,
  current NUMERIC(5,2) NOT NULL,
  gap NUMERIC(5,2) NOT NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('strong', 'developing', 'critical')),
  priority NUMERIC(6,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill)
);

CREATE TABLE IF NOT EXISTS public.career_twins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  career JSONB NOT NULL DEFAULT '{}'::jsonb,
  technical JSONB NOT NULL DEFAULT '{}'::jsonb,
  coding JSONB NOT NULL DEFAULT '{}'::jsonb,
  project JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning JSONB NOT NULL DEFAULT '{}'::jsonb,
  behavioral JSONB NOT NULL DEFAULT '{}'::jsonb,
  readiness NUMERIC(5,2),
  consistency NUMERIC(5,2),
  stage TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.twin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  twin JSONB NOT NULL,
  reason_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS activity_events_user_created_idx ON public.activity_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  components JSONB NOT NULL,
  reason_event_id UUID REFERENCES public.activity_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS readiness_snapshots_user_created_idx ON public.readiness_snapshots (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_goal TEXT NOT NULL,
  target_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  generated_by TEXT NOT NULL DEFAULT 'template' CHECK (generated_by IN ('template', 'ai')),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  skill TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS public.roadmap_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.roadmap_milestones(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage TEXT NOT NULL DEFAULT 'idea'
    CHECK (stage IN ('idea', 'planning', 'development', 'testing', 'deployment', 'completed')),
  repo_url TEXT,
  deploy_url TEXT,
  start_date DATE,
  deadline DATE,
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  blueprint JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('dsa', 'learning', 'project', 'github', 'core_cs', 'personal')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  est_minutes INTEGER NOT NULL DEFAULT 45 CHECK (est_minutes BETWEEN 5 AND 480),
  due_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'overdue')),
  source TEXT NOT NULL DEFAULT 'roadmap' CHECK (source IN ('roadmap', 'intervention', 'personal', 'project', 'review')),
  milestone_id UUID REFERENCES public.roadmap_milestones(id) ON DELETE SET NULL,
  week_id UUID REFERENCES public.roadmap_weeks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  skill TEXT,
  skip_reason TEXT,
  gen_key TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, gen_key)
);
CREATE INDEX IF NOT EXISTS tasks_user_due_idx ON public.tasks (user_id, due_date);

CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('dsa', 'learning', 'project', 'github')),
  target INTEGER NOT NULL CHECK (target >= 0),
  actual INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, week_start, category)
);

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  metrics JSONB NOT NULL,
  narrative JSONB,
  next_week_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'task_reminder', 'upcoming_task', 'overdue', 'github_reminder', 'learning_reminder',
    'weekly_review', 'twin_update', 'intervention'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action JSONB,
  dedupe_key TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  proposed_change JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'dismissed')),
  cooldown_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('achievement', 'education', 'experience', 'certification', 'link')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  skill TEXT,
  minutes INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 600),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Owner-only RLS for every user-owned table above.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'integrations', 'github_snapshots', 'leetcode_snapshots', 'assessments', 'skill_states',
    'skill_gaps', 'career_twins', 'twin_history', 'activity_events', 'readiness_snapshots',
    'roadmaps', 'roadmap_milestones', 'roadmap_weeks', 'projects', 'project_milestones',
    'tasks', 'weekly_goals', 'weekly_reviews', 'notifications', 'interventions',
    'portfolio_items', 'learning_activity'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owner full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Owner full access" ON public.%I FOR ALL TO authenticated
         USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
  END LOOP;
END $$;

-- --------------------------------------------------------
-- 3. Shared, read-only configuration / content
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.readiness_weights (
  component TEXT PRIMARY KEY,
  weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0)
);

CREATE TABLE IF NOT EXISTS public.role_requirements (
  role TEXT NOT NULL,
  skill TEXT NOT NULL,
  required_score NUMERIC(5,2) NOT NULL CHECK (required_score BETWEEN 0 AND 100),
  weight NUMERIC(3,2) NOT NULL CHECK (weight BETWEEN 0 AND 1),
  PRIMARY KEY (role, skill)
);

-- Curated learning content. Seeded by the team with verified URLs (never AI-generated).
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'documentation', 'course', 'article', 'practice', 'project')),
  skill TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  est_minutes INTEGER NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb
);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['readiness_weights', 'role_requirements', 'learning_resources']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Read for signed-in users" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Read for signed-in users" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- --------------------------------------------------------
-- 4. Seed configuration
-- --------------------------------------------------------

INSERT INTO public.readiness_weights (component, weight) VALUES
  ('technical_skills', 25),
  ('dsa', 15),
  ('projects', 20),
  ('coding_activity', 10),
  ('portfolio', 10),
  ('learning_consistency', 10),
  ('core_cs', 5),
  ('goal_alignment', 5)
ON CONFLICT (component) DO UPDATE SET weight = EXCLUDED.weight;

-- Skill names match src/data/skillsData.ts. Role names match src/data/rolesData.ts titles.
-- required_score is the 0–100 skill score (see src/utils/skillScoring.ts) expected for an entry-level hire.
INSERT INTO public.role_requirements (role, skill, required_score, weight) VALUES
  ('Software Engineer', 'DSA', 75, 1.0),
  ('Software Engineer', 'OOP', 70, 0.8),
  ('Software Engineer', 'DBMS', 60, 0.7),
  ('Software Engineer', 'Operating Systems', 60, 0.7),
  ('Software Engineer', 'Computer Networks', 55, 0.6),
  ('Software Engineer', 'System Design', 50, 0.6),
  ('Software Engineer', 'Java', 65, 0.6),
  ('Software Engineer', 'Python', 60, 0.5),
  ('Software Engineer', 'REST APIs', 55, 0.5),
  ('Software Engineer', 'Linux', 45, 0.4),

  ('Full Stack Developer', 'JavaScript', 75, 1.0),
  ('Full Stack Developer', 'TypeScript', 60, 0.7),
  ('Full Stack Developer', 'React', 70, 0.9),
  ('Full Stack Developer', 'Node.js', 65, 0.9),
  ('Full Stack Developer', 'REST APIs', 70, 0.8),
  ('Full Stack Developer', 'PostgreSQL', 60, 0.7),
  ('Full Stack Developer', 'HTML', 70, 0.6),
  ('Full Stack Developer', 'CSS', 65, 0.6),
  ('Full Stack Developer', 'DSA', 55, 0.6),
  ('Full Stack Developer', 'Docker', 45, 0.4),

  ('Frontend Developer', 'JavaScript', 80, 1.0),
  ('Frontend Developer', 'TypeScript', 65, 0.8),
  ('Frontend Developer', 'React', 75, 1.0),
  ('Frontend Developer', 'HTML', 80, 0.8),
  ('Frontend Developer', 'CSS', 75, 0.8),
  ('Frontend Developer', 'Tailwind CSS', 55, 0.5),
  ('Frontend Developer', 'Next.js', 55, 0.5),
  ('Frontend Developer', 'REST APIs', 55, 0.5),
  ('Frontend Developer', 'DSA', 50, 0.5),

  ('Backend Developer', 'DSA', 65, 0.8),
  ('Backend Developer', 'REST APIs', 75, 1.0),
  ('Backend Developer', 'PostgreSQL', 70, 0.9),
  ('Backend Developer', 'DBMS', 70, 0.8),
  ('Backend Developer', 'Node.js', 60, 0.6),
  ('Backend Developer', 'Java', 60, 0.6),
  ('Backend Developer', 'Redis', 50, 0.5),
  ('Backend Developer', 'System Design', 60, 0.8),
  ('Backend Developer', 'Docker', 55, 0.6),
  ('Backend Developer', 'Operating Systems', 55, 0.5),
  ('Backend Developer', 'Computer Networks', 55, 0.5),

  ('AI / ML Engineer', 'Python', 80, 1.0),
  ('AI / ML Engineer', 'Machine Learning', 75, 1.0),
  ('AI / ML Engineer', 'Deep Learning', 65, 0.9),
  ('AI / ML Engineer', 'PyTorch', 60, 0.8),
  ('AI / ML Engineer', 'Scikit-Learn', 60, 0.6),
  ('AI / ML Engineer', 'LLMs', 55, 0.7),
  ('AI / ML Engineer', 'RAG', 50, 0.6),
  ('AI / ML Engineer', 'DSA', 65, 0.7),
  ('AI / ML Engineer', 'System Design', 45, 0.5),
  ('AI / ML Engineer', 'Docker', 45, 0.4),

  ('Data Scientist', 'Python', 80, 1.0),
  ('Data Scientist', 'Machine Learning', 70, 1.0),
  ('Data Scientist', 'Scikit-Learn', 65, 0.8),
  ('Data Scientist', 'PostgreSQL', 60, 0.7),
  ('Data Scientist', 'MySQL', 55, 0.5),
  ('Data Scientist', 'Deep Learning', 50, 0.5),
  ('Data Scientist', 'NLP', 45, 0.4),
  ('Data Scientist', 'DSA', 50, 0.5),

  ('Data Engineer', 'Python', 75, 1.0),
  ('Data Engineer', 'PostgreSQL', 75, 1.0),
  ('Data Engineer', 'DBMS', 70, 0.8),
  ('Data Engineer', 'Cassandra', 45, 0.4),
  ('Data Engineer', 'AWS', 55, 0.7),
  ('Data Engineer', 'Docker', 55, 0.6),
  ('Data Engineer', 'Linux', 55, 0.6),
  ('Data Engineer', 'DSA', 55, 0.6),
  ('Data Engineer', 'System Design', 50, 0.6),

  ('Cloud Engineer', 'AWS', 75, 1.0),
  ('Cloud Engineer', 'Linux', 70, 0.9),
  ('Cloud Engineer', 'Docker', 65, 0.8),
  ('Cloud Engineer', 'Kubernetes', 55, 0.7),
  ('Cloud Engineer', 'Terraform', 55, 0.7),
  ('Cloud Engineer', 'Computer Networks', 65, 0.8),
  ('Cloud Engineer', 'CI/CD', 55, 0.6),
  ('Cloud Engineer', 'Python', 55, 0.5),

  ('DevOps Engineer', 'Linux', 75, 1.0),
  ('DevOps Engineer', 'Docker', 75, 1.0),
  ('DevOps Engineer', 'Kubernetes', 65, 0.9),
  ('DevOps Engineer', 'CI/CD', 70, 0.9),
  ('DevOps Engineer', 'GitHub Actions', 60, 0.6),
  ('DevOps Engineer', 'Terraform', 55, 0.7),
  ('DevOps Engineer', 'AWS', 60, 0.7),
  ('DevOps Engineer', 'Computer Networks', 60, 0.6),
  ('DevOps Engineer', 'Python', 50, 0.5),

  ('Cybersecurity Analyst / Engineer', 'Information Security', 75, 1.0),
  ('Cybersecurity Analyst / Engineer', 'Computer Networks', 75, 1.0),
  ('Cybersecurity Analyst / Engineer', 'Linux', 70, 0.9),
  ('Cybersecurity Analyst / Engineer', 'Operating Systems', 65, 0.8),
  ('Cybersecurity Analyst / Engineer', 'Python', 60, 0.6),
  ('Cybersecurity Analyst / Engineer', 'DBMS', 50, 0.4),
  ('Cybersecurity Analyst / Engineer', 'AWS', 45, 0.4),

  ('Mobile App Developer', 'Kotlin', 65, 0.8),
  ('Mobile App Developer', 'Swift', 60, 0.7),
  ('Mobile App Developer', 'JavaScript', 60, 0.6),
  ('Mobile App Developer', 'React', 55, 0.5),
  ('Mobile App Developer', 'Firebase', 55, 0.6),
  ('Mobile App Developer', 'REST APIs', 60, 0.7),
  ('Mobile App Developer', 'OOP', 65, 0.7),
  ('Mobile App Developer', 'DSA', 55, 0.6),

  ('UI/UX & Product Designer', 'HTML', 60, 0.7),
  ('UI/UX & Product Designer', 'CSS', 65, 0.8),
  ('UI/UX & Product Designer', 'Tailwind CSS', 50, 0.5),
  ('UI/UX & Product Designer', 'React', 45, 0.5),
  ('UI/UX & Product Designer', 'JavaScript', 45, 0.5),
  ('UI/UX & Product Designer', 'Software Engineering', 45, 0.5),

  ('Associate Product Manager', 'Software Engineering', 65, 1.0),
  ('Associate Product Manager', 'System Design', 45, 0.6),
  ('Associate Product Manager', 'DBMS', 45, 0.5),
  ('Associate Product Manager', 'MySQL', 45, 0.5),
  ('Associate Product Manager', 'Python', 40, 0.4),
  ('Associate Product Manager', 'REST APIs', 40, 0.4)
ON CONFLICT (role, skill) DO UPDATE
  SET required_score = EXCLUDED.required_score, weight = EXCLUDED.weight;
