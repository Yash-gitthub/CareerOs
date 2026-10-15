import React, { useState } from 'react';
import { User, Mail, Phone, Camera } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { FormField } from '../common/FormField';
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
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5" />
            <span>Signed in as <strong className="text-slate-700">{user.email}</strong></span>
          </div>

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

          {/* Phone Number */}
          <FormField
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
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

        </div>

        <StepNavigation
          onBack={prevStep}
          onNext={nextStep}
          isSubmitting={isAuthenticating}
          nextLabel="Continue to Education"
        />
      </div>
    </div>
  );
};
