import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Lock, Milestone, ArrowRight } from 'lucide-react';
import { useCareer } from '../../store/CareerStore';
import type { DashboardTab } from '../../engine/types';
import { FEATURE_JOURNEY, featureStep, nextLockedStep } from '../../engine/unlocks';
import { Card, CardHeader, Meter } from './ui';
import { Button } from '../common/Button';

// Where to go to make progress on each unlock requirement.
const WORK_ON: Partial<Record<DashboardTab, DashboardTab>> = {
  tasks: 'roadmap',
  coding: 'tasks',
  learning: 'tasks',
  projects: 'tasks',
  portfolio: 'projects',
  analytics: 'tasks',
  review: 'tasks',
};

export const JourneyCard: React.FC = () => {
  const { state, setActiveTab } = useCareer();
  const next = nextLockedStep(state);
  if (!next) return null;
  const unlocked = FEATURE_JOURNEY.filter(f => state.unlockedTabs.includes(f.tab)).length;
  const p = next.progress(state, new Date());
  const goTo = WORK_ON[next.tab];

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/60">
      <CardHeader
        icon={<Milestone className="w-4 h-4" />}
        title="Your CareerOS journey"
        subtitle={`${unlocked} of ${FEATURE_JOURNEY.length} features unlocked. New ones open as you make progress.`}
      />
      <ol className="flex flex-wrap gap-1.5 mb-4" aria-label="Feature unlock order">
        {FEATURE_JOURNEY.map(f => {
          const open = state.unlockedTabs.includes(f.tab);
          const isNext = f.tab === next.tab;
          return (
            <li
              key={f.tab}
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border',
                open ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isNext ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-400 border-slate-200'
              )}
            >
              {open ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {f.label}
            </li>
          );
        })}
      </ol>
      <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-700">
            <strong className="text-slate-900">Next: {next.label}.</strong> {next.requirement}.
          </p>
          <span className="text-[11px] font-bold text-indigo-700 tabular-nums shrink-0">{p.current}/{p.target}</span>
        </div>
        <Meter value={p.current} max={p.target} label={`Progress to unlock ${next.label}`} />
        {goTo && state.unlockedTabs.includes(goTo) && (
          <div className="pt-1">
            <Button size="sm" variant="outline" onClick={() => setActiveTab(goTo)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Go to {featureStep(goTo).label}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export const LockedFeature: React.FC<{ tab: DashboardTab }> = ({ tab }) => {
  const { state, setActiveTab } = useCareer();
  const step = featureStep(tab);
  const p = step.progress(state, new Date());
  const goTo = WORK_ON[tab];
  const next = nextLockedStep(state);

  return (
    <Card>
      <div className="max-w-md mx-auto py-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">{step.label} is locked</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{step.what}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">To unlock: {step.requirement}</span>
            <span className="font-bold text-indigo-700 tabular-nums">{p.current}/{p.target}</span>
          </div>
          <Meter value={p.current} max={p.target} label={`Progress to unlock ${step.label}`} />
        </div>
        {next && next.tab !== tab && (
          <p className="text-[11px] text-slate-500">Your next unlock is <strong>{next.label}</strong>: {next.requirement.toLowerCase()}.</p>
        )}
        {goTo && state.unlockedTabs.includes(goTo) && (
          <Button size="sm" onClick={() => setActiveTab(goTo)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Go to {featureStep(goTo).label}
          </Button>
        )}
      </div>
    </Card>
  );
};
