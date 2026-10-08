import { ThemeToggle } from './ThemeToggle';
import { PixelIcon } from './PixelIcon';
import type { PixelIconName } from './PixelIcon';
import { useAuth } from '../auth/AuthContext';
import type { Route } from '../app/router';
import './TopBar.css';

export interface TopBarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  streakDays?: number;
  level?: number;
  xp?: number;
  bugBits?: number;
  /** Optional sign-out handler (e.g. to save progress first); defaults to auth sign-out. */
  onSignOut?: () => void;
}

const NAV_ITEMS: { route: Route; label: string; ariaLabel: string; icon: PixelIconName }[] = [
  { route: '/play', label: 'Arena', ariaLabel: 'Arena', icon: 'search-bug' },
  { route: '/daily', label: 'Daily', ariaLabel: 'Daily Challenge', icon: 'calendar' },
  { route: '/pet', label: 'Pet', ariaLabel: 'Pet Den', icon: 'dog' },
  { route: '/profile', label: 'Profile', ariaLabel: 'Hunter Profile', icon: 'hunter' },
];

export function TopBar({
  currentRoute,
  onNavigate,
  streakDays = 0,
  level = 1,
  bugBits = 50,
  onSignOut,
}: TopBarProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="bha-topbar" role="banner">
      <div className="bha-topbar__inner">
        {/* Left: Brand */}
        <div className="bha-topbar__left">
          <button
            type="button"
            className="bha-topbar__logo"
            onClick={() => onNavigate('/')}
            aria-label="BugWug — Home"
          >
            <span className="bha-topbar__logo-icon" aria-hidden="true">
              <PixelIcon name="bug" size={21} />
            </span>
            <span className="bha-topbar__logo-title">BugWug</span>
          </button>
        </div>

        {/* Center: Stat Badges */}
        <div className="bha-topbar__stats" aria-label="Player stats summary">
          <div
            className="bha-stat-pill bha-stat-pill--streak"
            title={`${streakDays} Day Streak`}
            aria-label={`${streakDays} Day Streak`}
          >
            <PixelIcon name="flame" size={16} className="bha-stat-pill__icon" />
            <span className="bha-stat-pill__val">{streakDays}</span>
          </div>

          <div
            className="bha-stat-pill bha-stat-pill--level"
            title={`Level ${level}`}
            aria-label={`Level ${level}`}
          >
            <PixelIcon name="star" size={16} className="bha-stat-pill__icon" />
            <span className="bha-stat-pill__val">Lv.{level}</span>
          </div>

          <div
            className="bha-stat-pill bha-stat-pill--bits"
            title={`${bugBits} Bug Bits`}
            aria-label={`${bugBits} Bug Bits`}
          >
            <PixelIcon name="coin" size={16} className="bha-stat-pill__icon" />
            <span className="bha-stat-pill__val">{bugBits}</span>
          </div>
        </div>

        {/* Right: Navigation + Theme Toggle */}
        <div className="bha-topbar__right">
          <nav className="bha-topbar__nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  className={`bha-topbar__nav-link ${isActive ? 'bha-topbar__nav-link--active' : ''}`}
                  onClick={() => onNavigate(item.route)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.ariaLabel}
                  title={item.ariaLabel}
                >
                  <PixelIcon name={item.icon} className="bha-topbar__nav-icon" />
                  <span className="bha-topbar__nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <ThemeToggle />

          {user && (
            <button
              type="button"
              className="bha-topbar__signout"
              onClick={() => (onSignOut ? onSignOut() : signOut())}
              aria-label="Sign out"
              title={`Sign out (${user.email ?? ''})`}
            >
              <PixelIcon name="exit" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
