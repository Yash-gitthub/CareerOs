import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Calendar,
  Code2,
  Building,
  Target,
  Clock
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../common/Button';
import { AssessmentModal } from './AssessmentModal';
import { CareerTwinDrawer } from './CareerTwinDrawer';

export const StudentDashboard: React.FC = () => {
  const { user } = useOnboarding();
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isTwinDrawerOpen, setIsTwinDrawerOpen] = useState(false);

  const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Engineer';
  const targetRole = user.career.targetRole || 'Software Engineer';
  const dreamCompany = user.career.dreamCompany || 'Top Tech Companies';

  // Count skills
  const allSkills: { name: string; category: string }[] = [];
  Object.entries(user.skills).forEach(([cat, list]) => {
    list.forEach((s: { name: string }) => allSkills.push({ name: s.name, category: cat }));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Greeting & Readiness Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-50/60 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Compass className="w-3.5 h-3.5" />
              <span>AI Career Twin initialized</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Good morning, {firstName}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Your Career Twin is getting to know you. We're benchmarking your academic foundation against industry requirements for <strong>{targetRole}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                Target Role: <strong className="text-slate-800">{targetRole}</strong>
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                Company Bar: <strong className="text-slate-800">{dreamCompany}</strong>
              </span>
            </div>
          </div>

          {/* Readiness Status Box (Honest pending state, not fake score) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 lg:min-w-[280px] space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Placement Readiness</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Pending
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold text-slate-900">
                Initial assessment pending
              </div>
              <p className="text-xs text-slate-500">
                Complete a 5-min diagnostic to generate your initial readiness benchmark.
              </p>
            </div>

            <button
              onClick={() => setIsAssessmentOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
            >
              <span>Complete your Career Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Grid: Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Today's Plan */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Today's Plan</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Day 1</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-2 py-6">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                "Your personalized plan will appear after your assessment."
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Once calibrated, your Twin schedules {user.learningPreferences.dailyStudyTime}/day focused tasks matching your {user.learningPreferences.workingStyle.toLowerCase()}.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssessmentOpen(true)}
            className="w-full text-xs"
          >
            Unlock Daily Schedule
          </Button>
        </div>

        {/* Card 2: Skill Profile */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Skill Profile</h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {allSkills.length} Initial
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Baseline skills captured during onboarding:
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {allSkills.slice(0, 10).map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  {s.name}
                </span>
              ))}
              {allSkills.length > 10 && (
                <span className="px-2 py-1 text-[11px] text-slate-400 font-medium">
                  +{allSkills.length - 10} more
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTwinDrawerOpen(true)}
            className="w-full text-xs"
          >
            View Skill Gaps
          </Button>
        </div>

        {/* Card 3: Target Career & Goals */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Career Focus</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{user.career.timeline}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">Primary Milestone:</span>
                <span className="font-bold text-slate-900">{user.career.goal}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">Target Company:</span>
                <span className="font-bold text-indigo-700">{dreamCompany}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">Preferred Location:</span>
                <span className="font-bold text-slate-800">{user.career.preferredLocation || 'India'}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Adapts as your semester progresses
          </div>
        </div>

      </div>

      {/* Primary Action Card: Take Career Assessment */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Next Recommended Step</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Take your Career Assessment
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Answer 3 quick technical & algorithmic questions tailored for {targetRole}. Your Career Twin will generate your full syllabus roadmap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsTwinDrawerOpen(true)}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            Explore My Career Twin
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsAssessmentOpen(true)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-6 py-2.5 shadow-md"
          >
            Start Assessment
          </Button>
        </div>

      </div>

      {/* Modals and Drawers */}
      <AssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
      />

      <CareerTwinDrawer
        isOpen={isTwinDrawerOpen}
        onClose={() => setIsTwinDrawerOpen(false)}
        onStartAssessment={() => setIsAssessmentOpen(true)}
      />

    </div>
  );
};
