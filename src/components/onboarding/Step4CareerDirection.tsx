import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';
import { CAREER_ROLES } from '../../data/rolesData';
import { clsx } from 'clsx';

export const Step4CareerDirection: React.FC = () => {
  const { user, updateCareer, errors, clearError, nextStep, prevStep } = useOnboarding();
  const { interestedRoles } = user.career;

  const handleToggleRole = (roleTitle: string) => {
    clearError('interestedRoles');
    if (roleTitle.includes('exploring') || roleTitle.includes('Not sure')) {
      // If user chooses exploring, clear specific roles and set exploring
      updateCareer({
        interestedRoles: [roleTitle],
        targetRole: 'General Engineering Explorer'
      });
      return;
    }

    // If currently on exploring, remove exploring and add chosen role
    const currentRoles = interestedRoles.filter(
      (r) => !r.includes('exploring') && !r.includes('Not sure')
    );

    const exists = currentRoles.includes(roleTitle);
    let updated: string[];

    if (exists) {
      updated = currentRoles.filter((r) => r !== roleTitle);
    } else {
      updated = [...currentRoles, roleTitle];
    }

    updateCareer({
      interestedRoles: updated,
      targetRole: updated[0] || 'Software Engineer'
    });
  };

  const isExploringSelected = interestedRoles.some(
    (r) => r.includes('exploring') || r.includes('Not sure')
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={4} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <StepHeader
          badge="Step 4 of 7"
          title="Where do you want to go?"
          subtitle="Your goals help your Career Twin understand what you're working toward."
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              What career paths interest you? (Select all that apply)
            </h3>
            <span className="text-xs text-slate-500">
              {interestedRoles.length} selected
            </span>
          </div>

          {errors.interestedRoles && (
            <p className="text-xs text-red-600 font-medium animate-fadeIn">
              {errors.interestedRoles}
            </p>
          )}

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {CAREER_ROLES.map((role) => {
              const isSelected = interestedRoles.includes(role.title);
              const isExploring = role.id === 'exploring';

              return (
                <div
                  key={role.id}
                  onClick={() => handleToggleRole(role.title)}
                  className={clsx(
                    'p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none',
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : isExploring
                      ? 'border-dashed border-slate-300 bg-slate-50/60 hover:border-slate-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4
                        className={clsx(
                          'text-xs sm:text-sm font-bold truncate',
                          isSelected ? 'text-indigo-950' : 'text-slate-900'
                        )}
                      >
                        {role.title}
                      </h4>
                      {isExploring && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                          Flexible
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {role.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic primary role selector if multiple selected */}
          {!isExploringSelected && interestedRoles.length > 1 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Which one is your primary dream focus?
              </label>
              <div className="flex flex-wrap gap-2">
                {interestedRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateCareer({ targetRole: r })}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      user.career.targetRole === r
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isExploringSelected && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>No problem!</strong> AI CareerOS will evaluate your early assignments and projects to recommend career pathways that best match your natural strengths.
              </span>
            </div>
          )}
        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Continue to Goals"
        />
      </div>
    </div>
  );
};
