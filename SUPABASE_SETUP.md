# Supabase Authentication & Setup Guide

This guide contains the setup steps and SQL script for connecting **AI CareerOS** to Supabase.

---

## 1. Environment Configuration

The local environment variables are saved in `.env`:

```env
VITE_SUPABASE_URL=https://nqbkzpntwoetwmywrbzy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_FWcQOlCFTXEWAZn9hfD5uw_uFFhJAAZ
```

> **Note:** The `.env` file is excluded from Git tracking via `.gitignore` to keep credentials secure.

---

## 2. SQL Schema & Triggers (Supabase Dashboard)

> **Required:** after the script below, also run [`supabase/setup_accounts.sql`](supabase/setup_accounts.sql).
> It grants signed-in users access to their own rows, fixes the profile update policy (`WITH CHECK`),
> and creates `career_states` (roadmap, tasks, projects…) and the detailed `assessment_results` table.
> Without it, sign-in cannot load a saved profile and the app asks for it again.

Run this SQL in your [Supabase SQL Editor](https://supabase.com/dashboard/project/nqbkzpntwoetwmywrbzy):

```sql
-- 1. Base Profiles Table
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

-- Owner-only RLS Policies
DROP POLICY IF EXISTS "Profiles owner select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner update" ON public.profiles;

CREATE POLICY "Profiles owner select" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Profiles owner insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND id = auth.uid()::text);
CREATE POLICY "Profiles owner update" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) CHECK (user_id = auth.uid() AND id = auth.uid()::text);

-- 2. Automatic Profile Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, email, role)
  VALUES (
    new.id::text,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Mentor Registrations Table
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
CREATE POLICY "Allow public insert for mentors" ON public.mentor_registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
```

---

## 3. Supabase Auth Settings

In your **Supabase Dashboard**:
1. Navigate to **Authentication** > **Providers** > **Email**.
2. For local testing, toggle **Confirm email** to **OFF** and save (allows instant sign-ins without waiting for an email link).

---

## 4. How to Run the Project

1. Open your terminal in the project directory:
   ```bash
   cd "c:\projects of college\CareerOs"
   ```
2. Install packages (if running for the first time):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser link:
   `http://localhost:5173/`
