import { useMemo, useState } from 'react';
import { useAppState } from '../../app/AppState';
import { useAuth } from '../../auth/AuthContext';
import { ALL_PUZZLES } from '../../content/puzzles';
import { calculateLevel } from '../../engine/engine';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { PixelIcon } from '../../components/PixelIcon';
import type { PixelIconName } from '../../components/PixelIcon';
import { EXPERIENCE_OPTIONS } from '../Onboarding/OnboardingScreen';
import type { BugCategory } from '../../content/types';
import './ProfileScreen.css';

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: PixelIconName;
  unlocked: boolean;
}

export function ProfileScreen() {
  const { state, setExperience, flushCloudSave } = useAppState();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // Save the latest progress before the session ends, then sign out
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await flushCloudSave();
    } finally {
      await signOut();
    }
  };
  const { xp, bugBits, streakDays, capturedCreatureIds, completedPuzzleIds } = state;

  const hunterName = state.playerName || (user?.user_metadata?.name as string | undefined)?.trim() || 'Hunter';
  const levelInfo = calculateLevel(xp);

  // Per-category results, weakest clean-catch rate first so practice targets are obvious
  const skillRows = useMemo(
    () =>
      (Object.entries(state.categoryStats) as [BugCategory, { attempts: number; cleanCatches: number }][])
        .filter(([, stats]) => stats.attempts > 0)
        .map(([category, stats]) => ({
          category,
          label: category.replace(/_/g, ' '),
          attempts: stats.attempts,
          cleanRate: Math.round((stats.cleanCatches / stats.attempts) * 100),
        }))
        .sort((a, b) => a.cleanRate - b.cleanRate),
    [state.categoryStats],
  );

  // Collect all 24 distinct bug creatures from the puzzle bank
  const allCreatures = useMemo(() => {
    const seen = new Set<string>();
    return ALL_PUZZLES.map((p) => p.creature).filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, []);

  // Compute 10 Achievement Badges
  const badges: AchievementBadge[] = useMemo(() => {
    const solvedPython = completedPuzzleIds.some((id) => id.startsWith('py-'));
    const solvedJs = completedPuzzleIds.some((id) => id.startsWith('js-'));

    return [
      {
        id: 'badge-welcome',
        name: 'First Step',
        description: 'Joined BugWug',
        icon: 'sprout',
        unlocked: true,
      },
      {
        id: 'badge-first-hunt',
        name: 'First Blood',
        description: 'Squashed your first bug',
        icon: 'bug',
        unlocked: completedPuzzleIds.length >= 1,
      },
      {
        id: 'badge-clean-catch',
        name: 'Sniper',
        description: 'Solved a bug with 0 hints and 0 wrong lines',
        icon: 'target',
        unlocked: Object.values(state.categoryStats).some((s) => (s?.cleanCatches ?? 0) > 0),
      },
      {
        id: 'badge-streak-3',
        name: 'Spark',
        description: 'Achieved a 3-day active hunt streak',
        icon: 'flame',
        unlocked: streakDays >= 3,
      },
      {
        id: 'badge-streak-7',
        name: 'Inferno',
        description: 'Achieved a 7-day active hunt streak',
        icon: 'flash',
        unlocked: streakDays >= 7,
      },
      {
        id: 'badge-polyglot',
        name: 'Polyglot',
        description: 'Squashed bugs in both Python and JavaScript',
        icon: 'globe',
        unlocked: solvedPython && solvedJs,
      },
      {
        id: 'badge-pet-lover',
        name: 'Best Friend',
        description: 'Groomed and fed your companion pet',
        icon: 'heart',
        unlocked: state.pet.strokesToday > 0 || state.pet.happiness > 80,
      },
      {
        id: 'badge-dex-5',
        name: 'Collector',
        description: 'Trapped 5 unique bug creatures in Bug Dex',
        icon: 'box',
        unlocked: capturedCreatureIds.length >= 5,
      },
      {
        id: 'badge-dex-12',
        name: 'Master Hunter',
        description: 'Trapped 12 unique bug creatures in Bug Dex',
        icon: 'ribbon',
        unlocked: capturedCreatureIds.length >= 12,
      },
      {
        id: 'badge-level-5',
        name: 'Arena Legend',
        description: 'Attained Hunter Rank Level 5',
        icon: 'king-crown',
        unlocked: levelInfo.level >= 5,
      },
    ];
  }, [completedPuzzleIds, streakDays, state.categoryStats, state.pet, capturedCreatureIds, levelInfo.level]);

  return (
    <div className="bha-profile screen">
      {/* Hunter Overview Card */}
      <Card variant="glass" padding="lg" className="bha-hunter-card">
        <div className="bha-hunter-card__avatar" aria-hidden="true">
          <PixelIcon name="hunter" size={63} />
        </div>
        <div className="bha-hunter-card__info">
          <div className="bha-hunter-card__title-row">
            <div className="bha-hunter-card__header-text">
              <h1 className="bha-hunter-card__title">{hunterName}</h1>
              <div className="bha-hunter-card__meta-line">
                <span className="bha-hunter-card__rank-subtitle">{levelInfo.title}</span>
                {user?.email && (
                  <>
                    <span className="bha-hunter-card__meta-sep">•</span>
                    <span className="bha-hunter-card__email">{user.email}</span>
                  </>
                )}
              </div>
            </div>
            <div className="bha-hunter-card__actions">
              <Badge variant="primary" size="md">
                Level {levelInfo.level}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                isLoading={signingOut}
                className="bha-profile-signout-btn"
                icon={<PixelIcon name="exit" />}
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="bha-track">
            <span className="bha-track__label" id="track-label">
              Debugging track
            </span>
            <div className="bha-track__options" role="radiogroup" aria-labelledby="track-label">
              {EXPERIENCE_OPTIONS.map((option) => {
                const selected = (state.experience ?? 'new') === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`bha-track__option ${selected ? 'bha-track__option--selected' : ''}`}
                    onClick={() => setExperience(option.value)}
                  >
                    <PixelIcon name={option.icon} size={16} />
                    {option.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bha-hunter-card__stats-grid">
            <div className="bha-hunter-stat">
              <span className="bha-hunter-stat__label">Total XP</span>
              <span className="bha-hunter-stat__val">{xp}</span>
            </div>
            <div className="bha-hunter-stat">
              <span className="bha-hunter-stat__label">Bug Bits</span>
              <span className="bha-hunter-stat__val">
                <PixelIcon name="coin" size={16} className="bha-hunter-stat__icon bha-hunter-stat__icon--bits" />
                {bugBits}
              </span>
            </div>
            <div className="bha-hunter-stat">
              <span className="bha-hunter-stat__label">Daily Streak</span>
              <span className="bha-hunter-stat__val">
                <PixelIcon name="flame" size={16} className="bha-hunter-stat__icon bha-hunter-stat__icon--streak" />
                {streakDays} Days
              </span>
            </div>
            <div className="bha-hunter-stat">
              <span className="bha-hunter-stat__label">Creatures Trapped</span>
              <span className="bha-hunter-stat__val">
                <PixelIcon name="bug" size={16} className="bha-hunter-stat__icon" />
                {capturedCreatureIds.length}/{allCreatures.length}
              </span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bha-level-progress">
            <div className="bha-level-progress__header">
              <span>Next Rank: Level {levelInfo.level + 1}</span>
              <span>{levelInfo.progressPercent}%</span>
            </div>
            <div className="bha-level-progress__bar">
              <div
                className="bha-level-progress__fill"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Skill Breakdown — which bug types the hunter has mastered */}
      <section className="bha-profile-section" aria-labelledby="skills-title">
        <div className="bha-profile-section__header">
          <h2 id="skills-title">Skill Breakdown</h2>
          <span className="bha-profile-section__count">{skillRows.length} Bug Types</span>
        </div>
        {skillRows.length === 0 ? (
          <p className="bha-skills__empty">
            Solve your first bug in the Arena to see which bug types you have mastered.
          </p>
        ) : (
          <ul className="bha-skills">
            {skillRows.map((row) => (
              <li key={row.category} className="bha-skills__row">
                <span className="bha-skills__name">{row.label}</span>
                <span className="bha-skills__meta">
                  {row.attempts} solved · {row.cleanRate}% clean
                </span>
                <div
                  className="bha-skills__bar"
                  role="meter"
                  aria-label={`${row.label} clean catch rate`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={row.cleanRate}
                >
                  <div className="bha-skills__fill" style={{ width: `${row.cleanRate}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Badges Section */}
      <section className="bha-profile-section" aria-labelledby="badges-title">
        <div className="bha-profile-section__header">
          <h2 id="badges-title">Hunter Badges</h2>
          <span className="bha-profile-section__count">
            {badges.filter((b) => b.unlocked).length}/{badges.length} Unlocked
          </span>
        </div>
        <div className="bha-badges-grid">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              variant={badge.unlocked ? 'glass' : 'default'}
              padding="sm"
              className={`bha-badge-card ${badge.unlocked ? 'bha-badge-card--unlocked' : 'bha-badge-card--locked'}`}
            >
              <div className="bha-badge-card__icon" aria-hidden="true">
                <PixelIcon name={badge.icon} />
              </div>
              <div className="bha-badge-card__meta">
                <span className="bha-badge-card__name">{badge.name}</span>
                <span className="bha-badge-card__desc">{badge.description}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Bug Dex Section */}
      <section className="bha-profile-section" aria-labelledby="dex-title">
        <div className="bha-profile-section__header">
          <h2 id="dex-title">The Bug Dex</h2>
          <span className="bha-profile-section__count">
            {capturedCreatureIds.length}/{allCreatures.length} Captured
          </span>
        </div>
        <div className="bha-dex-grid">
          {allCreatures.map((creature) => {
            const isCaptured = capturedCreatureIds.includes(creature.id);

            return (
              <Card
                key={creature.id}
                variant={isCaptured ? 'glass' : 'default'}
                padding="sm"
                className={`bha-dex-card ${isCaptured ? 'bha-dex-card--captured' : 'bha-dex-card--locked'}`}
              >
                <div className="bha-dex-card__avatar" aria-hidden="true">
                  {isCaptured ? creature.avatarEmoji : <PixelIcon name="lock" />}
                </div>
                <div className="bha-dex-card__info">
                  <div className="bha-dex-card__header">
                    <span className="bha-dex-card__name">
                      {isCaptured ? creature.name : '??? (Undiscovered)'}
                    </span>
                    {isCaptured && (
                      <Badge variant="accent" size="sm">
                        {creature.rarity}
                      </Badge>
                    )}
                  </div>
                  <span className="bha-dex-card__lore">
                    {isCaptured ? creature.description : 'Squash this creature in the Arena to unlock.'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
