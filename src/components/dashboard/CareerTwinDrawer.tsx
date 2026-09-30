import React from 'react';
import { X, Compass, Sparkles, ExternalLink } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../common/Button';

interface CareerTwinDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAssessment: () => void;
}

export const CareerTwinDrawer: React.FC<CareerTwinDrawerProps> = ({
  isOpen,
  onClose,
  onStartAssessment
}) => {
  const { user } = useOnboarding();
  const { career } = user;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Career Twin Profile</h3>
                <p className="text-[11px] text-slate-500">Autonomous Model v1.0</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Status Card */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Twin Calibration Status</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Assessment Pending
                </span>
              </div>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Your Career Twin has established your baseline targeting <strong>{career.targetRole}</strong> at <strong>{career.dreamCompany}</strong>.
              </p>
            </div>

            {/* Twin Dimensions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Twin Model Dimensions
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">Target Role Readiness</span>
                    <p className="text-[11px] text-slate-400">Benchmarked against industry bars</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Pending
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">Coding Consistency Index</span>
                    <p className="text-[11px] text-slate-400">Daily practice habit tracking</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Calibrating
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">Core CS Concept Mastery</span>
                    <p className="text-[11px] text-slate-400">DSA, OS, DBMS, Networks</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Integrations placeholder */}
            <div className="space-y-2 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Connect GitHub Repository</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect GitHub to unlock automated code reviews, commit consistency tracking, and project complexity scoring.
              </p>
              <button
                type="button"
                onClick={() => alert('GitHub OAuth integration will be connected in the backend stage.')}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Connect GitHub Profile</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Assessment Callout */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4" />
                <span>Unlock Your Full Roadmap</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take the 5-minute diagnostic to reveal your customized skill roadmap and benchmarked gaps.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onStartAssessment();
                }}
                className="w-full bg-indigo-500 hover:bg-indigo-600"
              >
                Start Assessment Now
              </Button>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
            Last synchronized: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

        </div>
      </div>
    </div>
  );
};
