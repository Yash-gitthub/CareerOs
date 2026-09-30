import React, { useState } from 'react';
import { GraduationCap, Users, Building2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import type { UserRole } from '../../types/user';
import { Button } from '../common/Button';
import { clsx } from 'clsx';

interface RoleCard {
  id: UserRole;
  title: string;
  badge?: string;
  description: string;
  forText: string;
  features: string[];
  icon: React.ElementType;
}

const ROLES: RoleCard[] = [
  {
    id: 'student',
    title: 'Student',
    badge: 'Recommended',
    description: 'Build your AI Career Twin to benchmark skills, track consistency, and prepare for internships & placements.',
    forText: 'For Computer Engineering, IT, CS & related tech branches',
    features: ['Personalized Skill Roadmap', 'Career Twin Gap Analysis', 'Placement Assessment'],
    icon: GraduationCap,
  },
  {
    id: 'mentor',
    title: 'Mentor / Faculty',
    description: 'Monitor student cohort progress, guide project roadmaps, and review curriculum mastery.',
    forText: 'For professors, technical mentors & career advisors',
    features: ['Cohort Skill Tracking', 'Curriculum Benchmarking', 'Student Advisory Dashboard'],
    icon: Users,
  },
  {
    id: 'placement_officer',
    title: 'Placement Officer',
    description: 'Track aggregate batch readiness, company eligibility metrics, and placement drive pipelines.',
    forText: 'For college training & placement cell officers (TPO)',
    features: ['Eligibility Filtering', 'Batch Readiness Index', 'Company Drive Analytics'],
    icon: Building2,
  },
];

export const RoleSelection: React.FC = () => {
  const { user, updateUser, setCurrentScreen } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role || 'student');

  const handleContinue = () => {
    updateUser({ role: selectedRole });
    if (selectedRole === 'student') {
      setCurrentScreen('step-1-profile');
    } else {
      setCurrentScreen('mentor-registration');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
          Account Setup
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How will you use AI CareerOS?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Choose your primary workspace role. We tailor your onboarding and tools specifically for your goals.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={clsx(
                'relative rounded-2xl p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between bg-white text-left group',
                isSelected
                  ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600/20'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-subtle'
              )}
            >
              {/* Badge if present */}
              {role.badge && (
                <div className="absolute -top-3 right-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider shadow-xs">
                    {role.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Icon & Title */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {role.title}
                </h3>
                
                <p className="text-xs font-medium text-indigo-700 mb-3 bg-indigo-50/70 px-2 py-1 rounded-md inline-block">
                  {role.forText}
                </p>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {role.description}
                </p>
              </div>

              {/* Feature bullet list */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {role.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <CheckCircle2
                      className={clsx(
                        'w-3.5 h-3.5 shrink-0',
                        isSelected ? 'text-indigo-600' : 'text-slate-400'
                      )}
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={() => setCurrentScreen('welcome')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-full sm:w-auto text-slate-600"
        >
          Back to Welcome
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full sm:w-auto px-8"
        >
          Continue as {ROLES.find(r => r.id === selectedRole)?.title}
        </Button>
      </div>

    </div>
  );
};
