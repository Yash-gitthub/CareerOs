import React, { useState } from 'react';
import { User, Mail, Lock, Phone, Camera, Eye, EyeOff } from 'lucide-react';
import { useOnboarding, needsPassword } from '../../context/OnboardingContext';
import { FormField } from '../common/FormField';
import { PasswordStrength } from '../common/PasswordStrength';
import { StepHeader } from '../common/StepHeader';
import { StepNavigation } from '../common/StepNavigation';
import { ProgressBar } from '../common/ProgressBar';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

export const Step1Profile: React.FC = () => {
  const { user, updateUser, errors, clearError, nextStep, prevStep, isAuthenticating } = useOnboarding();
  const showPasswordFields = needsPassword(user);
  const accountCreated = user.accountType === 'cloud';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomAvatar(result);
        updateUser({ profilePhoto: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <ProgressBar currentStep={1} />

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card">
        <StepHeader
          badge="Step 1 of 7"
          title="Let's get to know you"
          subtitle="This information helps us personalize your Career Twin."
        />

        <div className="space-y-6">
          {/* Profile Photo Selector */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-xs">
                {user.profilePhoto || customAvatar ? (
                  <img
                    src={user.profilePhoto || customAvatar!}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : user.fullName ? (
                  user.fullName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-8 h-8 text-indigo-400" />
                )}
              </div>
              
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-xs transition-colors"
                title="Upload custom photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-semibold text-slate-800">Profile Photo</span>
                <span className="text-[11px] text-slate-400 font-normal">Optional</span>
              </div>
              <p className="text-xs text-slate-500">
                Choose an avatar or upload your photo for your student ID card.
              </p>
              
              {/* Preset avatar picks */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                {AVATAR_PRESETS.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCustomAvatar(imgUrl);
                      updateUser({ profilePhoto: imgUrl });
                    }}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                      user.profilePhoto === imgUrl ? 'border-indigo-600 scale-110 shadow-xs' : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img src={imgUrl} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <FormField
            label="Full Name"
            placeholder="e.g. Alex Chen"
            value={user.fullName}
            error={errors.fullName}
            onChange={(e) => {
              updateUser({ fullName: e.target.value });
              clearError('fullName');
            }}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          {/* Email Address */}
          <FormField
            label="Email Address"
            type="email"
            placeholder="e.g. alex.chen@engineering.edu"
            value={user.email}
            error={errors.email}
            onChange={(e) => {
              updateUser({ email: e.target.value });
              clearError('email');
            }}
            readOnly={accountCreated}
            helperText={
              accountCreated
                ? 'Your account is created with this email.'
                : showPasswordFields
                ? "We'll send a confirmation link, career roadmaps and verification updates here."
                : 'Cloud accounts are not configured — your profile is stored in this browser only.'
            }
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Password & Confirm Password (only when creating a real account) */}
          {showPasswordFields && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={user.password || ''}
              error={errors.password}
              onChange={(e) => {
                updateUser({ password: e.target.value });
                clearError('password');
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <FormField
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={user.confirmPassword || ''}
              error={errors.confirmPassword}
              onChange={(e) => {
                updateUser({ confirmPassword: e.target.value });
                clearError('confirmPassword');
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
          </div>

          {/* Password Live Strength Checker */}
          <PasswordStrength password={user.password || ''} />
          </>
          )}

          {/* Phone Number */}
          <FormField
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={user.phone}
            error={errors.phone}
            onChange={(e) => {
              updateUser({ phone: e.target.value });
              clearError('phone');
            }}
            helperText="Used for interview alerts and placement drive notifications."
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />

          {/* Automatically determined system fields preview */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span>Account ID: <strong className="text-slate-600">{user.id}</strong></span>
            <span>Source: <strong className="text-slate-600">{user.registrationSource}</strong></span>
            <span>Created: <strong className="text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          isSubmitting={isAuthenticating}
          nextLabel={showPasswordFields ? 'Create Account & Continue' : 'Continue to Education'}
        />
      </div>
    </div>
  );
};
