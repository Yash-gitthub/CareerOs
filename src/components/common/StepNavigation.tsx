import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from './Button';

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  isSubmitting?: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
  isLastStep?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  isSubmitting = false,
  canSkip = false,
  onSkip,
  isLastStep = false,
}) => {
  return (
    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
      <div>
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto text-slate-600 hover:text-slate-900"
          >
            {backLabel}
          </Button>
        ) : (
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Progress automatically saved</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {canSkip && onSkip && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Skip for now
          </Button>
        )}

        <Button
          type="button"
          onClick={onNext}
          isLoading={isSubmitting}
          variant="primary"
          className="w-full sm:w-auto px-6 py-2.5 text-sm"
          rightIcon={
            isLastStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          }
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
};
