import React from 'react';
import { Compass, LogIn, LogOut, RefreshCw, UserCheck } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from './Button';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { currentScreen, setCurrentScreen, resetAll, loginAsDemoUser, user, isSyncing, dbStatus, syncToDatabase } = useOnboarding();

  const isAuthOrOnboarding = currentScreen !== 'dashboard';
  const isCloudAccount = user.accountType === 'cloud';

  return (
    <header className="sticky top-0 z-40 bg-ink/85 backdrop-blur-md border-b border-indigo-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => isAuthOrOnboarding && setCurrentScreen('welcome')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-sm border border-indigo-500/70 bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-glow-sm group-hover:shadow-glow transition-shadow">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-slate-950 tracking-tight">
                Career<span className="text-indigo-500">OS</span>
              </span>
              <span className="hidden sm:inline-block font-mono text-[9px] uppercase tracking-[0.14em] text-indigo-500 px-1.5 py-0.5 rounded-sm border border-indigo-300">
                Twin_MVP
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 hidden sm:block tracking-wide">
              // AI career twin · engineering & IT
            </p>
          </div>
        </div>

        {/* Current location readout (display only) */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-slate-500 tracking-wide">
          <span className="status-dot" />
          <span className="text-indigo-500">SYS://</span>
          <span className="text-slate-600">{currentScreen.replace(/-/g, '_')}</span>
          <span className="w-1.5 h-3.5 bg-indigo-500/80 animate-blink" aria-hidden="true" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentScreen === 'dashboard' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationCenter />
              {isCloudAccount ? (
              <button
                type="button"
                onClick={() => syncToDatabase()}
                disabled={isSyncing}
                title="Sync profile with Supabase"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[11px] font-medium border transition-colors ${
                  dbStatus === 'synced'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : dbStatus === 'synced' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                <span>{isSyncing ? 'Syncing...' : dbStatus === 'synced' ? 'Cloud Synced' : 'Sync to Supabase'}</span>
              </button>
              ) : (
                <span
                  title="This profile is stored only in this browser"
                  className="hidden md:inline-block px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wide border bg-amber-50 border-amber-300/70 text-amber-600"
                >
                  {user.accountType === 'demo' ? 'Demo sandbox · not synced' : 'Local only · not synced'}
                </span>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-slate-200 bg-slate-50 rounded-sm font-mono text-[11px] text-slate-700">
                <span className="status-dot"></span>
                <span>{user.fullName || 'Student'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-600">{user.career.targetRole || 'Engineering'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetAll()}
                leftIcon={isCloudAccount ? <LogOut className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
              >
                {isCloudAccount ? 'Sign out' : 'Restart Demo'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser()}
                title="Quick demo with filled sample profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-medium text-slate-600 hover:text-indigo-500 border border-slate-200 hover:border-indigo-300 bg-transparent hover:bg-indigo-50 rounded-sm transition-colors"
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
