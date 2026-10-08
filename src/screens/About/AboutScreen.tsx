import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { PixelIcon } from '../../components/PixelIcon';
import './AboutScreen.css';

export function AboutScreen() {
  return (
    <div className="about-screen screen">
      <header className="about-header">
        <Badge variant="primary" size="md">Hackathon Build</Badge>
        <h1 className="about-title">About BugWug</h1>
        <p className="about-subtitle">
          An arena where AI creates the bugs and the learner hunts them down.
        </p>
      </header>

      <div className="about-content">
        {/* The 3 Core Pillars */}
        <section className="about-section" aria-labelledby="pillars-title">
          <h2 id="pillars-title">Three Core Pillars</h2>
          <div className="about-cards-grid">
            <Card variant="glass" padding="md">
              <div className="about-card__icon" aria-hidden="true">
                <PixelIcon name="scale" size={42} />
              </div>
              <h3>1. Fair & Fun</h3>
              <p>
                Every challenge has <strong>exactly one bug</strong> per program. We provide clear
                problem statements, side-by-side expected vs actual outputs, and named bug creatures
                with unique personalities.
              </p>
            </Card>

            <Card variant="glass" padding="md">
              <div className="about-card__icon" aria-hidden="true">
                <PixelIcon name="bulb" size={42} />
              </div>
              <h3>2. Hints That Teach</h3>
              <p>
                3 escalating tiers of pedagogical hints that guide thinking without giving away the
                answer:
                <br />
                • Tier 1: Where to look (mental model)
                <br />
                • Tier 2: Why it behaves unexpectedly
                <br />
                • Tier 3: Concrete debugging strategy
              </p>
            </Card>

            <Card variant="glass" padding="md">
              <div className="about-card__icon" aria-hidden="true">
                <PixelIcon name="flame" size={42} />
              </div>
              <h3>3. Coming Back Tomorrow</h3>
              <p>
                Daily Hunt with deterministic daily seed, streak shields, XP level progression,
                a living SVG pet companion that evolves with your debugging victories, and a Bug Dex
                to complete.
              </p>
            </Card>
          </div>
        </section>

        {/* Keyboard Controls */}
        <section className="about-section" aria-labelledby="controls-title">
          <h2 id="controls-title">Keyboard Navigation & Accessibility</h2>
          <Card variant="default" padding="md">
            <div className="shortcuts-grid">
              <div className="shortcut-row">
                <kbd>Tab</kbd> / <kbd>Shift + Tab</kbd>
                <span>Navigate between interactive elements & code lines</span>
              </div>
              <div className="shortcut-row">
                <kbd>Enter</kbd> / <kbd>Space</kbd>
                <span>Select active line or activate button</span>
              </div>
              <div className="shortcut-row">
                <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>
                <span>Quick-select fix options during the Fix phase</span>
              </div>
              <div className="shortcut-row">
                <kbd>Esc</kbd>
                <span>Dismiss modals or hints</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Technical Architecture */}
        <section className="about-section" aria-labelledby="tech-title">
          <h2 id="tech-title">Built with Antigravity</h2>
          <Card variant="default" padding="md">
            <p className="about-tech-summary">
              Engineered with <strong>Vite</strong>, <strong>React</strong>, and strict{' '}
              <strong>TypeScript</strong>. Powered by <strong>Google Gemini</strong> for dynamic
              AI-generated bugs, with offline fallbacks, zero client secrets, and 100% pure engine logic.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
