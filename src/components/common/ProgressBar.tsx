import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

const STEP_LABELS = [
  'Profile',
  'Education',
  'Skills',
  'Career',
  'Goals',
  'Preferences',
  'Review'
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 7,
  onStepClick,
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      {/* Header with step number and percentage */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2.5">
        <span className="flex items-center gap-1.5 text-slate-700">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline font-medium text-slate-600">
            {STEP_LABELS[currentStep - 1] || 'Setup'}
          </span>
        </span>
        <span className="font-semibold text-indigo-600">{percentage}% completed</span>
      </div>

      {/* Modern Progress Line */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Desktop Step Badges */}
      <div className="hidden md:flex items-center justify-between mt-3 text-[11px] font-medium text-slate-400">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={label}
              type="button"
              disabled={!isDone && !isCurrent}
              onClick={() => isDone && onStepClick && onStepClick(stepNum)}
              className={clsx(
                'flex items-center gap-1 transition-colors group',
                isDone && 'text-slate-600 hover:text-indigo-600 cursor-pointer',
                isCurrent && 'text-indigo-700 font-bold',
                !isDone && !isCurrent && 'cursor-default text-slate-400'
              )}
            >
              <span
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[9px]',
                  isDone && 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors',
                  isCurrent && 'bg-indigo-600 text-white font-bold',
                  !isDone && !isCurrent && 'bg-slate-200 text-slate-500'
                )}
              >
                {isDone ? <Check className="w-2.5 h-2.5" /> : stepNum}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
