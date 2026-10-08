import { useEffect } from 'react';
import { useRouter } from './router';
import type { Route } from './router';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { AppStateProvider, useAppState } from './AppState';
import { calculateLevel } from '../engine/engine';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PixelIcon } from '../components/PixelIcon';
import { TopBar } from '../components/TopBar';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { AboutScreen } from '../screens/About/AboutScreen';
import { ArenaScreen } from '../screens/Arena/ArenaScreen';
import { PetDenScreen } from '../screens/PetDen/PetDenScreen';
import { DailyScreen } from '../screens/Daily/DailyScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';

/** Screen titles for document.title updates per spec Section 6.6 */
const SCREEN_TITLES: Record<Route, string> = {
  '/': 'BugWug — Hunt Bugs. Level Up.',
  '/play': 'Arena — BugWug',
  '/daily': 'Daily Hunt — BugWug',
  '/profile': 'Profile — BugWug',
  '/pet': 'Pet Den — BugWug',
  '/about': 'About — BugWug',
};

/** Loading spinner shown during auth check */
function AuthLoading() {
  return (
    <div className="app-shell app-loading" data-theme="dark">
      <div className="app-loading__inner">
        <span className="app-loading__mark" aria-hidden="true">
          <PixelIcon name="bug" size={42} />
        </span>
        <p className="app-loading__text px-label">Loading…</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { route, navigate } = useRouter();
  const { state, syncing, setExperience, flushCloudSave } = useAppState();
  const { signOut } = useAuth();

  // Persist the latest progress before the session ends
  const handleSignOut = async () => {
    try {
      await flushCloudSave();
    } finally {
      await signOut();
    }
  };

  const levelInfo = calculateLevel(state.xp);
  // First run: ask about debugging experience before anything else
  const needsOnboarding = !syncing && !state.experience;

  // Update document title on route change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = needsOnboarding
        ? 'Welcome — BugWug'
        : SCREEN_TITLES[route] || SCREEN_TITLES['/'];
    }
  }, [route, needsOnboarding]);

  return (
    <div className="app-shell" data-theme="dark">
      {/* Skip link for accessibility per spec Section 6.6 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <TopBar
        currentRoute={route}
        onNavigate={navigate}
        streakDays={state.streakDays}
        level={levelInfo.level}
        bugBits={state.bugBits}
        onSignOut={handleSignOut}
      />

      <main id="main-content">
        {syncing ? (
          <div className="app-syncing" role="status">
            <span className="px-label">Loading your progress…</span>
          </div>
        ) : needsOnboarding ? (
          <OnboardingScreen hunterName={state.playerName} onComplete={setExperience} />
        ) : (
          <>
            {route === '/' && <HomeScreen onNavigate={navigate} />}
            {route === '/play' && <ArenaScreen />}
            {route === '/daily' && <DailyScreen />}
            {route === '/profile' && <ProfileScreen />}
            {route === '/pet' && <PetDenScreen />}
            {route === '/about' && <AboutScreen />}
          </>
        )}
      </main>

      <footer role="contentinfo">
        <div className="app-footer__inner">
          <div className="app-footer__links">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="footer-link"
            >
              Home
            </button>
            <span className="app-footer__sep" aria-hidden="true" />
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="footer-link"
            >
              About & Shortcuts
            </button>
            <span className="app-footer__sep" aria-hidden="true" />
            <a
              href="https://github.com/ranawhocodes/BugHuntArena"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub Repo
            </a>
          </div>
          <p className="app-footer__credit">
            Icons:{' '}
            <a href="https://www.streamlinehq.com/icons/pixel" target="_blank" rel="noopener noreferrer">
              Pixel by Streamline
            </a>{' '}
            · CC BY 4.0
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Auth gate: shows AuthScreen if not logged in */
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <AuthScreen />;

  return (
    // Keyed by account: switching users mounts a fresh provider, so progress never crosses accounts
    <AppStateProvider key={user.id}>
      <AppContent />
    </AppStateProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
