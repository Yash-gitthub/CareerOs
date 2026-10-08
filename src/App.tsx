import React from 'react';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { Navbar } from './components/common/Navbar';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { RoleSelection } from './components/auth/RoleSelection';
import { LoginModal } from './components/auth/LoginModal';
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
import { isPreview } from './lib/preview';

const MainRouter: React.FC = () => {
  const { currentScreen, authNotice, clearAuthNotice, loginAsDemoUser } = useOnboarding();

  // Dev preview links need a dashboard to show; fall back to the demo profile if there isn't one.
  React.useEffect(() => {
    if (isPreview() && currentScreen !== 'dashboard') loginAsDemoUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'role-selection':
        return <RoleSelection />;
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      {authNotice && (
        <div role="status" className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs">
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

      {/* Subtle Footer */}
      {currentScreen !== 'twin-generation' && (
        <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-500 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">AI CareerOS</span>
              <span>— Your AI Career Twin for Engineering & IT</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Production-ready Frontend Flow</span>
              <span>•</span>
              <span>No synthetic data</span>
            </div>
          </div>
        </footer>
      )}
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
