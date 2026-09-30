import React from 'react';
import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const hasLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  const criteria = [
    { label: 'At least 8 characters', met: hasLength },
    { label: 'At least one number (0–9)', met: hasNumber },
    { label: 'At least one special character (!@#$...)', met: hasSpecial },
  ];

  const score = [hasLength, hasNumber, hasSpecial, hasUppercase].filter(Boolean).length;

  const getStrengthConfig = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600', width: '25%' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', width: '50%' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
  };

  const strength = getStrengthConfig();

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Password strength:</span>
          <span className={clsx('font-semibold', strength.text)}>{strength.label}</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={clsx('h-full transition-all duration-300', strength.color)}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      {/* Rules checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item, i) => (
          <div
            key={i}
            className={clsx(
              'flex items-center gap-1.5 text-xs transition-colors',
              item.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            )}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
