# AI CareerOS — Implementation Plan v2

Turning the demo into a working Career OS built around the Career Twin feedback loop.

> **Status (Oct 2026):**
> - Phase 1 (auth + RLS migration) is implemented.
> - The feature UI for Phases 2–11 is implemented on a client-side engine (`src/engine/*`, `src/store/CareerStore.tsx`). It stores data in the browser's localStorage, one store per user, with the same shapes as the tables in `002_core.sql`.
> - GitHub sync calls GitHub's public API directly from the browser. LeetCode sync uses `supabase/functions/leetcode-sync`, with manual entry as a fallback.
> - Remaining work:
>   - Persist the store to the Supabase tables.
>   - Move scheduled checks (overdue, reminders, weekly review) to `pg_cron`; today they run only while the app is open.
>   - Add the optional LLM narrative layer.

This plan replaces `IMPLEMENTATION_PLAN.md` where they disagree. The main difference is that v1 runs everything in the browser. That can't meet the security requirements (API keys, the GitHub OAuth secret, real auth) and can't call LeetCode, which blocks browser requests (CORS). v2 adds a thin server layer on the Supabase project you already have.

---

## 0. Audit of the current codebase

**Stack:** React 19 + Vite 8 + TypeScript + Tailwind 3 + framer-motion + lucide + Supabase JS. State-driven router in `App.tsx` (no react-router). A single `OnboardingContext` holds all state, persisted to `localStorage` and upserted to `profiles` in Supabase. Vitest is set up.

| Area | Status | Evidence |
|---|---|---|
| Onboarding Steps 1–7, role selection, mentor registration | ✅ Working | `components/onboarding/*`, `OnboardingContext.tsx` validation |
| Profile persistence | 🟡 Partial | `localStorage` + `profiles` upsert; the whole profile is one JSONB blob per section |
| Datasets (colleges, companies, roles, skills) | ✅ Working | `src/data/*` |
| Skill scoring maths | 🟡 Built but unused | `utils/skillScoring.ts` + tests; nothing imports it |
| Career Twin build screen | 🟠 Mock | `CareerTwinSetup.tsx` is a `setTimeout` animation |
| Dashboard | 🟠 Mock | Static cards; "Pending" readiness; placeholder plan |
| Career Twin drawer | 🟠 Mock | Static strings; GitHub button calls `alert()` |
| Assessment | 🔴 Broken | 3 hardcoded questions; any answer advances; always records `score: 3` |
| Auth | 🔴 Broken / insecure | Login only checks that the email exists — the password is never verified; the plaintext password sits in `localStorage` inside the profile object |
| DB security | 🔴 Insecure | RLS policies `USING (true)` for anon — anyone with the anon key can read every student's email and phone |
| Query safety | 🔴 Bug | `fetchProfileFromSupabase` puts raw user input into a PostgREST `.or()` filter string |
| Demo login | 🟠 Mock | Fabricated strengths and gaps for "Aarav Sharma" (contradicts the "No synthetic data" footer) |
| GitHub, LeetCode, tasks, roadmap, notifications, projects, portfolio, analytics, weekly review, interventions | ⚪ Missing | — |
| AI / LLM | ⚪ Missing | No model calls anywhere |
| Charts | ⚪ Missing | No chart library |

**Preserve:** every onboarding screen and field, the design system (Tailwind tokens, `common/*` components), the state router pattern, `skillScoring.ts`, and the `profiles` table shape (extend it, don't replace it).

---

## 1. Key architecture decisions

1. **Supabase is the backend.** Use Supabase Auth, Postgres with proper RLS, Edge Functions for logic and external calls, and `pg_cron` for time-based jobs. No separate Node server.
2. **Deterministic engines first, LLM second.** Scores, gaps, consistency, interventions and task scheduling are pure TypeScript functions: testable, explainable, and free to run. The LLM only does what needs language: roadmap personalisation, project blueprints, weekly review text and portfolio feedback. Every LLM call has a JSON schema, validation and a deterministic fallback, so the app works with no AI key configured.
3. **One event pipeline.** Every meaningful action is recorded as an `activity_event`, and one function, `processEvent`, runs the twin update chain (§4). Nothing updates the twin outside that path.
4. **Shared engine code.** Pure engines live in `shared/engine/` and are imported by both Edge Functions (Deno) and Vitest. The frontend imports them only for optimistic previews.
5. **Keep the state router.** Add a persisted `dashboardTab` instead of introducing react-router. Two new dependencies: `@tanstack/react-query` (loading, error and retry states for every server call) and `recharts` (analytics).
6. **Never fabricate.** Missing data shows as "Not measured yet — connect LeetCode to unlock". It never shows an invented number. The LLM is never allowed to output URLs; resources come from a curated table.

```
React (Vite) ──supabase-js──► Postgres (RLS: auth.uid() = user_id)    ← plain CRUD
     │
     └──functions.invoke──► Edge Functions ──► GitHub API / LeetCode GraphQL / LLM API
                                 │                (secrets in Supabase env only)
                                 └──► processEvent pipeline ──► twin, gaps, readiness, notifications
pg_cron (hourly) ──► scheduler function: overdue, reminders, weekly review, inactivity checks
```

---

## 2. Data model (`supabase/migrations/002_core.sql`)

All tables have `user_id uuid references auth.users` and the RLS policy `auth.uid() = user_id` for select, insert, update and delete. Remove the existing `USING (true)` policies.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` (extend) | `+ github_username, leetcode_username, notification_prefs jsonb, workload_multiplier numeric default 1.0` | `id` becomes `auth.uid()::text` |
| `integrations` | `provider ('github'\|'leetcode'), username, status ('connected'\|'error'\|'syncing'), last_success_at, last_error, last_attempt_at` | Drives the "Unable to sync — last success 2h ago [Retry]" message |
| `github_snapshots` | `repos jsonb, languages jsonb, stars, forks, push_days_30, contribution_calendar jsonb, synced_at` | Append-only, one row per sync |
| `leetcode_snapshots` | `easy, medium, hard, total, tag_counts jsonb, contest jsonb, submission_calendar jsonb, synced_at` | Append-only |
| `assessments` | `version, answers jsonb, section_scores jsonb, communication_self jsonb, completed_at` | Replaces `assessment_results` (keep the old table read-only) |
| `skill_states` | `skill, category, score 0–100, tier, sources jsonb, updated_at` | Output of `skillScoring.ts`; unique `(user_id, skill)` |
| `skill_gaps` | `skill, required, current, gap, bucket ('strong'\|'developing'\|'critical'), priority` | Recomputed by the pipeline |
| `career_twins` | `technical, coding, project, learning, behavioral jsonb; readiness, consistency, stage, version int, updated_at` | One row per user, plus a `twin_history` table for versions |
| `readiness_snapshots` | `score, components jsonb, reason_event_id, created_at` | Powers charts and the "68% → 74%, +4% Projects" explanation |
| `roadmaps` / `roadmap_milestones` / `roadmap_weeks` | goal → milestone (order, skill, status) → week (topics, status, start_date) | Statuses: `pending, active, completed, skipped` |
| `tasks` | `title, description, category, priority, est_minutes, due_date, status, source ('roadmap'\|'intervention'\|'personal'\|'project'), milestone_id, week_id, project_id, gen_key unique` | `gen_key` makes daily generation idempotent |
| `weekly_goals` | `week_start, category, target, actual` | DSA, learning, project, GitHub |
| `weekly_reviews` | `week_start, metrics jsonb, narrative jsonb, next_week_params jsonb` | |
| `activity_events` | `type, payload jsonb, created_at, processed_at` | The event log (§4) |
| `notifications` | `type, title, body, action jsonb, read_at, created_at, dedupe_key unique` | |
| `interventions` | `rule, severity, message, proposed_change jsonb, status ('open'\|'accepted'\|'dismissed'), cooldown_until` | |
| `projects` / `project_milestones` | stage enum `idea → planning → development → testing → deployment → completed`; `tech_stack, repo_url, deploy_url, start_date, deadline, is_recommended` | |
| `portfolio_items` | `kind ('achievement'\|'education'\|'experience'\|'certification'\|'link'), data jsonb` | |
| `learning_resources` | `title, url, type, skill, difficulty, est_minutes, tags` | **Curated seed data**, shared and readable by all |
| `learning_activity` | `resource_id, task_id, minutes, completed_at` | |

Config tables (seeded, read-only): `role_requirements(role, skill, required_score, weight)` and `readiness_weights(component, weight)`, which makes the score weights configurable.

---

## 3. Scoring definitions (deterministic, in `shared/engine/`)

**Skill score:** reuse `calculateSkillScore`. Inputs: self-rating (onboarding level mapped Beginner = 1 … Advanced = 4.5), quiz score (assessment section), project count (projects using the skill plus GitHub repos whose language matches), and cert count (portfolio certifications).

**Skill gaps:** `gap = required − current` against `role_requirements`.
- Strong: `gap ≤ 0`
- Developing: `0 < gap ≤ 25`
- Critical: `gap > 25`, or the skill is missing and `weight ≥ 0.7`
- Priority: `gap × weight`

LeetCode topic coverage feeds the DSA sub-skills (Arrays, Trees, Graphs, DP…) as `min(100, solved_in_tag / tag_target × 100)`. Tag targets are per role.

**Readiness, 0–100.** Default weights, configurable:

| Component | Weight | Measured from |
|---|---|---|
| Technical skills | 25 | Weighted mean skill score for role-required skills |
| DSA | 15 | 50% assessment DSA + 50% LeetCode difficulty-weighted progress toward role target |
| Projects | 20 | Relevance-weighted stage progress (deployed/completed count fully) |
| Coding activity | 10 | Active days (LC submissions ∪ GH pushes) in the last 28 days / 20 |
| Portfolio | 10 | Completeness checklist (§Phase 9) |
| Learning consistency | 10 | 28-day consistency score |
| Core CS | 5 | Assessment Core CS section |
| Goal alignment | 5 | Roadmap weeks on schedule / weeks elapsed |

An unmeasured component scores 0 and is labelled "Not measured" with an unlock action. Each snapshot stores its components, and the UI diffs consecutive snapshots to show the reasons behind a change.

**Consistency (7-day and 28-day):** `0.6 × task completion rate + 0.25 × active days / 7 + 0.15 × learning sessions done / planned`. Skipped tasks count against the score unless rescheduled.

---

## 4. Career Twin update pipeline (the core loop)

`supabase/functions/events/index.ts` → `POST /events { type, payload }`

```
validate (zod) → insert activity_event
→ apply side effects (task.status, project.stage, snapshot rows…)
→ recompute affected inputs only (see table)
→ rebuild career_twin (version++), write twin_history
→ recompute skill_gaps
→ write readiness_snapshot (+ diff reasons)
→ run intervention rules → interventions + notifications
→ if required: adjust tasks/roadmap (e.g., insert recovery tasks, shift weeks)
→ return { twin, readinessDelta, newNotifications, interventions }
```

| Event | Recomputes |
|---|---|
| `task.completed / skipped / missed` | consistency, behavioral, goal alignment, roadmap week progress |
| `assessment.completed` | skill_states (quiz), gaps, DSA, Core CS, **triggers initial roadmap** |
| `github.synced` | coding activity, project profile, skill_states (project_count) |
| `leetcode.synced` | DSA, topic coverage, coding activity |
| `project.updated` | project component, skill_states |
| `learning.completed` | learning profile, consistency |
| `weekly_review.completed` | next week's parameters → regenerate weekly goals and tasks |

The client invalidates React Query caches from the response, so the dashboard updates immediately without a refetch storm.

---

## 5. Phases

Each phase ends with something demoable and does not break earlier phases.

### Phase 1 — Security and data foundation (do this first)
- Supabase Auth email/password signup at Step 1 (`supabase.auth.signUp`) and real `signInWithPassword` in `LoginModal`. Strip `password` and `confirmPassword` from persisted state, and stop writing them to `localStorage`.
- Migration `002_core.sql`: the tables above, owner-only RLS, removal of the `USING (true)` policies, and seeds for `role_requirements`, `readiness_weights` and `learning_resources`.
- Replace the `.or()` string filter with `.eq('id', session.user.id)`.
- Demo login becomes a real seeded demo account, or is clearly labelled as a sandbox. Remove the fabricated twin strengths.
- `src/services/api.ts` (typed wrappers) and a `QueryClientProvider` in `App.tsx`.
- `.env.example`: client vars stay `VITE_*`. Server secrets (`GITHUB_TOKEN`, `GITHUB_CLIENT_SECRET`, `LLM_API_KEY`) go in Supabase function secrets, never in `VITE_*`.
- Session guard: when there is no session, route to `welcome`, except for onboarding screens.

**Done when:** you can't log in with a wrong password, a refresh keeps the session, and an anon-key query on `profiles` returns nothing.

### Phase 2 — Profile integrations
- **GitHub** (`functions/github-sync`):
  - Username-based public data using a server-side token (rate limit 5,000/hr): `/users/{u}/repos` for names, languages, stars, forks and `pushed_at`, plus `/users/{u}/events/public` for push days.
  - GraphQL `contributionsCollection` for the contribution calendar.
  - Optional "Verify with GitHub" through Supabase `linkIdentity('github')` with the default `read:user` scope only. No private repos.
- **LeetCode** (`functions/leetcode-sync`): server-side proxy to the public GraphQL endpoint — `submitStatsGlobal`, `tagProblemCounts`, `userContestRanking`, `submissionCalendar`. The endpoint is unofficial, so wrap it in a schema check and treat shape changes as `partial` data.
- **Shared error model:** `missing_username | not_found | rate_limited | auth_failed | timeout (8s) | upstream_error | empty | partial`. On failure, write `integrations.last_error` but keep the last good snapshot. The UI shows "Unable to sync right now · Last successful sync 2 hours ago · [Retry] [Edit username]".
- **UI:** `IntegrationCard` component. Add an optional "Coding profiles" section to Step 7 Review (skippable, so the existing flow doesn't change), and use the same card in the Twin drawer, replacing the `alert()`.
- Each successful sync emits `github.synced` or `leetcode.synced`.

### Phase 3 — Assessment and skill gap engine
- `src/data/assessment/`: question banks for Programming, DSA (all 10 topics), Core CS (OOP, DBMS, OS, CN, COA), Domain (AI/ML, Web, Backend, chosen by target role) and a Communication self-rating (5 Likert items). About 25 questions, sampled per attempt, with topic tags.
- Rewrite `AssessmentModal` internals and keep its shell: track answers, score correctly, show per-section results, allow resuming (the draft is saved).
- `shared/engine/skillGap.ts`. Emit `assessment.completed`.
- Dashboard hero switches from "Pending" to the real readiness score after the first assessment.

### Phase 4 — Career Twin
- `shared/engine/careerTwin.ts` builds the six twin sections (§6 of the brief) from stored data.
- `CareerTwinSetup` runs real analysis (the `analyze` function) and shows progress steps tied to actual promise stages, not timers.
- `CareerTwinDrawer` renders real sections, a readiness breakdown, "why it changed", and integration cards.
- Notification on a twin version bump: "Your Career Twin has been updated".

### Phase 5 — Roadmap
- `functions/roadmap`:
  1. A deterministic skeleton from `roadmap_templates[role]`, filtered and ordered by gap priority and sized by timeline × daily study time.
  2. Optional LLM personalisation (reorder, rename, add company-specific focus) under a strict JSON schema. If validation fails, use the skeleton.
- Hierarchy: goal → milestones → monthly groups (derived) → weeks → daily tasks.
- `RoadmapView` tab: view, complete, skip, reschedule (shifts the following weeks), regenerate (keeps completed items), and adjust (edit pace or hours).

### Phase 6 — Task engine (daily and weekly)
- `shared/engine/taskGen.ts`: inputs are the active week's topics, top gaps, LeetCode weak tags, active project milestone, daily minute budget × `workload_multiplier`, and the learning-method preference. The output is 3–6 tasks across categories (dsa / learning / project / github / core_cs), with `gen_key = date:week:slot` so regenerating is idempotent.
- Daily tasks are generated lazily on the first open of the day, and by cron at 05:00 local time.
- `TodayTasks` card on Overview plus a full Tasks tab: complete, start, edit, skip (with reason), reschedule, add a personal task. Every state change emits an event.
- `weekly_goals` are created on Monday from the plan, and `actual` is recomputed from events. Shown as "DSA 8/10, Learning 5/6…".

### Phase 7 — Notifications
- `functions/scheduler` (run hourly by `pg_cron`) handles due-today, upcoming (sessions 30 minutes before, using `preferredStudyTime`), overdue rollups, GitHub inactivity (7 days), learning reminders, and the Sunday-night weekly review.
- Event-driven notifications: twin update, intervention, review ready.
- `dedupe_key` prevents duplicates. `notification_prefs` lets users disable types and is pre-filled from `reminderPreference`.
- A Navbar bell with an unread count, a notification panel (mark one read, mark all read, deep-link to a tab), and a preferences screen.
- The browser Notification API fires while a tab is open. Web Push (service worker + VAPID) is optional and comes later (Phase 12).

### Phase 8 — Progress analytics
- Analytics tab (`recharts`, using the existing palette): readiness over time, skill growth (`skill_states` history), task completion per week, learning hours, LeetCode solved over time, project progress, consistency.
- All charts are built from snapshots and events. Empty states explain how to generate data.

### Phase 9 — Projects and portfolio
- Projects tab: CRUD, stage pipeline, milestones (each can spawn tasks), repo and deploy links. Repos can be linked from the GitHub snapshot. Changes emit `project.updated`.
- `functions/project-recommend`: the LLM gets structured context (role, company, gaps, existing projects, hours per week) and returns a blueprint with every field in §16 of the brief. "Adopt project" creates the project, its milestones and tasks.
- Portfolio tab: the remaining sections (achievements, education pre-filled from onboarding, experience, certifications, links).
- `shared/engine/portfolioAnalyzer.ts`, deterministic checks: missing sections, short or vague descriptions, CRUD-only stacks (heuristics on tech and keywords), no deployments, duplicated stacks. An optional LLM pass rewrites the feedback. It never invents achievements.

### Phase 10 — Learning hub
- Rank `learning_resources` by `gap priority × skill match × difficulty fit × preferred format`. Each card shows the reason it was recommended, difficulty, time, skill and milestone.
- "Start" creates or links a task. "Complete" emits `learning.completed`.

### Phase 11 — Interventions, weekly review and adaptation
`shared/engine/interventions.ts` is a rule table, and each rule has a cooldown:

| Rule | Trigger | Action |
|---|---|---|
| Overload | 7-day completion < 50% | Propose `workload_multiplier` 0.6 and focus on the top gap |
| Weak area | Assessment section < 40%, or LC tag coverage < 25% on a critical skill | Recovery mini-plan (3 focused tasks) |
| Low coding | < 2 active coding days in 7 | More DSA reminders, plus one small daily DSA task |
| Project stale | No project update or push in 10 days | Create a milestone task |
| Accelerating | 2 weeks with > 90% completion and rising skill scores | Increase difficulty, multiplier 1.2 |
| Ahead | Week completed early | Pull the next roadmap week forward |

The student accepts or dismisses each proposal. Accepting emits an event and applies the change.

`functions/weekly-review` computes deterministic metrics (completion %, deltas per component, strongest area, weakest area) and adds an LLM narrative with a deterministic text fallback. It writes `next_week_params` (focus skills, multiplier, session counts), which drive the next week's weekly goals and tasks. A Weekly Review tab shows past reviews.

### Phase 12 — Hardening and testing
- Vitest unit tests for every `shared/engine` module (readiness, gaps, consistency, taskGen, interventions, portfolio) — table-driven.
- Integration tests for the Edge Functions with mocked GitHub and LeetCode, covering all eight error cases.
- An end-to-end script (Playwright) for the 20 acceptance steps, using the seeded demo user and a clock override for the weekly flows.
- Lint, `tsc -b`, and a review of every RLS policy.

---

## 6. AI layer

`supabase/functions/_shared/ai/`
- `client.ts`: a provider-agnostic wrapper. Model and key come from env. It handles timeouts, retries, JSON-schema validation and token caps.
- `context/*.ts`: one context builder per service. Each sends a compact, structured summary (profile essentials, top 10 gaps, last 4 weeks of metrics, project summaries), not raw tables.
- `prompts/*.ts`: versioned prompts for `roadmapService`, `taskGenerationService` (wording only), `projectRecommendationService`, `weeklyReviewService`, `portfolioReviewService` and `interventionService` (message tone).
- Every service has a deterministic fallback. Responses are cached by a context hash so repeated opens don't call the model again.
- Guardrails: no URLs, no invented stats. All numbers in a narrative must come from the provided metrics, and the validator rejects any number it can't find in them.

---

## 7. API surface

Plain CRUD goes straight through supabase-js under RLS (tasks edit, notifications read, projects, portfolio). Logic lives in Edge Functions:

| Brief route | Implementation |
|---|---|
| `/api/profile` | `profiles` table (RLS) |
| `/api/github`, `/api/leetcode` | `github-sync`, `leetcode-sync` functions |
| `/api/assessment` | `assessments` + `events(assessment.completed)` |
| `/api/career-twin`, `/api/skills`, `/api/career-readiness`, `/api/progress` | Read tables; recompute via `events` / `analyze` |
| `/api/roadmap` | `roadmap` function (generate, regenerate, adjust) |
| `/api/tasks`, `/tasks/daily`, `/tasks/weekly` | `tasks` table + `generate-tasks` function |
| `/api/notifications` | `notifications` table + `scheduler` |
| `/api/projects`, `/api/coding` | tables + `project-recommend` |
| `/api/interventions` | `interventions` table + accept/dismiss through `events` |
| `/api/weekly-review` | `weekly-review` function |

All function inputs are validated with zod and return `{ ok, data } | { ok: false, code, message }`.

---

## 8. Frontend changes (UI preserved)

- `App.tsx`: wrap in `QueryClientProvider`; add an auth/session guard.
- `StudentDashboard`: keep the hero and cards. Add a tab bar: Overview · Tasks · Roadmap · Coding · Projects · Learning · Analytics · Portfolio · Weekly Review. Reuse `common/*` and the card styling.
- New components go in `components/dashboard/<feature>/`. Each data hook is in `src/hooks/use<Feature>.ts` and exposes `isLoading`, `error` and `retry`, with copy like "Generating your roadmap…" or "Syncing LeetCode…". Failures stay scoped to their card (an error boundary per card), so a GitHub failure can never crash the dashboard.
- `OnboardingContext` stays responsible for onboarding. New `DashboardContext` holds only UI state (active tab); server state lives in React Query.

---

## 9. Acceptance mapping

| # | Criterion | Phase |
|---|---|---|
| 1–2 | Register/login, complete profile | 1 |
| 3–4 | GitHub, LeetCode | 2 |
| 5–6 | Assessment, skill gaps | 3 |
| 7 | Career Twin created | 4 |
| 8 | Roadmap | 5 |
| 9–10 | Weekly goals, daily tasks | 6 |
| 11 | Notifications | 7 |
| 12–13 | Complete tasks → progress | 6, 8 |
| 14–15 | Sync → twin update | 2, 4 |
| 16 | Intervention | 11 |
| 17 | Readiness change with reasons | 4, 8 |
| 18–20 | Weekly review → adapted plan → loop | 11 |

---

## 10. Decisions needed from the team

1. **LLM provider and key.** The plan works without one (deterministic fallbacks), but the roadmap, project and review quality depend on it.
2. **Supabase plan.** Does it allow `pg_cron` and Edge Functions? Both are needed for time-based reminders. Without them, reminders only fire when the app is opened.
3. **Curated resources.** Someone has to seed about 150 real `learning_resources` across the role skills. The LLM must not invent them.
4. **Demo account.** Keep a seeded real account, or drop the demo login?
5. **Web Push.** Is in-app plus in-tab notifications enough for v1?
