import React from 'react';

interface StepHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ title, subtitle, badge }) => {
  return (
    <div className="mb-8 text-center">
      {badge && (
        <span className="eyebrow block mb-3">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-[2.6rem] leading-[1.08] text-slate-900">
        {title}
      </h2>
      <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
};
