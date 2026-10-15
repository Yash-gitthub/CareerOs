import React from 'react';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { RoleSelection } from './components/auth/RoleSelection';
import { LoginModal } from './components/auth/LoginModal';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { MentorPlacementRegister } from './components/auth/MentorPlacementRegister';
import { Step1Profile } from './components/onboarding/Step1Profile';
import { Step2Education } from './components/onboarding/Step2Education';
import { Step3Skills } from './components/onboarding/Step3Skills';
import { Step4CareerDirection } from './components/onboarding/Step4CareerDirection';
import { Step5DreamCompany } from './components/onboarding/Step5DreamCompany';
import { Step6Preferences } from './components/onboarding/Step6Preferences';
import { Step7Review } from './components/onboarding/Step7Review';
import { CareerTwinSetup } from './components/onboarding/CareerTwinSetup';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { CareerProvider } from './store/CareerStore';
import { isSupabaseConfigured } from './lib/supabase';

// CareerOS needs a Supabase project for accounts and data; there is no offline/demo mode.
const SupabaseNotConfigured: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-card text-center space-y-3">
      <h1 className="text-3xl text-slate-900">Supabase is <span className="accent-italic">not configured.</span></h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file
        in the project folder (see <code>.env.example</code>), then restart the dev server.
      </p>
    </div>
  </div>
);

const MainRouter: React.FC = () => {
  const { currentScreen, authNotice, clearAuthNotice } = useOnboarding();

  if (!isSupabaseConfigured) return <SupabaseNotConfigured />;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'role-selection':
        return <RoleSelection />;
      case 'signup':
        return <SignUpScreen />;
      case 'login':
        return <LoginModal />;
      case 'mentor-registration':
        return <MentorPlacementRegister />;
      case 'step-1-profile':
        return <Step1Profile />;
      case 'step-2-education':
        return <Step2Education />;
      case 'step-3-skills':
        return <Step3Skills />;
      case 'step-4-career':
        return <Step4CareerDirection />;
      case 'step-5-goals':
        return <Step5DreamCompany />;
      case 'step-6-preferences':
        return <Step6Preferences />;
      case 'step-7-review':
        return <Step7Review />;
      case 'twin-generation':
        return <CareerTwinSetup />;
      case 'dashboard':
        return <StudentDashboard />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Navbar />
      {authNotice && (
        <div role="status" className="bg-amber-50 border-b border-amber-300/60 text-amber-900 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
            <span>{authNotice}</span>
            <button
              type="button"
              onClick={clearAuthNotice}
              className="shrink-0 font-semibold text-amber-800 hover:text-amber-950 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main className="flex-1">
        {renderScreen()}
      </main>

      {currentScreen !== 'twin-generation' && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <OnboardingProvider>
      <CareerProvider>
        <MainRouter />
      </CareerProvider>
    </OnboardingProvider>
  );
};

export default App;
