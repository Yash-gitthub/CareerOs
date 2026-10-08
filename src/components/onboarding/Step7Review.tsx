import React from 'react';
import { GraduationCap, Code2, Compass, Building, Clock, Edit3 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { GitHubCard, LeetCodeCard } from '../dashboard/integrations/IntegrationCards';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';

export const Step7Review: React.FC = () => {
  const { user, goToStep, nextStep, prevStep } = useOnboarding();
  const { education, skills, career, learningPreferences } = user;

  // Flatten skills for display
  const allSkillsList: string[] = [];
  Object.values(skills).forEach((list) => {
    list.forEach((s: { name: string }) => allSkillsList.push(s.name));
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={7} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-8">
        <StepHeader
          badge="Step 7 of 7"
          title="Your Career Twin is ready to take shape"
          subtitle="Here is a summary of the baseline you've set. You can edit any section before initializing your roadmap."
        />

        {/* Profile Card Preview */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100 p-6 space-y-6 shadow-2xs">
          
          {/* Top banner info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-indigo-100/80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs overflow-hidden">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {user.fullName || 'Student Explorer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {user.email || 'student@engineering.edu'} • {user.phone || 'No phone'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToStep(1)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Edit Profile
            </Button>
          </div>

          {/* Structured Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Education Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 relative group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Education</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {education.degree} in {education.branch}
              </p>
              <p className="text-xs text-slate-600">
                {education.year} • {education.semester} (Class of {education.graduationYear})
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {education.college || 'College / University'}
                {education.cgpa ? ` • CGPA: ${education.cgpa}` : ''}
              </p>
            </div>

            {/* Career Direction Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 relative group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Target Direction</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="text-xs font-semibold text-indigo-900">
                {career.targetRole || 'Software Engineer'}
              </p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {career.interestedRoles.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] font-medium text-slate-700 rounded-md">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Dream Company & Goal */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 relative group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Goal & Target Bar</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Targeting: <span className="text-indigo-600">{career.dreamCompany || 'Top Tech Companies'}</span>
              </p>
              <p className="text-xs text-slate-600">
                Milestone: <strong>{career.goal}</strong> within <strong>{career.timeline}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Location: {career.preferredLocation || 'India'}
              </p>
            </div>

            {/* Learning Style & Schedule */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 relative group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Pacing & Habits</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(6)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Available: <span className="text-indigo-600">{learningPreferences.dailyStudyTime}</span> / day
              </p>
              <p className="text-xs text-slate-600">
                Schedule: {learningPreferences.preferredStudyTime}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Style: {learningPreferences.workingStyle}
              </p>
            </div>

          </div>

          {/* Selected Skills Strip */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>Selected Skills Baseline ({allSkillsList.length})</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit Skills
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {allSkillsList.length > 0 ? (
                allSkillsList.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium rounded-lg"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills selected yet</span>
              )}
            </div>
          </div>

        </div>

        {/* Coding profiles (optional) — feed the Career Twin from day one */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Connect your coding profiles <span className="text-xs font-normal text-slate-500">(optional)</span></h4>
            <p className="text-xs text-slate-500">Public GitHub and LeetCode data calibrates your Career Twin. You can also do this later from the dashboard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GitHubCard />
            <LeetCodeCard />
          </div>
        </div>

        {/* Confirmation Question */}
        <div className="text-center pt-2 space-y-2">
          <h4 className="text-base font-bold text-slate-900">
            Is everything correct?
          </h4>
          <p className="text-xs text-slate-500">
            You can always modify these in your profile settings later.
          </p>
        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Looks good — Initialize Career Twin"
          isLastStep
        />
      </div>
    </div>
  );
};
