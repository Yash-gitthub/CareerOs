import React from 'react';
import { Compass, LogIn, RefreshCw, UserCheck } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { currentScreen, setCurrentScreen, resetAll, loginAsDemoUser, user } = useOnboarding();

  const isAuthOrOnboarding = currentScreen !== 'dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => isAuthOrOnboarding && setCurrentScreen('welcome')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                AI CareerOS
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                Twin MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Your AI Career Twin for Engineering & IT
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentScreen === 'dashboard' ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user.fullName || 'Student'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-600">{user.career.targetRole || 'Engineering'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Restart Demo
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loginAsDemoUser}
                title="Quick demo with filled sample profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Demo Student Profile</span>
                <span className="sm:hidden">Demo</span>
              </button>

              {currentScreen !== 'login' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentScreen('login')}
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
