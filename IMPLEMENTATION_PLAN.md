# AI CareerOS — Comprehensive Implementation Plan
## End-to-End Autonomous Career Operating System for Engineering & IT Students

---

## 1. Executive Summary & Codebase Audit

### 1.1 Project Objective
Transform the existing **AI CareerOS** demo into a fully functional, production-ready web application centered around a **Living Career Digital Twin**. The system adapts to a student's daily activity, diagnostic assessments, GitHub repository commits, LeetCode performance, and learning velocity through an autonomous feedback loop.

### 1.2 Preservation Guarantees
* **Preserve Existing UI/UX**: Retain the existing design system, colors, typography, components, and responsive layout.
* **Preserve Onboarding**: Retain Steps 1 through 7 (`Step1Profile.tsx` through `Step7Review.tsx`), `RoleSelection.tsx`, `MentorPlacementRegister.tsx`, and `OnboardingContext.tsx`.
* **Zero Disruption to Working Logic**: Existing profile fields, college datasets, company datasets, and skill selections are preserved and extended rather than replaced.

### 1.3 Audit Findings

| Subsystem | Existing State | Gap / Missing Elements | Action Plan |
|---|---|---|---|
| **Routing & App Structure** | State-driven router in `App.tsx` handling onboarding + basic dashboard. | No sub-navigation or deep views for Tasks, Roadmap, Analytics, and Projects. | Add modular dashboard navigation tabs (Overview, Daily Tasks, Roadmap, Coding Stats, Projects, Career Twin). |
| **Profile & Onboarding** | Complete 7-step wizard capturing personal info, degree, skills, career goals, study habits. | No fields for connecting GitHub or LeetCode usernames. | Add GitHub & LeetCode connection cards in profile setup & dashboard drawer. |
| **Data Layer & Persistence** | LocalStorage + basic Supabase sync in `OnboardingContext.tsx`. | Only `profiles`, `mentor_registrations`, and `assessment_results` exist in `supabase/schema.sql`. Missing tasks, roadmaps, notifications, etc. | Implement a resilient **Repository/Storage Adapter** with LocalStorage/IndexedDB fallback and expanded Supabase SQL schema. |
| **Dashboard UI** | Clean greeting hero, "Pending" readiness card, and static skill chips. | Cards are static; no real tasks, no live LeetCode/GitHub stats, no interactive roadmap. | Connect cards to live state: interactive task checklist, real readiness score, live GitHub/LeetCode stats. |
| **Career Twin Drawer** | Slide-over drawer with placeholder metrics and mock alert. | All dimensions are static strings; no real twin model update triggers. | Implement reactive `CareerTwinService` computing technical, coding, and behavioral profiles. |
| **Assessment System** | Modal with 3 static hardcoded questions writing a fixed score of 3. | No domain/role-specific questions, no skill calibration, no gap generation. | Implement 8–10 question multi-category diagnostic with instant skill gap derivation. |
| **GitHub Integration** | Placeholder button with browser alert. | No API calls, repo parsing, commit checking, or language analysis. | Implement `githubService.ts` fetching public repos, commit frequency, and tech stack complexity. |
| **LeetCode Integration** | None. | Not implemented in UI or data model. | Implement `leetcodeService.ts` fetching solved counts, difficulties, and topic distributions. |
| **Task & Roadmap Engine** | Placeholder text. | No task generation, no scheduling, no state tracking (`completed`, `skipped`, `rescheduled`). | Implement `roadmapService.ts` and `taskGenerationService.ts` with real task interaction. |
| **Notification Engine** | None. | No notification center or trigger mechanism. | Implement `notificationService.ts` with in-app notification center and badge counts. |
| **Accountability & Interventions** | None. | No drop-off detection or adaptive workload balancing. | Implement `interventionService.ts` for consistency tracking and automatic workload adjustments. |
| **Project Tracking & Portfolio** | None. | No project milestone tracker or portfolio analyzer. | Implement `projectService.ts` with company-targeted project blueprints and portfolio gap detection. |

---

## 2. System Architecture: The Autonomous Feedback Loop

The core architecture follows a closed-loop reactive engine:

```text
                           ┌──────────────────────────────┐
                           │      Student Profile &       │
                           │      Career Target Goals     │
                           └──────────────┬───────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────────┐
                           │     Baseline Diagnostic      │
                           │   (DSA, Core CS, Domain)     │
                           └──────────────┬───────────────┘
                                          │
                                          ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            Career Digital Twin                              │
  │  • Technical Profile (DSA, Web, AI/ML, Cloud)  • Coding Profile (LC/GitHub) │
  │  • Behavioral Profile (Consistency, Deadlines) • Career Readiness (0-100%)  │
  └─────────▲─────────────────────────────────────────────────────────┬─────────┘
            │                                                         │
            │ [Auto-Update Trigger]                                   │ [Generates]
            │                                                         ▼
  ┌─────────┴─────────────┐                               ┌─────────────────────┐
  │   Activity Monitor    │                               │ Skill Gap Analysis  │
  │ • Task Checked Off    │                               │ • Strong Skills     │
  │ • GitHub Sync / Push  │                               │ • Developing Skills │
  │ • LeetCode Problem    │                               │ • Critical Gaps     │
  │ • Assessment Finished │                               └──────────┬──────────┘
  └─────────▲─────────────┘                                          │
            │                                                        ▼
  ┌─────────┴─────────────┐                               ┌─────────────────────┐
  │  Student Daily Action │◄────── [Notification Alert] ──│ Personalized Weekly │
  │  (Executes Task/Study)│                               │ Roadmap & Tasks     │
  └───────────────────────┘                               └─────────────────────┘
```

---

## 3. Database & Data Architecture

### 3.1 Resilient Storage Model (`storageAdapter.ts`)
* **Dual-Tier Strategy**:
  1. **Tier 1 (Fast & Offline-First)**: Synchronous in-memory state backed by `localStorage` / `IndexedDB`. The application operates smoothly even if Supabase is offline or unconfigured.
  2. **Tier 2 (Cloud Persistence)**: Background upsert to Supabase PostgreSQL when credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are present.
* **Zero Data Loss**: Page refreshes or reconnections seamlessly hydrate from the most recent persistent snapshot.

### 3.2 Database Schema (`supabase/schema_v2.sql`)

```sql
-- 1. Extend Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS leetcode_username TEXT,
ADD COLUMN IF NOT EXISTS github_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS leetcode_data JSONB DEFAULT '{}'::jsonb;

-- 2. Career Digital Twin Table
CREATE TABLE IF NOT EXISTS public.career_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  dream_company TEXT,
  technical_profile JSONB DEFAULT '{}'::jsonb,
  coding_profile JSONB DEFAULT '{}'::jsonb,
  project_profile JSONB DEFAULT '{}'::jsonb,
  behavioral_profile JSONB DEFAULT '{}'::jsonb,
  career_readiness_score NUMERIC(5,2) DEFAULT 0.0,
  consistency_score NUMERIC(5,2) DEFAULT 0.0,
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skill Gaps Table
CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  strong_skills JSONB DEFAULT '[]'::jsonb,
  developing_skills JSONB DEFAULT '[]'::jsonb,
  critical_gaps JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Learning Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_goal TEXT NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tasks (Daily & Weekly) Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'dsa', 'learning', 'project', 'cs_core', 'github'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  estimated_minutes INTEGER DEFAULT 45,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped', 'overdue'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task_reminder', 'overdue', 'weekly_review', 'intervention', 'twin_update'
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Projects & Portfolio Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  stage TEXT DEFAULT 'idea', -- 'idea', 'planning', 'development', 'testing', 'deployed'
  progress_pct INTEGER DEFAULT 0,
  github_repo_url TEXT,
  live_demo_url TEXT,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Weekly Reviews & Interventions Table
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  completion_rate NUMERIC(5,2),
  dsa_growth NUMERIC(5,2),
  strongest_area TEXT,
  needs_attention TEXT,
  ai_recommendation TEXT,
  interventions_triggered JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Phase-by-Phase Implementation Blueprint

```
Phase 1: Storage & Types Layer
   │
Phase 2: GitHub & LeetCode Integrations
   │
Phase 3: Career Readiness & Twin Calculator
   │
Phase 4: Comprehensive Diagnostic & Skill Gap Engine
   │
Phase 5: Personalized Roadmap Generator
   │
Phase 6: Daily & Weekly Task Engine
   │
Phase 7: Notification & Alert Engine
   │
Phase 8: Smart Interventions & Adaptive Workload
   │
Phase 9: Projects & Portfolio Tracking
   │
Phase 10: Weekly AI Career Review & Dashboard Assembly
   │
Phase 11: End-to-End Verification & Hardening
```

### Phase 1: Storage Layer & Type System Expansion
* **Files**: `src/types/user.ts`, `src/services/storageService.ts`, `supabase/schema_v2.sql`.
* **Deliverables**:
  1. Define full TypeScript interfaces for `Task`, `RoadmapMilestone`, `Notification`, `ProjectItem`, `WeeklyReview`, `GitHubStats`, `LeetCodeStats`, and `ReadinessBreakdown`.
  2. Implement `storageService.ts` with local cache auto-syncing to Supabase when online.
  3. Ensure all state is persisted across page reloads without synthetic resets.

### Phase 2: Live GitHub & LeetCode Profile Integrations
* **Files**: `src/services/githubService.ts`, `src/services/leetcodeService.ts`, UI connect modals in `CareerTwinDrawer.tsx` & `Step1Profile.tsx`.
* **Deliverables**:
  1. **GitHub Integration**:
     * Query public repository API: `https://api.github.com/users/{username}/repos`.
     * Extract language breakdown, total stars, fork count, recent commits, and repo complexity.
     * Graceful fallback when rate-limited or offline.
  2. **LeetCode Integration**:
     * Query public stats proxy/GraphQL endpoint for total solved, difficulty breakdown (Easy, Medium, Hard), and topic tags.
     * Graceful fallback displaying `"Unable to sync right now — last synced X"` with manual input option.
  3. Integrate live stats into profile state and career twin inputs.

### Phase 3: Mathematical Career Readiness Score & Career Twin
* **Files**: `src/services/careerReadinessService.ts`, `src/services/careerTwinService.ts`, `src/components/dashboard/CareerTwinDrawer.tsx`.
* **Deliverables**:
  1. Formula implementation:
     $$\text{Readiness} = 0.25 \times \text{TechSkills} + 0.15 \times \text{DSA} + 0.20 \times \text{Projects} + 0.10 \times \text{Coding} + 0.10 \times \text{Portfolio} + 0.10 \times \text{Consistency} + 0.05 \times \text{CoreCS} + 0.05 \times \text{GoalAlignment}$$
  2. Provide clear delta explanations (e.g., `+4% Project Progress, +2% DSA, -1% Missed Weekly Goals`).
  3. Upgrade `CareerTwinDrawer.tsx` to render real interactive dimension gauges: Technical, DSA, Projects, Consistency.

### Phase 4: Diagnostic Assessment & Skill Gap Engine
* **Files**: `src/data/assessmentQuestions.ts`, `src/components/dashboard/AssessmentModal.tsx`, `src/services/skillGapService.ts`.
* **Deliverables**:
  1. Multi-domain diagnostic bank covering Programming, DSA (Arrays, Trees, DP), Core CS (DBMS, OS, OOP), and Domain-specific (AI/ML or Web) based on target role.
  2. Complete diagnostic modal with 8–10 questions, instant scoring, and calibrated proficiency.
  3. Skill Gap Generator categorizing skills into **Strong Skills**, **Developing Skills**, and **Critical Gaps**.

### Phase 5: Personalized Roadmap Generator
* **Files**: `src/services/roadmapService.ts`, `src/components/dashboard/RoadmapView.tsx`.
* **Deliverables**:
  1. Generate structured multi-week milestone roadmaps based on identified critical gaps and target timeline.
  2. Roadmap hierarchy: `Target Role` $\rightarrow$ `Core Milestones` $\rightarrow$ `Weekly Objectives` $\rightarrow$ `Daily Actions`.
  3. UI to view milestones, mark topics complete, reschedule, or regenerate when career target updates.

### Phase 6: Daily & Weekly Task Engine
* **Files**: `src/services/taskGenerationService.ts`, `src/context/TaskContext.tsx`, `src/components/dashboard/TodayTasksCard.tsx`.
* **Deliverables**:
  1. Generate 3–5 daily tasks derived from the active roadmap milestone.
  2. Implement task states: `Pending`, `In Progress`, `Completed`, `Skipped`, `Overdue`.
  3. Interactive features: check-off task with confetti, add custom task, reschedule to tomorrow.
  4. Weekly target tracker: DSA problem goals, learning sessions, project milestones.

### Phase 7: Real-Time Notification & Alert Engine
* **Files**: `src/services/notificationService.ts`, `src/context/NotificationContext.tsx`, `src/components/common/Navbar.tsx`.
* **Deliverables**:
  1. System triggers: Task reminders, overdue warnings, GitHub inactive warnings, weekly review alerts, and twin updates.
  2. Add notification bell icon with unread count in `Navbar.tsx`.
  3. Notification dropdown drawer with "Mark as read", "Clear all", and direct action navigation.

### Phase 8: Smart Interventions & Adaptive Workload
* **Files**: `src/services/interventionService.ts`, `src/components/dashboard/InterventionBanner.tsx`.
* **Deliverables**:
  1. Detect fatigue / missed tasks (if weekly completion < 50%, reduce daily workload and prioritize #1 critical gap).
  2. Detect topic weaknesses (if DP problems failed repeatedly, schedule dedicated recovery sessions).
  3. Adaptive plan banner on dashboard allowing the student to accept workload adjustments with one click.

### Phase 9: Projects & Portfolio Tracking Engine
* **Files**: `src/services/projectService.ts`, `src/components/dashboard/ProjectTrackerModal.tsx`.
* **Deliverables**:
  1. Lifecycle tracker: `Idea` $\rightarrow$ `Planning` $\rightarrow$ `Development` $\rightarrow$ `Testing` $\rightarrow$ `Deployed`.
  2. Dream Company Project Recommender: generates custom full-stack/AI architecture blueprints based on target company requirements.
  3. Portfolio Analyzer: flags repetitive CRUD apps and recommends high-impact architectural patterns.

### Phase 10: Weekly AI Career Review & Dashboard Assembly
* **Files**: `src/services/weeklyReviewService.ts`, `src/components/dashboard/StudentDashboard.tsx`.
* **Deliverables**:
  1. Weekly review generator analyzing task completion %, DSA velocity, strongest area, and areas needing attention.
  2. Update `StudentDashboard.tsx` with unified tabbed navigation:
     * **Tab 1: Overview** (Hero Readiness, Today's Tasks, Quick Coding Stats, Active Milestone).
     * **Tab 2: Daily Schedule** (Full task list, custom tasks, timers).
     * **Tab 3: Skill Roadmap** (Interactive syllabus and progress tree).
     * **Tab 4: Coding & DSA** (LeetCode and GitHub live cards, topic mastery).
     * **Tab 5: Projects & Portfolio** (Active projects and portfolio audit).
     * **Tab 6: Weekly Review** (AI progress report and next week's plan).

### Phase 11: End-to-End Verification & Acceptance Testing
* **Deliverables**:
  1. Unit tests via `vitest` for readiness score, skill gap analysis, and task generation.
  2. Manual testing of complete student journey from registration to weekly review.
  3. Validate offline resilience and graceful error handling.

---

## 5. Acceptance Criteria Checklist (20/20)

- [ ] **1. Registration / Login**: Preserves existing onboarding steps 1–7 and demo login.
- [ ] **2. Profile Storage**: Profile and settings persist across page reloads in local storage & Supabase.
- [ ] **3. GitHub Connection**: Pulls public repositories, languages, and commit activity.
- [ ] **4. LeetCode Connection**: Extracts solved problems, difficulty breakdown, and topics.
- [ ] **5. Diagnostic Assessment**: Comprehensive 8–10 question diagnostic across programming, DSA, and Core CS.
- [ ] **6. Skill Gap Analysis**: Computes Strong, Developing, and Critical Gaps matching target role.
- [ ] **7. Career Digital Twin**: Maintains a living representation across technical, coding, and behavioral metrics.
- [ ] **8. Personalized Roadmap**: Generates structured multi-week roadmap based on identified gaps.
- [ ] **9. Weekly Goals**: Displays measurable weekly targets (DSA, study sessions, project milestones).
- [ ] **10. Daily Tasks**: Interactive task checklist with category tags, time estimates, and check-offs.
- [ ] **11. Notifications**: In-app alerts for task reminders, overdue items, and twin updates.
- [ ] **12. Task Completion**: Checking off tasks updates daily progress and triggers the feedback loop.
- [ ] **13. Progress Updates**: Charts and streak meters reflect real completed tasks.
- [ ] **14. Activity Sync**: Re-syncing GitHub/LeetCode updates coding scores and twin dimensions.
- [ ] **15. Career Twin Update**: Twin dimensions evolve automatically without manual editing.
- [ ] **16. Personalized Intervention**: Flags consistency drops (<50%) and offers adaptive workload reduction.
- [ ] **17. Career Readiness Score**: Formula-driven score showing explicit reasons for changes.
- [ ] **18. Weekly AI Review**: Generates review summarizing performance and key recommendations.
- [ ] **19. Next Week's Plan**: Automatically adapts upcoming tasks from the weekly review.
- [ ] **20. Error Resilience**: Zero crashes if external APIs or Supabase are disconnected (graceful fallback).

---

## 6. Execution Command Reference


```bash
# Development Server
npm run dev

# Run Vitest Unit Tests
npm test

# Build & Validate Types
npm run build
```
