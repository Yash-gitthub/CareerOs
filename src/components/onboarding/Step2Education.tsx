import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';
import { SelectField } from '../common/SelectField';
import { SearchableSelect } from '../common/SearchableSelect';
import { FormField } from '../common/FormField';
import {
  DEGREE_OPTIONS,
  BRANCH_OPTIONS,
  ACADEMIC_YEARS,
  GRADUATION_YEARS,
  BACKLOG_OPTIONS,
  POPULAR_COLLEGES
} from '../../data/colleges';

export const Step2Education: React.FC = () => {
  const { user, updateEducation, errors, clearError, nextStep, prevStep } = useOnboarding();
  const { education } = user;

  // Derive semesters based on selected year
  const getAvailableSemesters = (yearStr: string) => {
    if (yearStr.includes('First')) return ['Semester 1', 'Semester 2'];
    if (yearStr.includes('Second')) return ['Semester 3', 'Semester 4'];
    if (yearStr.includes('Third')) return ['Semester 5', 'Semester 6'];
    if (yearStr.includes('Fourth')) return ['Semester 7', 'Semester 8'];
    return ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Graduated'];
  };

  const currentSemesters = getAvailableSemesters(education.year);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={2} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card">
        <StepHeader
          badge="Step 2 of 7"
          title="Tell us about your education"
          subtitle="Your academic stage helps us create the right career roadmap."
        />

        <div className="space-y-5">
          {/* Degree & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Degree Program"
              options={DEGREE_OPTIONS}
              value={education.degree}
              error={errors.degree}
              onChange={(e) => {
                updateEducation({ degree: e.target.value });
                clearError('degree');
              }}
              required
            />

            <SelectField
              label="Branch / Specialization"
              options={BRANCH_OPTIONS}
              value={education.branch}
              error={errors.branch}
              onChange={(e) => {
                updateEducation({ branch: e.target.value });
                clearError('branch');
              }}
              required
            />
          </div>

          {/* Current Year & Dynamic Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Current Academic Year"
              options={ACADEMIC_YEARS}
              value={education.year}
              error={errors.year}
              onChange={(e) => {
                const newYear = e.target.value;
                const newSems = getAvailableSemesters(newYear);
                updateEducation({
                  year: newYear,
                  semester: newSems[0] || 'Semester 1'
                });
                clearError('year');
              }}
              required
            />

            <SelectField
              label="Current Semester"
              options={currentSemesters}
              value={education.semester}
              onChange={(e) => updateEducation({ semester: e.target.value })}
              helperText="Auto-adapted to your academic year"
              required
            />
          </div>

          {/* College / University Searchable */}
          <SearchableSelect
            label="College / University"
            options={POPULAR_COLLEGES}
            value={education.college}
            error={errors.college}
            onChange={(val) => {
              updateEducation({ college: val });
              clearError('college');
            }}
            placeholder="Search your college or type full name..."
            required
            helperText="Used to benchmark peer placement patterns."
          />

          {/* Expected Graduation Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Expected Graduation Year"
              options={GRADUATION_YEARS}
              value={education.graduationYear}
              error={errors.graduationYear}
              onChange={(e) => {
                updateEducation({ graduationYear: e.target.value });
                clearError('graduationYear');
              }}
              required
            />

            {/* Current CGPA (Optional) */}
            <FormField
              label="Current CGPA / Percentage"
              type="text"
              placeholder="e.g. 8.75 or 85%"
              value={education.cgpa || ''}
              onChange={(e) => updateEducation({ cgpa: e.target.value })}
              optional
              helperText="Optional. Leave blank if you prefer."
            />
          </div>

          {/* Academic Backlogs (Optional) */}
          <SelectField
            label="Active Academic Backlogs"
            options={BACKLOG_OPTIONS}
            value={education.backlogs || 'None (All clear)'}
            onChange={(e) => updateEducation({ backlogs: e.target.value })}
            optional
            helperText="Helps identify eligibility criteria for company hiring drives."
          />
        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Continue to Skills"
        />
      </div>
    </div>
  );
};
