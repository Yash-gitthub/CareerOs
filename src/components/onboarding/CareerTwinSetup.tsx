import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useOnboarding } from '../../context/OnboardingContext';
import { useCareer } from '../../store/CareerStore';
import { Button } from '../common/Button';
import { clsx } from 'clsx';

const TWIN_BUILD_STEPS = [
  { id: 1, title: 'Understanding your background', desc: 'Analyzing academic year, degree & college timeline' },
  { id: 2, title: 'Mapping your current skills', desc: 'Structuring baseline proficiency across CS & tech stack' },
  { id: 3, title: 'Setting your career direction', desc: 'Calibrating hiring bars for your target role & company' },
  { id: 4, title: 'Preparing your first roadmap', desc: 'Setting up milestones and assessment placeholders' },
];

export const CareerTwinSetup: React.FC = () => {
  const { completeOnboarding, user } = useOnboarding();
  const { twin } = useCareer();
  const [currentBuildStep, setCurrentBuildStep] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // Real results from the Career Twin engine, shown as each step completes.
  const skillCount = Object.values(user.skills).reduce((n, l) => n + l.length, 0);
  const critical = twin.gaps.filter(g => g.bucket === 'critical').length;
  const results: Record<number, string> = {
    1: `${user.education.degree.split(' (')[0]} · ${user.education.year.split(' (')[0]} · graduating ${user.education.graduationYear}`,
    2: `${skillCount} skills mapped · ${twin.skills.length} tracked against your role`,
    3: `${twin.gaps.length} role requirements for ${twin.career.targetRole} · ${critical} critical gaps`,
    4: `Starting readiness ${Math.round(twin.readiness.score)}% · features unlock after your skill verification test`,
  };

  useEffect(() => {
    // Step progression animation (total ~3.5 seconds)
    const timer1 = setTimeout(() => setCurrentBuildStep(2), 800);
    const timer2 = setTimeout(() => setCurrentBuildStep(3), 1700);
    const timer3 = setTimeout(() => setCurrentBuildStep(4), 2600);
    const timer4 = setTimeout(() => {
      setIsReady(true);
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#4f46e5', '#6366f1', '#10b981', '#3b82f6']
        });
      } catch (e) {
        // ignore if canvas not supported
      }
    }, 3400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card text-center space-y-8">
        
        {/* Animated Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div
            className={clsx(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md',
              isReady ? 'bg-emerald-600 text-white rotate-0' : 'bg-indigo-600 text-white'
            )}
          >
            {isReady ? (
              <CheckCircle2 className="w-10 h-10 animate-in zoom-in-50" />
            ) : (
              <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
            )}
          </div>
          {!isReady && (
            <div className="absolute -inset-2 bg-indigo-500/20 rounded-3xl animate-ping -z-10" />
          )}
        </div>

        {/* Dynamic Title */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isReady ? 'Your Career Twin is ready.' : 'Building your Career Twin...'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {isReady
              ? 'Next, a short skill verification test checks the levels you entered. Your dashboard unlocks once it is done, then features open one at a time as you progress.'
              : 'Synthesizing your academic stage, skill baseline, and career ambitions into an adaptive model.'}
          </p>
        </div>

        {/* 4-Step Build Progress List */}
        <div className="space-y-3 text-left max-w-md mx-auto">
          {TWIN_BUILD_STEPS.map((step) => {
            const isDone = isReady || currentBuildStep > step.id;
            const isCurrent = !isReady && currentBuildStep === step.id;

            return (
              <div
                key={step.id}
                className={clsx(
                  'p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3.5',
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                    : isCurrent
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                )}
              >
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    step.id
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'text-xs font-bold',
                        isDone ? 'text-slate-900' : isCurrent ? 'text-indigo-900' : 'text-slate-500'
                      )}
                    >
                      {step.title}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-semibold text-emerald-700">Done</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-600 animate-pulse">Processing...</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isDone ? results[step.id] : step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Ready CTA */}
        {isReady && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="primary"
              size="lg"
              onClick={completeOnboarding}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto px-8 py-3 text-base shadow-md shadow-indigo-100"
            >
              Start Skill Verification Test
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
