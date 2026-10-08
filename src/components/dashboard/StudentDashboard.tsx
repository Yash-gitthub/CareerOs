import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Compass, Sparkles, ArrowRight, Code2, Building, Target, Map as MapIcon, Flame, History,
  LayoutDashboard, ListChecks, FolderGit2, BookOpen, BarChart3, Briefcase, CalendarRange, Lock, ShieldCheck,
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { useCareer } from '../../store/CareerStore';
import type { DashboardTab } from '../../engine/types';
import { currentMilestone } from '../../engine/careerTwin';
import { activeWeek } from '../../engine/roadmap';
import { formatDate, timeAgo, localDate } from '../../engine/dates';
import { Button } from '../common/Button';
import { RingGauge } from '../charts/Charts';
import { AssessmentFlow, AssessmentModal } from './AssessmentModal';
import { SkillVerificationTable } from './SkillVerificationTable';
import { JourneyCard, LockedFeature } from './journey';
import { FEATURE_JOURNEY, isUnlocked } from '../../engine/unlocks';
import { latestAssessment } from '../../engine/skillGap';
import { isPreview } from '../../lib/preview';
import { CareerTwinDrawer } from './CareerTwinDrawer';
import { Card, CardHeader, EmptyState, Meter } from './ui';
import { InterventionBanner, SkillGapColumns, useReadinessDelta } from './insights';
import { ConsistencyCard, TasksTab, TodayTasksCard, WeeklyGoalsCard } from './tasks/TasksTab';
import { RoadmapTab } from './tabs/RoadmapTab';
import { CodingTab } from './tabs/CodingTab';
import { ProjectsTab } from './tabs/ProjectsTab';
import { LearningTab } from './tabs/LearningTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { PortfolioTab } from './tabs/PortfolioTab';
import { ReviewTab } from './tabs/ReviewTab';

const TAB_ICON: Record<DashboardTab, React.ReactNode> = {
  overview: <LayoutDashboard className="w-3.5 h-3.5" />,
  tasks: <ListChecks className="w-3.5 h-3.5" />,
  roadmap: <MapIcon className="w-3.5 h-3.5" />,
  coding: <Code2 className="w-3.5 h-3.5" />,
  projects: <FolderGit2 className="w-3.5 h-3.5" />,
  learning: <BookOpen className="w-3.5 h-3.5" />,
  analytics: <BarChart3 className="w-3.5 h-3.5" />,
  portfolio: <Briefcase className="w-3.5 h-3.5" />,
  review: <CalendarRange className="w-3.5 h-3.5" />,
};

// Tabs appear in the order they unlock.
const TABS = FEATURE_JOURNEY.map(f => ({ key: f.tab, label: f.label, icon: TAB_ICON[f.tab] }));

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Overview: React.FC<{ openAssessment: () => void; openTwin: () => void }> = ({ openAssessment, openTwin }) => {
  const { state, twin, setActiveTab } = useCareer();
  const milestone = currentMilestone(state);
  const week = activeWeek(state.roadmap);
  const hasAssessment = state.assessments.length > 0;
  const tasksOpen = isUnlocked(state, 'tasks');
  const checks = latestAssessment(state)?.skillChecks || [];

  return (
    <div className="space-y-6">
      <JourneyCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {tasksOpen && <TodayTasksCard compact limit={5} />}

          {checks.length > 0 && (
            <Card>
              <CardHeader
                icon={<ShieldCheck className="w-4 h-4" />}
                title="Skill verification"
                subtitle="Levels you claimed vs. what your test measured"
                action={<button onClick={openAssessment} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Retake →</button>}
              />
              <SkillVerificationTable checks={checks} />
            </Card>
          )}

          <Card>
            <CardHeader
              icon={<Target className="w-4 h-4" />}
              title="Skill gap analysis"
              subtitle={`Your skills vs. ${twin.career.targetRole} requirements`}
              action={<button onClick={openTwin} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Full Twin →</button>}
            />
            <SkillGapColumns limit={4} />
            {!hasAssessment && <p className="text-[11px] text-slate-500 mt-3">Based on your self-ratings only. The assessment replaces guesses with measured scores.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          {tasksOpen && <WeeklyGoalsCard />}

          <Card>
            <CardHeader icon={<MapIcon className="w-4 h-4" />} title="Current milestone" action={state.roadmap ? <button onClick={() => setActiveTab('roadmap')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Roadmap →</button> : undefined} />
            {milestone ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900">{milestone.title}</p>
                {week && <p className="text-xs text-slate-600">{week.week.title}: {week.week.topics.join(' · ')}</p>}
                <Meter value={milestone.weeks.filter(w => w.status === 'completed').length} max={Math.max(1, milestone.weeks.length)} label="Milestone progress" />
                <p className="text-[11px] text-slate-500">{milestone.weeks.filter(w => w.status === 'completed').length}/{milestone.weeks.length} weeks complete</p>
              </div>
            ) : (
              <EmptyState title={state.roadmap ? 'Roadmap complete 🎉' : 'No roadmap yet'} action={!state.roadmap ? <Button size="sm" variant="outline" onClick={openAssessment}>Take assessment</Button> : undefined} />
            )}
          </Card>

          {isUnlocked(state, 'coding') && <Card>
            <CardHeader icon={<Code2 className="w-4 h-4" />} title="Coding snapshot" action={<button onClick={() => setActiveTab('coding')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Details →</button>} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50"><div className="text-lg font-extrabold text-slate-900 tabular-nums">{twin.coding.problemsSolved ?? '—'}</div><div className="text-[10px] text-slate-500">Solved</div></div>
              <div className="p-2 rounded-lg bg-slate-50"><div className="text-lg font-extrabold text-slate-900 tabular-nums inline-flex items-center gap-0.5"><Flame className="w-4 h-4 text-amber-500" />{twin.coding.streak}</div><div className="text-[10px] text-slate-500">Day streak</div></div>
              <div className="p-2 rounded-lg bg-slate-50"><div className="text-lg font-extrabold text-slate-900 tabular-nums">{twin.coding.activeDays7}/7</div><div className="text-[10px] text-slate-500">Coding days</div></div>
            </div>
            {twin.coding.weakAreas.length > 0 && (
              <p className="text-[11px] text-slate-600 mt-3">Weakest: <strong>{twin.coding.weakAreas.map(w => w.label).join(', ')}</strong></p>
            )}
          </Card>}

          {tasksOpen && <ConsistencyCard />}
        </div>
      </div>

      <Card>
        <CardHeader icon={<History className="w-4 h-4" />} title="Career Twin activity" subtitle="Every event that updated your Twin" />
        {state.events.length ? (
          <ul className="divide-y divide-slate-100">
            {state.events.slice(0, 8).map(e => (
              <li key={e.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-700">{e.summary}</span>
                <span className="text-slate-400 shrink-0">{timeAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No activity yet." />
        )}
      </Card>

      {!hasAssessment && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Next Recommended Step</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Take your Career Assessment</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Programming, 10 DSA topics, Core CS and {twin.career.domain} questions. Your Career Twin uses the results to build your roadmap and daily tasks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Button variant="outline" onClick={openTwin} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">Explore My Career Twin</Button>
            <Button variant="primary" onClick={openAssessment} rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-6 py-2.5 shadow-md">Start Assessment</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentDashboard: React.FC = () => {
  const { user } = useOnboarding();
  const { state, twin, activeTab, setActiveTab } = useCareer();
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isTwinDrawerOpen, setIsTwinDrawerOpen] = useState(false);
  const [verifying, setVerifying] = useState(state.assessments.length === 0);
  const { last, prev } = useReadinessDelta();

  const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Engineer';
  const dreamCompany = user.career.dreamCompany || 'Top Tech Companies';
  const delta = last && prev ? Math.round((last.score - prev.score) * 10) / 10 : null;

  const openAssessment = () => setIsAssessmentOpen(true);
  const openTwin = () => setIsTwinDrawerOpen(true);

  // Nothing opens until the skill verification test is done. The gate stays up after
  // submitting so the student sees their claimed-vs-verified results first.
  const preview = isPreview();
  if (!preview && (state.assessments.length === 0 || verifying)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {state.assessments.length === 0 && (
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome, {firstName}. One step before you start.</h1>
            <p className="text-sm text-slate-600">Verify the skills in your profile so CareerOS can trust them and plan from your real level.</p>
          </div>
        )}
        <AssessmentFlow variant="gate" onClose={() => setVerifying(false)} />
      </div>
    );
  }

  const tabUnlocked = preview || isUnlocked(state, activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Greeting & Readiness Hero */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-50/60 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <button onClick={openTwin} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100">
              <Compass className="w-3.5 h-3.5" />
              <span>Career Twin v{state.twinVersion} · {twin.stage}</span>
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{greeting()}, {firstName}</h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {twin.calibrated
                ? <>Your Career Twin last updated {timeAgo(state.twinUpdatedAt)}. {twin.weaknesses[0] ? <>Top priority right now: <strong>{twin.weaknesses[0]}</strong>.</> : 'Keep up the momentum.'}</>
                : <>Your Career Twin is getting to know you. Take the assessment or connect GitHub/LeetCode to benchmark yourself against <strong>{twin.career.targetRole}</strong>.</>}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-600" />Target Role: <strong className="text-slate-800">{twin.career.targetRole}</strong></span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-600" />Company Bar: <strong className="text-slate-800">{dreamCompany}</strong></span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 lg:min-w-[300px] flex items-center gap-4">
            <RingGauge value={twin.readiness.score} label={`Career readiness ${twin.readiness.score}%`} />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">Career Readiness</div>
              {delta !== null && delta !== 0 && (
                <div className={clsx('text-xs font-bold tabular-nums', delta > 0 ? 'text-emerald-700' : 'text-red-600')}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} pts since {prev ? formatDate(localDate(prev.createdAt)) : ''}
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                {twin.readiness.components.filter(c => c.value === null).length
                  ? `${twin.readiness.components.filter(c => c.value === null).length} of 8 parts not measured yet`
                  : 'All parts measured'}
              </p>
              <button onClick={openTwin} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800">
                Why this score <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <div role="status" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <strong>Preview mode (development only).</strong> The skill test and feature locks are bypassed in this browser tab. Remove <code>?preview</code> from the URL to see the normal flow.
        </div>
      )}

      <InterventionBanner />

      {/* Tabs */}
      <nav className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Dashboard sections">
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-max sm:w-auto" role="tablist">
          {TABS.map(t => {
            const open = isUnlocked(state, t.key);
            const isNew = open && !state.visitedTabs.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                title={open ? undefined : `Locked: ${FEATURE_JOURNEY.find(f => f.tab === t.key)?.requirement}`}
                onClick={() => setActiveTab(t.key)}
                className={clsx(
                  'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  activeTab === t.key
                    ? open ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                    : open ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-50'
                )}
              >
                {open ? t.icon : <Lock className="w-3.5 h-3.5" />}{t.label}
                {isNew && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" aria-label="New" />}
              </button>
            );
          })}
        </div>
      </nav>

      <div role="tabpanel">
        {!tabUnlocked && <LockedFeature tab={activeTab} />}
        {tabUnlocked && activeTab === 'overview' && <Overview openAssessment={openAssessment} openTwin={openTwin} />}
        {tabUnlocked && activeTab === 'tasks' && <TasksTab />}
        {tabUnlocked && activeTab === 'roadmap' && <RoadmapTab onStartAssessment={openAssessment} />}
        {tabUnlocked && activeTab === 'coding' && <CodingTab />}
        {tabUnlocked && activeTab === 'projects' && <ProjectsTab />}
        {tabUnlocked && activeTab === 'learning' && <LearningTab />}
        {tabUnlocked && activeTab === 'analytics' && <AnalyticsTab />}
        {tabUnlocked && activeTab === 'portfolio' && <PortfolioTab />}
        {tabUnlocked && activeTab === 'review' && <ReviewTab />}
      </div>

      <AssessmentModal isOpen={isAssessmentOpen} onClose={() => setIsAssessmentOpen(false)} />
      <CareerTwinDrawer isOpen={isTwinDrawerOpen} onClose={() => setIsTwinDrawerOpen(false)} onStartAssessment={openAssessment} />
    </div>
  );
};
