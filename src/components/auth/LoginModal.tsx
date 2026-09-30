import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, LogIn, UserCheck } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { FormField } from '../common/FormField';
import { Button } from '../common/Button';

export const LoginModal: React.FC = () => {
  const { setCurrentScreen, loginAsDemoUser } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      loginAsDemoUser();
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <LogIn className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500">
            Sign in to access your Career Twin & learning roadmap
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <FormField
            label="Email Address"
            type="email"
            placeholder="e.g. alex.chen@engineering.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>Remember me</span>
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full py-2.5 mt-2"
          >
            Sign In to CareerOS
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-400">Testing the experience?</p>
          <button
            type="button"
            onClick={loginAsDemoUser}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Instant Demo Sign-in (Pre-filled Profile)</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setCurrentScreen('welcome')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to main page</span>
          </button>
        </div>

      </div>
    </div>
  );
};
