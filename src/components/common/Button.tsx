import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-medium transition-all duration-200 rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-[11px] tracking-wide',
    md: 'px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em]',
    lg: 'px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em]'
  };

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-ink border border-indigo-500 shadow-glow-sm hover:shadow-glow',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-indigo-300',
    outline: 'bg-transparent hover:bg-indigo-50 text-indigo-500 border border-indigo-300 hover:border-indigo-500 hover:shadow-glow-sm',
    ghost: 'bg-transparent hover:bg-indigo-50 text-slate-600 hover:text-indigo-500',
    danger: 'bg-red-600 hover:bg-red-700 text-ink border border-red-500 hover:shadow-[0_0_16px_rgba(255,46,87,0.45)]'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
};
