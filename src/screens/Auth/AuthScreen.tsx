import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PixelIcon } from '../../components/PixelIcon';
import './AuthScreen.css';

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 40;

export function AuthScreen() {
  const { signIn, signUp, continueAsGuest, isLocalMode } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your hunter name.');
        return;
      }
      if (name.trim().length > MAX_NAME_LENGTH) {
        setError(`Hunter name must be ${MAX_NAME_LENGTH} characters or fewer.`);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: err, session: newSession } = await signUp(email.trim(), password, name.trim());
        if (err) {
          setError(err);
        } else if (!newSession) {
          setSuccess('Account created! Please check your email to confirm, then sign in.');
          setMode('signin');
          setName('');
          setPassword('');
          setConfirmPassword('');
        }
        // If newSession is present, onAuthStateChange immediately authenticates the user
      } else {
        const { error: err } = await signIn(email.trim(), password);
        if (err) {
          setError(err);
        }
        // On success, AuthContext will update and App will redirect
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card px-corners">
        {/* Logo / Brand */}
        <div className="auth-brand">
          <span className="auth-brand__icon" aria-hidden="true">
            <PixelIcon name="bug" size={42} />
          </span>
          <h1 className="auth-brand__title">BugWug</h1>
          <p className="auth-brand__subtitle">
            {mode === 'signin' ? 'Welcome back, hunter.' : 'Join the hunt.'}
          </p>
        </div>

        {/* Mode toggle pills */}
        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button
            role="tab"
            type="button"
            aria-selected={mode === 'signin'}
            className={`auth-toggle__tab ${mode === 'signin' ? 'auth-toggle__tab--active' : ''}`}
            onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
          >
            Sign In
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={mode === 'signup'}
            className={`auth-toggle__tab ${mode === 'signup' ? 'auth-toggle__tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
          >
            Sign Up
          </button>
        </div>

        {/* Demo Credentials */}
        {mode === 'signin' && (
          <div className="auth-demo-box">
            <div className="auth-demo-box__header">
              <span>⚡ Demo Access</span>
              <button
                type="button"
                className="auth-demo-box__btn"
                onClick={() => {
                  setEmail('demo@bughuntarena.com');
                  setPassword('demohunter123');
                  setError(null);
                }}
              >
                Auto-fill
              </button>
            </div>
            <div className="auth-demo-box__creds">
              <div><strong>Email:</strong> demo@bughuntarena.com</div>
              <div><strong>Password:</strong> demohunter123</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name" className="auth-field__label">Hunter Name</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                className="auth-field__input"
                placeholder="e.g. Code Ranger"
                maxLength={MAX_NAME_LENGTH}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-field__label">Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              className="auth-field__input"
              placeholder="hunter@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-field__label">Password</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="auth-field__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm" className="auth-field__label">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                className="auth-field__input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {error && (
            <div className="auth-message auth-message--error" role="alert">
              <PixelIcon name="alert" size={16} className="auth-message__icon" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-message auth-message--success" role="status">
              <PixelIcon name="check" size={16} className="auth-message__icon" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        {/* Guest access option */}
        <div className="auth-divider">
          <span className="auth-divider__text">OR</span>
        </div>

        <button
          type="button"
          className="auth-guest-btn"
          onClick={() => continueAsGuest?.()}
        >
          <PixelIcon name="flash" size={16} />
          <span>Play as Guest (Instant Access)</span>
        </button>

        {isLocalMode && (
          <p className="auth-local-notice">
            Offline mode active: hunter progress is saved locally in your browser.
          </p>
        )}

        {/* Footer toggle */}
        <p className="auth-footer">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" className="auth-footer__link" onClick={toggleMode}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
