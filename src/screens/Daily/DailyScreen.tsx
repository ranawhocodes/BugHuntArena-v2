import { useState, useMemo } from 'react';
import { useAppState } from '../../app/AppState';
import { ALL_PUZZLES } from '../../content/puzzles';
import {
  getDailyPuzzles,
  calculateXP,
  calculateBugBits,
  calculateLevel,
  dailyPoolForTrack,
} from '../../engine/engine';
import { CodeViewer } from '../../components/CodeViewer';
import { OutputPanel } from '../../components/OutputPanel';
import { FixOptions } from '../../components/FixOptions';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { PixelIcon } from '../../components/PixelIcon';
import './DailyScreen.css';

export function DailyScreen() {
  const { state, recordPuzzleCompletion, recordDailyClear } = useAppState();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  // Same three picks for everyone on a track today, matched to their experience
  const dailyPuzzles = useMemo(
    () => getDailyPuzzles(todayStr, dailyPoolForTrack(ALL_PUZZLES, state.experience)),
    [todayStr, state.experience],
  );

  // Cleared steps live in saved progress, so a refresh or device switch keeps them
  const clearedIds =
    state.dailyProgress?.date === todayStr ? state.dailyProgress.clearedPuzzleIds : [];
  const completedSteps = dailyPuzzles.map((p) => clearedIds.includes(p.id));

  const [activeStep, setActiveStep] = useState<number>(() => {
    const firstOpen = completedSteps.findIndex((done) => !done);
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [feedback, setFeedback] = useState<string>('');

  // Current puzzle state
  const [phase, setPhase] = useState<'FIND_LINE' | 'FIX_BUG' | 'DONE'>('FIND_LINE');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shields, setShields] = useState<number>(3);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const currentPuzzle = dailyPuzzles[activeStep];
  const allCleared = completedSteps.every(Boolean);

  const handleConfirmLine = () => {
    if (selectedLine === null) return;
    if (selectedLine === currentPuzzle.bugLineNumber) {
      setPhase('FIX_BUG');
      setFeedback(`Correct — the bug is on line ${selectedLine}. Now choose the fix.`);
    } else {
      setShields((prev) => Math.max(0, prev - 1));
      setFeedback(`Line ${selectedLine} is innocent. Shield lost — try another line.`);
    }
  };

  const handleConfirmFix = () => {
    if (!selectedOptionId) return;

    if (selectedOptionId === currentPuzzle.correctOptionId) {
      const isClean = shields === 3;
      const xpRes = calculateXP(currentPuzzle.difficulty, state.streakDays, 0, isClean);
      const bits = calculateBugBits(xpRes.totalXp, isClean);

      recordPuzzleCompletion(
        currentPuzzle.id,
        currentPuzzle.creature.id,
        currentPuzzle.category,
        xpRes.totalXp,
        bits,
        isClean,
      );

      recordDailyClear(todayStr, currentPuzzle.id);
      setFeedback(`${currentPuzzle.creature.name} captured!`);

      // Advance to the next step that is still open
      const nextOpen = completedSteps.findIndex((done, idx) => !done && idx !== activeStep);
      if (nextOpen !== -1) {
        setActiveStep(nextOpen);
        setPhase('FIND_LINE');
        setSelectedLine(null);
        setSelectedOptionId(null);
        setShields(3);
      } else {
        setPhase('DONE');
      }
    } else {
      setShields((prev) => Math.max(0, prev - 1));
      setFeedback('That fix does not resolve the bug. Shield lost — try another option.');
    }
  };

  const handleShare = () => {
    const levelInfo = calculateLevel(state.xp);
    const squares = completedSteps.map((c) => (c ? '🟩' : '⬜')).join(' ');
    const text = `🐛 BugWug — Daily #${todayStr}\n${squares} (${completedSteps.filter(Boolean).length}/3 Cleared)\n🔥 Streak: ${state.streakDays} Days | ${levelInfo.title}\n${window.location.origin}`;

    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      })
      .catch(() => setFeedback('Copy failed — your browser blocked clipboard access.'));
  };

  return (
    <div className="bha-daily screen">
      <header className="bha-daily__header">
        <Badge variant="primary" size="md">Deterministic Daily Challenge</Badge>
        <h1 className="bha-daily__title">Daily Hunt: {todayStr}</h1>
        <p className="bha-daily__subtitle">
          Three fresh curated bugs every 24 hours. Clear all 3 to extend your streak flame!
        </p>
      </header>

      {/* Progress Cards */}
      <div className="bha-daily__steps-grid">
        {dailyPuzzles.map((puzzle, idx) => {
          const isDone = completedSteps[idx];
          const isActive = idx === activeStep && !allCleared;

          return (
            <Card
              key={puzzle.id}
              variant={isActive ? 'highlight' : 'glass'}
              padding="sm"
              className={`bha-daily-step-card ${isDone ? 'bha-daily-step-card--done' : ''}`}
              onClick={() => {
                setActiveStep(idx);
                setPhase(completedSteps[idx] ? 'DONE' : 'FIND_LINE');
                setSelectedLine(null);
                setSelectedOptionId(null);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Challenge ${idx + 1}: ${puzzle.title}${isDone ? ' (cleared)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveStep(idx);
                  setPhase(completedSteps[idx] ? 'DONE' : 'FIND_LINE');
                }
              }}
            >
              <div className="bha-daily-step-card__num">
                {isDone ? <PixelIcon name="check-badge" label="Cleared" /> : `0${idx + 1}`}
              </div>
              <div className="bha-daily-step-card__info">
                <span className="bha-daily-step-card__title">{puzzle.title}</span>
                <span className="bha-daily-step-card__lang">
                  {puzzle.language} • {puzzle.difficulty === 1 ? 'Easy' : puzzle.difficulty === 2 ? 'Med' : 'Hard'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* When All Cleared: Victory Share Card */}
      {allCleared ? (
        <Card variant="glass" padding="lg" className="bha-daily__completed-card">
          <div className="bha-daily__completed-icon" aria-hidden="true">
            <PixelIcon name="gift" size={42} />
          </div>
          <h2>Today's Daily Hunt Completed!</h2>
          <p className="bha-daily__completed-desc">
            You successfully tracked down all 3 bugs and preserved your {state.streakDays}-day streak!
          </p>
          <div className="bha-daily__share-box">
            <div className="bha-daily__score-preview">
              <p>🟩 🟩 🟩 (3/3 Cleared)</p>
              <p>🔥 Streak: {state.streakDays} Days</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleShare}
              icon={<PixelIcon name="link" />}
            >
              {shareCopied ? 'Copied to Clipboard!' : 'Share Scorecard'}
            </Button>
          </div>
        </Card>
      ) : (
        /* Active Puzzle Workspace */
        <div className="bha-daily__active-puzzle">
          <div className="bha-daily__puzzle-header">
            <h3>
              Challenge #{activeStep + 1}: {currentPuzzle.title}
            </h3>
            <div className="bha-daily__shields" aria-label={`${shields} shields remaining`}>
              {[1, 2, 3].map((s) => (
                <PixelIcon
                  key={s}
                  name="shield"
                  className={`bha-daily__shield ${s <= shields ? '' : 'bha-daily__shield--lost'}`}
                />
              ))}
            </div>
          </div>

          <Card variant="glass" padding="sm" className="bha-daily__brief">
            <p><strong>Mission:</strong> {currentPuzzle.brief}</p>
          </Card>

          <p className="bha-daily__feedback" role="status" aria-live="polite">
            {feedback}
          </p>

          <div className="bha-daily__workspace-grid">
            <div className="bha-daily__col">
              <CodeViewer
                code={currentPuzzle.buggyCode}
                language={currentPuzzle.language}
                selectedLine={selectedLine}
                onSelectLine={(l) => phase === 'FIND_LINE' && setSelectedLine(l)}
                disabled={phase !== 'FIND_LINE'}
              />
              {phase === 'FIND_LINE' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                  <Button
                    variant="primary"
                    onClick={handleConfirmLine}
                    disabled={selectedLine === null}
                    icon={<PixelIcon name="target" />}
                  >
                    Confirm Line {selectedLine ? `#${selectedLine}` : ''}
                  </Button>
                </div>
              )}
            </div>

            <div className="bha-daily__col">
              <OutputPanel
                expectedOutput={currentPuzzle.expectedOutput}
                actualOutput={currentPuzzle.actualOutput}
              />
              {phase === 'FIX_BUG' && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <FixOptions
                    options={currentPuzzle.options}
                    selectedOptionId={selectedOptionId}
                    onSelectOption={setSelectedOptionId}
                    onSubmit={handleConfirmFix}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                    <Button
                      variant="primary"
                      onClick={handleConfirmFix}
                      disabled={!selectedOptionId}
                      icon={<PixelIcon name="hammer" />}
                    >
                      Deploy Fix
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
