import React from 'react';

interface StepHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ title, subtitle, badge }) => {
  return (
    <div className="mb-6 text-center sm:text-left">
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2">
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
        {subtitle}
      </p>
    </div>
  );
};
