import React from 'react';
import { Target, Info } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';
import { SearchableSelect } from '../common/SearchableSelect';
import { SelectField } from '../common/SelectField';
import { FormField } from '../common/FormField';
import { POPULAR_COMPANIES } from '../../data/companies';
import { CAREER_GOALS, TARGET_TIMELINES, WORK_LOCATIONS } from '../../data/rolesData';
import { clsx } from 'clsx';

export const Step5DreamCompany: React.FC = () => {
  const { user, updateCareer, errors, clearError, nextStep, prevStep } = useOnboarding();
  const { career } = user;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={5} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <StepHeader
          badge="Step 5 of 7"
          title="What are you aiming for?"
          subtitle="You can change this anytime. Your Career Twin will adapt with you."
        />

        <div className="space-y-5">
          {/* Dream Company Searchable */}
          <div className="space-y-1.5">
            <SearchableSelect
              label="Dream Company / Target Organization"
              options={POPULAR_COMPANIES}
              value={career.dreamCompany}
              onChange={(val) => {
                updateCareer({ dreamCompany: val });
                clearError('dreamCompany');
              }}
              placeholder="e.g. NVIDIA, Google, Microsoft, Startups..."
              helperText="Targeting specific hiring bars helps calibrate your coding & system design difficulty."
            />
            
            {/* Friendly disclaimer */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Setting a target company calibrates difficulty benchmarks. It does not imply guaranteed placement.
              </span>
            </div>
          </div>

          {/* Target Role Confirmation */}
          <FormField
            label="Target Specific Role"
            value={career.targetRole}
            onChange={(e) => updateCareer({ targetRole: e.target.value })}
            placeholder="e.g. AI / ML Engineer"
            helperText="Derived from your career direction. You can customize this title."
            leftIcon={<Target className="w-4 h-4" />}
          />

          {/* Career Goal Card Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Primary Career Milestone / Goal
            </label>

            {errors.goal && (
              <p className="text-xs text-red-600 font-medium animate-fadeIn">
                {errors.goal}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CAREER_GOALS.map((g) => {
                const isSelected = career.goal === g.title;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      updateCareer({ goal: g.title });
                      clearError('goal');
                    }}
                    className={clsx(
                      'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span
                        className={clsx(
                          'text-xs font-bold',
                          isSelected ? 'text-indigo-950' : 'text-slate-900'
                        )}
                      >
                        {g.title}
                      </span>
                      <div
                        className={clsx(
                          'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                          isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-snug">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Timeline & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Target Timeline"
              options={TARGET_TIMELINES}
              value={career.timeline}
              error={errors.timeline}
              onChange={(e) => {
                updateCareer({ timeline: e.target.value });
                clearError('timeline');
              }}
              required
            />

            <SelectField
              label="Preferred Work Location"
              options={WORK_LOCATIONS}
              value={career.preferredLocation || 'India'}
              onChange={(e) => updateCareer({ preferredLocation: e.target.value })}
              optional
            />
          </div>
        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Continue to Preferences"
        />
      </div>
    </div>
  );
};
