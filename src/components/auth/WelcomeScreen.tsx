import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../common/Button';
import { TerminalLabel } from '../common/TerminalLabel';
import { StatCard } from '../common/StatCard';
import { ROLE_REQUIREMENTS, DSA_TOPICS } from '../../engine/roleRequirements';
import { SKILL_CATEGORIES } from '../../data/skillsData';

// Counts shown on the landing page come from the app's own data, not marketing numbers.
const STATS = [
  { label: 'TARGET_ROLES', value: String(Object.keys(ROLE_REQUIREMENTS).length), sub: 'role benchmarks' },
  { label: 'SKILLS_MAPPED', value: String(SKILL_CATEGORIES.reduce((n, c) => n + c.skills.length, 0)), sub: 'across 6 domains' },
  { label: 'DSA_TOPICS', value: String(DSA_TOPICS.length), sub: 'tracked per student' },
];

const PIPELINE = [
  { stage: 'PROFILE_BASELINE', detail: 'Skills · education · goals', status: 'READY' },
  { stage: 'SKILL_VERIFICATION', detail: 'Tiered test per claimed skill', status: 'REQUIRED' },
  { stage: 'GAP_ANALYSIS', detail: 'Role requirements vs. you', status: 'DYNAMIC' },
  { stage: 'ROADMAP_ENGINE', detail: 'Weekly milestones + daily tasks', status: 'ADAPTIVE' },
];

const delay = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

export const WelcomeScreen: React.FC = () => {
  const { setCurrentScreen } = useOnboarding();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 space-y-16 sm:space-y-20">
      {/* Hero */}
      <section className="space-y-8">
        <div className="animate-fade-up" style={delay(0)}>
          <TerminalLabel>// SYSTEM STATUS: ONLINE</TerminalLabel>
        </div>

        <h1
          className="animate-fade-up font-display font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[2.6rem] sm:text-7xl lg:text-[6.5rem] break-words"
          style={delay(80)}
        >
          <span className="neon-text block">AI Career</span>
          <span className="neon-text">Operating </span>
          <span className="neon-text-magenta">System</span>
        </h1>

        <div className="animate-fade-up font-mono text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl space-y-1" style={delay(160)}>
          <p><span className="text-indigo-500">&gt;</span> Your AI career twin that knows your skills, goals and progress.</p>
          <p><span className="text-indigo-500">&gt;</span> Verified skills. Adaptive roadmap. Placement ready.</p>
        </div>

        <div className="animate-fade-up flex flex-col sm:flex-row gap-3 sm:gap-4" style={delay(240)}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setCurrentScreen('role-selection')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            [Get_Started]
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentScreen('login')}
            className="w-full sm:w-auto"
          >
            [I_Have_An_Account]
          </Button>
        </div>

        <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5" style={delay(300)}>
          <button
            type="button"
            onClick={() => setCurrentScreen('role-selection')}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-sm border border-slate-200 hover:border-indigo-300 bg-transparent hover:bg-indigo-50 font-mono text-[11px] font-medium text-slate-700 transition-all active:scale-[0.99]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          <span className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            Built for Computer Engineering & IT. Privacy-first. No credit card.
          </span>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" aria-label="CareerOS at a glance">
        {STATS.map((s, i) => (
          <div key={s.label} className="animate-fade-up" style={delay(360 + i * 80)}>
            <StatCard label={s.label} value={s.value} sub={s.sub} />
          </div>
        ))}
      </section>

      {/* Pipeline feed */}
      <section className="animate-fade-up terminal-panel corner-brackets rounded-sm overflow-hidden" style={delay(600)} aria-label="Career Twin pipeline">
        <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-5 border-b border-indigo-200/60">
          <TerminalLabel live>CAREER_TWIN_PIPELINE</TerminalLabel>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400 tracking-wider">NODE_ID: CTX-08X4F2</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[560px] divide-y divide-indigo-200/40 px-5 sm:px-8">
            {PIPELINE.map((row, i) => (
              <div key={row.stage} className="group grid grid-cols-[2rem_1.2fr_1.5fr_auto] items-center gap-4 py-4 font-mono text-[13px] transition-colors hover:bg-indigo-50/40 -mx-5 sm:-mx-8 px-5 sm:px-8">
                <span className="text-slate-400 text-[11px]">0{i + 1}</span>
                <span className="text-slate-800 tracking-wide">{row.stage}</span>
                <span className="text-indigo-500/90 text-xs sm:text-[13px]">{row.detail}</span>
                <span className="text-emerald-600 text-right text-xs tracking-wider">{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
