import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Compass, GitBranch, Target, LineChart } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../common/Button';

export const WelcomeScreen: React.FC = () => {
  const { setCurrentScreen } = useOnboarding();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Value Proposition & Actions */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 -ml-3.5" />
            <span>AI Career Twin for Engineering & IT Students</span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Build the career you want.{' '}
              <span className="text-indigo-600">
                We'll help you get there.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Your AI-powered career companion that understands your skills, goals, progress, and learning journey.
            </p>
          </div>

          {/* Key Value Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left max-w-xl mx-auto lg:mx-0">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Personalized Twin</h4>
                <p className="text-[11px] text-slate-500">Adapts to your speed & target roles</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Zero Guesswork</h4>
                <p className="text-[11px] text-slate-500">Milestones based on real placement data</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Engineering Focus</h4>
                <p className="text-[11px] text-slate-500">DSA, Core CS, Web, AI/ML, Cloud</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentScreen('role-selection')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto text-base px-8 py-3.5 shadow-md shadow-indigo-100"
              >
                Get Started
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentScreen('login')}
                className="w-full sm:w-auto text-base px-6 py-3.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
              >
                I already have an account
              </Button>
            </div>

            {/* Social Auth Option */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => setCurrentScreen('role-selection')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <span className="text-xs text-slate-400">
                • No credit card required
              </span>
            </div>
          </div>

          {/* Student Trust Quote */}
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center lg:justify-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Built strictly for Computer Engineering & IT readiness. Privacy-first.</span>
          </div>

        </div>

        {/* Right Column: Abstract Evolving Career Twin Visualization */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            
            {/* Ambient background blur */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-3xl blur-xl opacity-70"></div>

            {/* Main Interactive Twin Card Container */}
            <div className="relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Your AI Career Twin</h3>
                    <p className="text-[11px] text-slate-500">Autonomous Roadmap Engine</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Node
                </span>
              </div>

              {/* Abstract Career Pathway Nodes */}
              <div className="py-5 space-y-4">
                
                {/* Node 1: Current State */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs">
                    01
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Your Current Baseline</span>
                      <span className="text-[10px] font-medium text-slate-500">Profile & Skills</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Degree, core CS foundation, coding strengths</p>
                  </div>
                </div>

                {/* Connecting Arrow */}
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <GitBranch className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Node 2: Twin Intelligence */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                    02
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-950">AI Twin Gap Analysis</span>
                      <span className="text-[10px] font-semibold text-indigo-700">Dynamic</span>
                    </div>
                    <p className="text-[11px] text-indigo-700/80 truncate">Maps target role requirements vs current capability</p>
                  </div>
                </div>

                {/* Connecting Arrow */}
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Node 3: Target Role */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs">
                    03
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Placement & Industry Ready</span>
                      <span className="text-[10px] font-medium text-emerald-600">Target Goal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Software Engineer • AI/ML • Cloud • Tier-1 Companies</p>
                  </div>
                </div>

              </div>

              {/* Bottom Twin Metadata Box */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <LineChart className="w-3.5 h-3.5 text-indigo-600" />
                  Continuous evolution
                </span>
                <span className="text-slate-400">Zero synthetic fluff</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
