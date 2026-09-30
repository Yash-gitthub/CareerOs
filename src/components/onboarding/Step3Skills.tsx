import React, { useState } from 'react';
import { Search, Plus, Check, Sparkles, BarChart2 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';
import { SKILL_CATEGORIES } from '../../data/skillsData';
import type { SkillProficiency, SelectedSkill } from '../../types/user';
import { clsx } from 'clsx';

const PROFICIENCY_LEVELS: SkillProficiency[] = ['Beginner', 'Familiar', 'Intermediate', 'Advanced'];

export const Step3Skills: React.FC = () => {
  const { user, toggleSkill, setSkillLevel, hasSkill, getSkillLevel, errors, clearError, nextStep, prevStep } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Calculate total selected skills
  const allSelectedSkills: (SelectedSkill & { categoryKey: keyof typeof user.skills })[] = [];
  Object.entries(user.skills).forEach(([categoryKey, list]) => {
    list.forEach((s: SelectedSkill) => {
      allSelectedSkills.push({ ...s, categoryKey: categoryKey as keyof typeof user.skills });
    });
  });

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkillInput.trim()) {
      toggleSkill('programming', customSkillInput.trim(), 'Intermediate');
      setCustomSkillInput('');
      clearError('skills');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={3} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <StepHeader
          badge="Step 3 of 7"
          title="What can you already do?"
          subtitle="Don't worry about being an expert. We'll build from where you are today."
        />

        {/* Search Bar & Fast Add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search any skill (e.g., Python, React, Docker, DSA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <form onSubmit={handleAddCustomSkill} className="flex gap-2">
            <input
              type="text"
              placeholder="Add other skill..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={!customSkillInput.trim()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors',
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            All Categories ({SKILL_CATEGORIES.length})
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
                activeTab === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Selected Skills Summary Counter */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50/60 rounded-xl border border-indigo-100/60 text-xs">
          <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {allSelectedSkills.length} skills selected
          </span>
          <span className="text-slate-500">
            Click on any skill to select / deselect
          </span>
        </div>

        {errors.skills && (
          <p className="text-xs text-red-600 font-medium px-1 animate-fadeIn">
            {errors.skills}
          </p>
        )}

        {/* Skills Chips by Category */}
        <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
          {SKILL_CATEGORIES.filter(
            (cat) => activeTab === 'all' || activeTab === cat.id
          ).map((cat) => {
            const filteredSkills = cat.skills.filter((skill) =>
              skill.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredSkills.length === 0 && searchQuery) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span>{cat.name}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {user.skills[cat.categoryKey]?.length || 0} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filteredSkills.map((skill) => {
                    const isSelected = hasSkill(cat.categoryKey, skill);
                    const currentLevel = getSkillLevel(cat.categoryKey, skill);

                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          toggleSkill(cat.categoryKey, skill);
                          clearError('skills');
                        }}
                        className={clsx(
                          'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border select-none',
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{skill}</span>
                        {isSelected && currentLevel && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-200/70 text-indigo-800 rounded">
                            {currentLevel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Skills Experience Level Adjustment (Top Skills) */}
        {allSelectedSkills.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Fine-tune experience for your top skills</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                (Optional self-rating)
              </span>
            </div>

            <div className="divide-y divide-slate-200/70 max-h-48 overflow-y-auto pr-1">
              {allSelectedSkills.slice(0, 8).map((skillItem) => (
                <div
                  key={`${skillItem.categoryKey}-${skillItem.name}`}
                  className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {skillItem.name}
                  </span>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    {PROFICIENCY_LEVELS.map((lvl) => {
                      const isSelectedLevel = (skillItem.level || 'Intermediate') === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillLevel(skillItem.categoryKey, skillItem.name, lvl)}
                          className={clsx(
                            'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                            isSelectedLevel
                              ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          )}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          nextLabel="Continue to Career Direction"
        />
      </div>
    </div>
  );
};
