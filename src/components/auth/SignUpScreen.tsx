import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useOnboarding, passwordProblem } from '../../context/OnboardingContext';
import { FormField } from '../common/FormField';
import { PasswordStrength } from '../common/PasswordStrength';
import { Button } from '../common/Button';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignUpScreen: React.FC = () => {
  const { createAccount, setCurrentScreen, isAuthenticating } = useOnboarding();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [confirmationSentTo, setConfirmationSentTo] = useState('');

  const clear = (field: string) => {
    setErrors(e => ({ ...e, [field]: '' }));
    setFormError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Please enter your full name.';
    if (!email.trim()) next.email = 'Please enter your email address.';
    else if (!EMAIL_RE.test(email.trim())) next.email = "That email doesn't look right. Check it and try again.";
    const pw = passwordProblem(password);
    if (pw) next.password = pw;
    if (!next.password && password !== confirm) next.confirm = "Passwords don't match. Please re-enter.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const res = await createAccount(fullName, email, password);
    if (!res.success) setFormError(res.error || 'Could not create your account. Please try again.');
    else if (res.needsConfirmation) setConfirmationSentTo(email.trim());
  };

  if (confirmationSentTo) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 max-w-md mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl text-slate-900">Check your <span className="accent-italic">inbox.</span></h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We sent a confirmation link to <strong>{confirmationSentTo}</strong>. Open it, then sign in to set up your Career Twin.
          </p>
          <Button className="w-full" onClick={() => setCurrentScreen('login')}>Go to sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 max-w-md mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <span className="eyebrow">Student account</span>
          <h2 className="text-3xl text-slate-900">Create your <span className="accent-italic">account.</span></h2>
          <p className="text-sm text-slate-500">Your profile, test results and roadmap are saved to it, so you can sign in from any device.</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            label="Full Name"
            placeholder="Your full name"
            autoComplete="name"
            value={fullName}
            error={errors.fullName}
            onChange={e => { setFullName(e.target.value); clear('fullName'); }}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <FormField
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={e => { setEmail(e.target.value); clear('email'); }}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <FormField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={e => { setPassword(e.target.value); clear('password'); }}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button type="button" onClick={() => setShowPassword(s => !s)} className="text-slate-400 hover:text-slate-600 p-1" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
          <PasswordStrength password={password} />
          <FormField
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirm}
            onChange={e => { setConfirm(e.target.value); clear('confirm'); }}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {formError}
              {/already exists/i.test(formError) && (
                <> <button type="button" onClick={() => setCurrentScreen('login')} className="font-semibold underline">Go to sign in</button></>
              )}
            </div>
          )}

          <Button type="submit" isLoading={isAuthenticating} className="w-full">Create account</Button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button type="button" onClick={() => setCurrentScreen('login')} className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</button>
          </p>
          <button type="button" onClick={() => setCurrentScreen('role-selection')} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" />Back
          </button>
        </div>
      </div>
    </div>
  );
};
