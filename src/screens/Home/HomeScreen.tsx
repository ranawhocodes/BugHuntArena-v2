import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { PixelIcon } from '../../components/PixelIcon';
import type { Route } from '../../app/router';
import './HomeScreen.css';

interface HomeScreenProps {
  onNavigate: (route: Route, query?: Record<string, string>) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="home-screen screen">
      {/* Hero Section */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__copy">
          <div className="home-hero__badge">
            <Badge variant="primary" size="md">
              Interactive Bug-Hunting Gym · Python &amp; JavaScript
            </Badge>
          </div>
          <h1 id="hero-title" className="home-hero__title">
            Hunt the bugs.
            <br />
            Master the code.
            <span className="home-hero__caret" aria-hidden="true" />
          </h1>
          <p className="home-hero__subtitle">
            Step into the battleground where AI crafts tricky Python and JavaScript bugs.
            Find the broken line, choose the right fix, earn XP, and evolve your companion pet.
          </p>

          <div className="home-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('/play')}
              icon={<PixelIcon name="search-bug" />}
            >
              Enter The Arena
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('/daily')}
              icon={<PixelIcon name="calendar" />}
            >
              Today's Daily Hunt
            </Button>
          </div>
        </div>

        {/* Decorative specimen frame: the product's subject under a target lock */}
        <div className="home-hero__art" aria-hidden="true">
          <div className="home-hero__lock px-corners">
            <PixelIcon name="bug" size={168} className="home-hero__bug" />
          </div>
        </div>
      </section>

      {/* Language Quick Picks */}
      <section className="home-modes" aria-label="Available Languages">
        <Card
          variant="interactive"
          padding="md"
          className="mode-card mode-card--python"
          onClick={() => onNavigate('/play', { lang: 'python' })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('/play', { lang: 'python' });
            }
          }}
          aria-label="Practice Python bugs"
        >
          <div className="mode-card__icon" aria-hidden="true">Py</div>
          <div className="mode-card__info">
            <div className="mode-card__header">
              <h2 className="mode-card__title">Python Arena</h2>
              <Badge variant="python" size="sm">12 Puzzles</Badge>
            </div>
            <p className="mode-card__desc">
              IndexErrors, TypeErrors, indentation traps, and off-by-one slice bugs.
            </p>
          </div>
          <div className="mode-card__arrow" aria-hidden="true">
            <PixelIcon name="arrow-right" />
          </div>
        </Card>

        <Card
          variant="interactive"
          padding="md"
          className="mode-card mode-card--js"
          onClick={() => onNavigate('/play', { lang: 'javascript' })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('/play', { lang: 'javascript' });
            }
          }}
          aria-label="Practice JavaScript bugs"
        >
          <div className="mode-card__icon" aria-hidden="true">JS</div>
          <div className="mode-card__info">
            <div className="mode-card__header">
              <h2 className="mode-card__title">JavaScript Arena</h2>
              <Badge variant="js" size="sm">12 Puzzles</Badge>
            </div>
            <p className="mode-card__desc">
              Loose equality, scope shadows, undefined mutations, and array traps.
            </p>
          </div>
          <div className="mode-card__arrow" aria-hidden="true">
            <PixelIcon name="arrow-right" />
          </div>
        </Card>
      </section>

      {/* 3-Step How It Works */}
      <section className="home-how" aria-labelledby="how-title">
        <h2 id="how-title" className="home-section-title">
          <span className="px-marker" aria-hidden="true" />
          How Bug Hunting Works
        </h2>
        <div className="how-grid">
          <Card variant="glass" padding="md" className="how-step">
            <div className="how-step__indicator">
              <span className="how-step__pill">Phase 1</span>
              <PixelIcon name="target" size={42} className="how-step__icon" />
            </div>
            <h3 className="how-step__title">Locate The Broken Line</h3>
            <p className="how-step__desc">
              Compare the expected output with actual error logs. Inspect code with keyboard or touch to click the guilty line.
            </p>
          </Card>

          <Card variant="glass" padding="md" className="how-step">
            <div className="how-step__indicator">
              <span className="how-step__pill">Phase 2</span>
              <PixelIcon name="hammer" size={42} className="how-step__icon" />
            </div>
            <h3 className="how-step__title">Deploy The Fix</h3>
            <p className="how-step__desc">
              Choose the correct fix from 4 options. Watch out for realistic distractors designed to test your deep understanding!
            </p>
          </Card>

          <Card variant="glass" padding="md" className="how-step">
            <div className="how-step__indicator">
              <span className="how-step__pill">Phase 3</span>
              <PixelIcon name="podium" size={42} className="how-step__icon" />
            </div>
            <h3 className="how-step__title">Capture &amp; Level Up</h3>
            <p className="how-step__desc">
              Trap the bug creature in your Bug Dex, earn XP and Bug Bits, level up your rank, and feed your growing companion pet!
            </p>
          </Card>
        </div>
      </section>

      {/* Gamification Highlights */}
      <section className="home-features" aria-label="Key Features">
        <div className="features-grid">
          <Card variant="default" padding="md" className="feature-item">
            <div className="feature-item__icon" aria-hidden="true">
              <PixelIcon name="dog" />
            </div>
            <h3 className="feature-item__title">Living Pet Companion</h3>
            <p className="feature-item__desc">
              Your pet reacts to your debugging performance, offers escalating hints when you're stuck, and evolves across 4 stages.
            </p>
          </Card>

          <Card variant="default" padding="md" className="feature-item">
            <div className="feature-item__icon" aria-hidden="true">
              <PixelIcon name="flame" />
            </div>
            <h3 className="feature-item__title">Daily Challenges</h3>
            <p className="feature-item__desc">
              A fresh trio of puzzles every midnight with streak shields and Wordle-style shareable scorecards.
            </p>
          </Card>

          <Card variant="default" padding="md" className="feature-item">
            <div className="feature-item__icon" aria-hidden="true">
              <PixelIcon name="robot" />
            </div>
            <h3 className="feature-item__title">AI Generation</h3>
            <p className="feature-item__desc">
              Powered by Google Gemini for unlimited dynamic puzzles, with offline fallbacks so you can always keep playing.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
