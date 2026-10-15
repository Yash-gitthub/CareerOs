import React from 'react';
import { Compass, LogIn, LogOut } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from './Button';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { currentScreen, setCurrentScreen, resetAll, user, isSyncing, dbStatus, syncToDatabase } = useOnboarding();

  const isAuthOrOnboarding = currentScreen !== 'dashboard';

  return (
    <header className="sticky top-0 z-40 bg-slate-50/85 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => isAuthOrOnboarding && setCurrentScreen('welcome')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-full border-[1.5px] border-slate-900 flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-[17px] sm:text-lg text-slate-900 tracking-tight">
              AI Career<span className="italic text-indigo-600">OS</span>
            </span>
            <p className="text-[10.5px] text-slate-500 hidden sm:block">
              Your AI Career Twin for engineering & IT
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentScreen === 'dashboard' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationCenter />
              <button
                type="button"
                onClick={() => syncToDatabase()}
                disabled={isSyncing}
                title="Sync profile with Supabase"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  dbStatus === 'synced'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : dbStatus === 'synced' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                <span>{isSyncing ? 'Syncing...' : dbStatus === 'synced' ? 'Cloud Synced' : 'Sync to Supabase'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 border border-slate-200 bg-white rounded-full text-xs text-slate-700">
                <span className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-display text-xs flex items-center justify-center" aria-hidden="true">
                  {(user.fullName || 'S').charAt(0).toUpperCase()}
                </span>
                <span>{user.fullName || 'Student'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-600">{user.career.targetRole || 'Engineering'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetAll()}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {user.accountType === 'cloud' ? (
                <>
                  <span className="hidden sm:inline text-xs text-slate-500">{user.email}</span>
                  <Button variant="outline" size="sm" onClick={() => resetAll()} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                    Sign out
                  </Button>
                </>
              ) : currentScreen !== 'login' && (
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
