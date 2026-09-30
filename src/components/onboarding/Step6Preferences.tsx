import React from 'react';
import { Check } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';
import { SelectField } from '../common/SelectField';
import {
  LEARNING_METHODS,
  STUDY_TIME_OPTIONS,
  STUDY_SCHEDULE_OPTIONS,
  WORKING_STYLES,
  REMINDER_PREFERENCES
} from '../../data/rolesData';
import { clsx } from 'clsx';

export const Step6Preferences: React.FC = () => {
  const { user, updatePreferences, errors, clearError, nextStep, prevStep } = useOnboarding();
  const { learningPreferences } = user;

  const handleToggleMethod = (methodLabel: string) => {
    clearError('methods');
    const current = learningPreferences.methods;
    let updated: string[];

    if (current.includes(methodLabel)) {
      updated = current.filter((m) => m !== methodLabel);
    } else {
      updated = [...current, methodLabel];
    }

    updatePreferences({ methods: updated });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={6} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <StepHeader
          badge="Step 6 of 7"
          title="How do you learn best?"
          subtitle="We'll use this to personalize your learning experience."
        />

        <div className="space-y-6">
          {/* Preferred Learning Methods Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">
                Preferred Learning Methods (Select multiple)
              </label>
              <span className="text-xs text-slate-400 font-normal">
                {learningPreferences.methods.length} selected
              </span>
            </div>

            {errors.methods && (
              <p className="text-xs text-red-600 font-medium animate-fadeIn">
                {errors.methods}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEARNING_METHODS.map((item) => {
                const isSelected = learningPreferences.methods.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleMethod(item.label)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all select-none',
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Study Time Realistic framing */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              How much time can you <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-2">realistically</span> give each day?
            </label>
            <p className="text-xs text-slate-500">
              Honest consistency beats sporadic burnout. Your twin schedules tasks around your college load.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {STUDY_TIME_OPTIONS.map((timeOpt) => {
                const isSelected = learningPreferences.dailyStudyTime === timeOpt;
                return (
                  <button
                    key={timeOpt}
                    type="button"
                    onClick={() => {
                      updatePreferences({ dailyStudyTime: timeOpt });
                      clearError('dailyStudyTime');
                    }}
                    className={clsx(
                      'py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all',
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {timeOpt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Study Time Schedule */}
          <SelectField
            label="Preferred Study Schedule"
            options={STUDY_SCHEDULE_OPTIONS}
            value={learningPreferences.preferredStudyTime}
            onChange={(e) => updatePreferences({ preferredStudyTime: e.target.value })}
            helperText="We'll schedule reminders during your peak focus hours."
          />

          {/* Working Style */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Working Style & Attention Span
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {WORKING_STYLES.map((ws) => {
                const isSelected = learningPreferences.workingStyle === ws.label || learningPreferences.workingStyle === ws.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => updatePreferences({ workingStyle: ws.label })}
                    className={clsx(
                      'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span
                      className={clsx(
                        'text-xs font-bold mb-1',
                        isSelected ? 'text-indigo-950' : 'text-slate-900'
                      )}
                    >
                      {ws.label}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-snug">
                      {ws.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Preferences */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Accountability & Reminders
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REMINDER_PREFERENCES.map((rp) => {
                const isSelected = learningPreferences.reminderPreference === rp.label || learningPreferences.reminderPreference === rp.id;
                return (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => updatePreferences({ reminderPreference: rp.label })}
                    className={clsx(
                      'p-3 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={clsx(
                          'text-xs font-bold',
                          isSelected ? 'text-indigo-950' : 'text-slate-900'
                        )}
                      >
                        {rp.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-snug">
                      {rp.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Review & Create Twin"
        />
      </div>
    </div>
  );
};
