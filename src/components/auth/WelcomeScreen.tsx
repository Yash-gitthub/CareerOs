import React from 'react';
import { ArrowRight, Code2, FolderGit2, BookOpen, Target, GitBranch, MessagesSquare, CalendarCheck } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';

// The seven signals the Career Twin learns from, placed around the orbit.
const ORBIT = [
  { label: 'Skills', icon: Code2 },
  { label: 'Projects', icon: FolderGit2 },
  { label: 'Learning', icon: BookOpen },
  { label: 'Goals', icon: Target },
  { label: 'GitHub', icon: GitBranch },
  { label: 'Interviews', icon: MessagesSquare },
  { label: 'Consistency', icon: CalendarCheck },
];

const STEPS = [
  { n: '01', title: 'You tell it where you are.', body: 'Your skills, the role you\'re curious about, and how much time you really have.', tone: 'paper' as const },
  { n: '02', title: 'It notices what you do.', body: 'Problems solved, commits pushed, sessions missed. Patterns, not just tasks.', tone: 'sage' as const },
  { n: '03', title: 'It suggests the next move.', body: 'One clear step at a time, always with a reason you can read and disagree with.', tone: 'peach' as const },
];

const delay = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

const TwinOrbit: React.FC = () => (
  <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden="true">
    {/* Rings */}
    <div className="absolute inset-[4%] rounded-full border border-slate-300/70" />
    <div className="absolute inset-[20%] rounded-full border border-dashed border-slate-300/80" />
    <div className="absolute inset-[33%] rounded-full bg-indigo-100/60" />

    {/* Centre */}
    <div className="absolute inset-[37%] rounded-full bg-slate-900 text-white flex flex-col items-center justify-center text-center shadow-card-hover">
      <span className="text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">Career Twin</span>
      <span className="font-display italic text-2xl sm:text-3xl leading-none mt-1">You</span>
      <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1">3rd year · CSE</span>
    </div>

    {/* Signals on the outer ring */}
    {ORBIT.map(({ label, icon: Icon }, i) => {
      const angle = (i / ORBIT.length) * 2 * Math.PI - Math.PI / 2;
      const x = 50 + 46 * Math.cos(angle);
      const y = 50 + 46 * Math.sin(angle);
      return (
        <div
          key={label}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-fade-up"
          style={{ left: `${x}%`, top: `${y}%`, ...delay(300 + i * 70) }}
        >
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-subtle text-[10px] sm:text-[11px] font-medium text-slate-700 whitespace-nowrap">
            <span className="hidden sm:flex w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 items-center justify-center"><Icon className="w-2.5 h-2.5" /></span>
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

export const WelcomeScreen: React.FC = () => {
  const { setCurrentScreen } = useOnboarding();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <div className="lg:col-span-6 space-y-7">
          <div className="animate-fade-up" style={delay(0)}>
            <span className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
              <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /></span>
              A career operating system for CS and IT students
            </span>
          </div>

          <h1 className="animate-fade-up text-[3.1rem] sm:text-7xl lg:text-[5.25rem] leading-[0.98] text-slate-900" style={delay(80)}>
            Build the<br />career<br /><span className="accent-italic">you want.</span>
          </h1>

          <p className="animate-fade-up text-base sm:text-lg text-slate-600 leading-relaxed max-w-md" style={delay(160)}>
            Your AI Career Twin learns where you are, understands where you want to go, and helps you take the next step.
          </p>

          <div className="animate-fade-up flex flex-col sm:flex-row gap-3" style={delay(240)}>
            <Button
              size="lg"
              onClick={() => setCurrentScreen('role-selection')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-soft"
            >
              Build my Career Twin
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentScreen('login')}
              className="w-full sm:w-auto"
            >
              I already have an account
            </Button>
          </div>

          <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center gap-3" style={delay(300)}>
            <button
              type="button"
              onClick={() => setCurrentScreen('role-selection')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/70 hover:bg-white text-xs font-medium text-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
            <span className="text-xs text-slate-500">Free for students. Privacy-first.</span>
          </div>
        </div>

        <div className="lg:col-span-6 px-12 sm:px-12 lg:px-6 animate-fade-up" style={delay(200)}>
          <TwinOrbit />
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <h2 className="lg:col-span-7 text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] text-slate-900">
            Not another course list. A twin that grows with you.
          </h2>
          <p className="lg:col-span-5 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
            Most platforms tell every student the same thing. Your Career Twin starts with what you tell it, then learns from what you actually do.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="animate-fade-up" style={delay(120 + i * 80)}>
              <StatCard label={s.n} value={s.title} sub={s.body} tone={s.tone} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
