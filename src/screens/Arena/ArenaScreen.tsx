import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Language, BugPuzzle } from '../../content/types';
import { getPuzzlesByLanguage } from '../../content/puzzles';
import { CodeViewer } from '../../components/CodeViewer';
import { OutputPanel } from '../../components/OutputPanel';
import { FixOptions } from '../../components/FixOptions';
import { CreatureReveal } from '../../components/CreatureReveal';
import { PetCompanion } from '../../components/PetCompanion';
import type { PetMood } from '../../components/PetCompanion';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { PixelIcon } from '../../components/PixelIcon';
import {
  calculateXP,
  calculateBugBits,
  orderPuzzlesForTrack,
  firstUnsolvedIndex,
  aiDifficultyFor,
} from '../../engine/engine';
import type { XpResult } from '../../engine/engine';
import { useAppState } from '../../app/AppState';
import { requestBugPuzzle } from '../../ai/generator';
import './ArenaScreen.css';

type HuntPhase = 'FIND_LINE' | 'FIX_BUG' | 'REVEAL';

function parseInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    if (hash.includes('lang=javascript')) return 'javascript';
    if (hash.includes('lang=python')) return 'python';
  }
  return 'python';
}

export interface ArenaScreenProps {
  initialLanguage?: Language;
}

export function ArenaScreen({ initialLanguage }: ArenaScreenProps = {}) {
  const { state, recordPuzzleCompletion } = useAppState();

  const [language, setLanguage] = useState<Language>(() => initialLanguage || parseInitialLanguage());
  // Puzzles in the order that suits the learner's track; resume at the first unsolved one
  const trackPuzzles = useCallback(
    (lang: Language) => orderPuzzlesForTrack(getPuzzlesByLanguage(lang), state.experience),
    [state.experience],
  );
  const [puzzleIndex, setPuzzleIndex] = useState(() =>
    firstUnsolvedIndex(trackPuzzles(language), state.completedPuzzleIds),
  );
  const [customAiPuzzle, setCustomAiPuzzle] = useState<BugPuzzle | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [bugReported, setBugReported] = useState(false);

  // Gameplay state
  const [phase, setPhase] = useState<HuntPhase>('FIND_LINE');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [wrongLine, setWrongLine] = useState<number | null>(null);
  const [confirmedBugLine, setConfirmedBugLine] = useState<number | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shields, setShields] = useState<number>(3);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const [petMood, setPetMood] = useState<PetMood>('idle');

  // Reveal modal state
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [lastXpResult, setLastXpResult] = useState<XpResult | null>(null);
  const [lastBitsEarned, setLastBitsEarned] = useState<number>(0);

  const puzzles = useMemo(() => trackPuzzles(language), [trackPuzzles, language]);
  const currentPuzzle: BugPuzzle = customAiPuzzle || puzzles[puzzleIndex] || puzzles[0];
  const solvedCount = puzzles.filter((p) => state.completedPuzzleIds.includes(p.id)).length;
  const isSolved = !customAiPuzzle && state.completedPuzzleIds.includes(currentPuzzle.id);

  const resetForPuzzle = useCallback(() => {
    setPhase('FIND_LINE');
    setSelectedLine(null);
    setWrongLine(null);
    setConfirmedBugLine(null);
    setSelectedOptionId(null);
    setShields(3);
    setHintsUsed(0);
    setActiveHintIndex(null);
    setAnnouncement('');
    setIsRevealOpen(false);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    if (newLang !== language) {
      setLanguage(newLang);
      setPuzzleIndex(firstUnsolvedIndex(trackPuzzles(newLang), state.completedPuzzleIds));
      setCustomAiPuzzle(null);
      resetForPuzzle();
      window.location.hash = `#/play?lang=${newLang}`;
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('lang=javascript') && language !== 'javascript') {
        setLanguage('javascript');
        setPuzzleIndex(firstUnsolvedIndex(trackPuzzles('javascript'), state.completedPuzzleIds));
        setCustomAiPuzzle(null);
        resetForPuzzle();
      } else if (hash.includes('lang=python') && language !== 'python') {
        setLanguage('python');
        setPuzzleIndex(firstUnsolvedIndex(trackPuzzles('python'), state.completedPuzzleIds));
        setCustomAiPuzzle(null);
        resetForPuzzle();
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [language, resetForPuzzle, trackPuzzles, state.completedPuzzleIds]);

  const handleNextPuzzle = () => {
    setCustomAiPuzzle(null);
    // Prefer the next unsolved puzzle; fall back to simple rotation once all are solved
    const ahead = [...puzzles.slice(puzzleIndex + 1), ...puzzles.slice(0, puzzleIndex + 1)];
    const nextUnsolved = ahead.find(
      (p) => p.id !== currentPuzzle.id && !state.completedPuzzleIds.includes(p.id),
    );
    setPuzzleIndex(
      nextUnsolved ? puzzles.indexOf(nextUnsolved) : (puzzleIndex + 1) % puzzles.length,
    );
    resetForPuzzle();
  };

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    setBugReported(false);
    try {
      const res = await requestBugPuzzle(language, aiDifficultyFor(state.experience));
      setCustomAiPuzzle(res.puzzle);
      resetForPuzzle();
      setAnnouncement(res.message || 'Spawned fresh AI bug puzzle!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleReportBug = () => {
    setBugReported(true);
    setAnnouncement('Bug reported. Thank you for making BugWug better!');
    setTimeout(() => handleNextPuzzle(), 1200);
  };

  const handleConfirmLine = () => {
    if (selectedLine === null) return;

    if (selectedLine === currentPuzzle.bugLineNumber) {
      setConfirmedBugLine(selectedLine);
      setPhase('FIX_BUG');
      setPetMood('happy');
      setAnnouncement(`Correct! Bug located on line ${selectedLine}. Now choose the fix.`);
    } else {
      setWrongLine(selectedLine);
      const newShields = Math.max(0, shields - 1);
      setShields(newShields);
      setPetMood('alert');
      setAnnouncement(`Incorrect. Line ${selectedLine} is innocent. Shield lost.`);
      setTimeout(() => {
        setWrongLine(null);
        setPetMood('idle');
      }, 800);
    }
  };

  const handleConfirmFix = () => {
    if (!selectedOptionId) return;

    if (selectedOptionId === currentPuzzle.correctOptionId) {
      // Calculate XP and Bits
      const isClean = shields === 3 && hintsUsed === 0;
      const xpRes = calculateXP(
        currentPuzzle.difficulty,
        state.streakDays,
        hintsUsed,
        isClean,
      );
      const bits = calculateBugBits(xpRes.totalXp, isClean);

      setLastXpResult(xpRes);
      setLastBitsEarned(bits);

      // Record in global storage
      recordPuzzleCompletion(
        currentPuzzle.id,
        currentPuzzle.creature.id,
        currentPuzzle.category,
        xpRes.totalXp,
        bits,
        isClean,
      );

      setPhase('REVEAL');
      setPetMood('happy');
      setIsRevealOpen(true);
      setAnnouncement(`Victory! ${currentPuzzle.creature.name} was successfully captured!`);
    } else {
      const newShields = Math.max(0, shields - 1);
      setShields(newShields);
      setPetMood('alert');
      setAnnouncement('That fix did not resolve the bug. Try another option.');
      setTimeout(() => setPetMood('idle'), 1000);
    }
  };

  const handleUseHint = () => {
    if (hintsUsed >= 3) return;
    const nextHint = hintsUsed;
    setHintsUsed((prev) => prev + 1);
    setActiveHintIndex(nextHint);
    setPetMood('thinking');
    setAnnouncement(`Hint tier ${nextHint + 1}: ${currentPuzzle.hints[nextHint]}`);
  };

  return (
    <div className="bha-arena screen">
      {/* ARIA Live Region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* Language Selector Bar */}
      <div className="bha-arena__top-controls">
        <div className="bha-lang-tabs" role="tablist" aria-label="Select Programming Language">
          <button
            type="button"
            role="tab"
            aria-selected={language === 'python'}
            className={`bha-lang-tab ${language === 'python' ? 'bha-lang-tab--active' : ''}`}
            onClick={() => handleLanguageChange('python')}
          >
            Python
            <span className="bha-lang-tab__count">{getPuzzlesByLanguage('python').length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={language === 'javascript'}
            className={`bha-lang-tab ${language === 'javascript' ? 'bha-lang-tab--active' : ''}`}
            onClick={() => handleLanguageChange('javascript')}
          >
            JavaScript
            <span className="bha-lang-tab__count">{getPuzzlesByLanguage('javascript').length}</span>
          </button>
        </div>

        {/* Puzzle Selector Navigator */}
        <div className="bha-puzzle-nav">
          <Button
            variant="accent"
            size="sm"
            onClick={handleGenerateAi}
            isLoading={isGeneratingAi}
            icon={<PixelIcon name="robot" />}
            title="Generate a dynamic AI bug using Google Gemini"
          >
            AI Spawn
          </Button>
          <span className="bha-puzzle-nav__counter">
            {customAiPuzzle
              ? 'AI Challenge'
              : `Puzzle ${puzzleIndex + 1} of ${puzzles.length} · ${solvedCount} solved`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPuzzle}
            title="Skip to next puzzle"
          >
            Skip
            <PixelIcon name="arrow-right" size={16} className="bha-skip-arrow" />
          </Button>
        </div>
      </div>

      {/* Arena Stage Header */}
      <header className="bha-arena__header">
        <div className="bha-arena__title-group">
          <div className="bha-arena__badges">
            {customAiPuzzle && (
              <Badge variant="accent" size="sm">
                <PixelIcon name="robot" size={14} />
                AI Generated
              </Badge>
            )}
            <Badge variant={language === 'python' ? 'python' : 'js'} size="sm">
              {language}
            </Badge>
            <Badge
              variant={
                currentPuzzle.difficulty === 1
                  ? 'success'
                  : currentPuzzle.difficulty === 2
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {currentPuzzle.difficulty === 1
                ? 'Easy'
                : currentPuzzle.difficulty === 2
                ? 'Medium'
                : 'Hard'}
            </Badge>
            <Badge variant="primary" size="sm">
              {currentPuzzle.category.replace('_', ' ')}
            </Badge>
            {isSolved && (
              <Badge variant="success" size="sm">
                <PixelIcon name="check" size={14} />
                Solved
              </Badge>
            )}
            {customAiPuzzle && (
              <button
                type="button"
                onClick={handleReportBug}
                className="bha-report-link"
                title="Report broken AI puzzle"
              >
                <PixelIcon name={bugReported ? 'check' : 'flag'} size={14} />
                {bugReported ? 'Reported' : 'Report Bug'}
              </button>
            )}
          </div>
          <h1 className="bha-arena__title">{currentPuzzle.title}</h1>
        </div>

        {/* Shields & Hint Status */}
        <div className="bha-arena__status">
          <div className="bha-shields" aria-label={`${shields} out of 3 shields remaining`}>
            <span className="bha-shields__label">Shields</span>
            {[1, 2, 3].map((shieldNum) => (
              <PixelIcon
                key={shieldNum}
                name="shield"
                size={21}
                className={`bha-shield ${shieldNum <= shields ? 'bha-shield--active' : 'bha-shield--lost'}`}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseHint}
            disabled={hintsUsed >= 3 || phase === 'REVEAL'}
            icon={<PixelIcon name="bulb" />}
          >
            Hint ({hintsUsed}/3)
          </Button>

          <PetCompanion
            species={state.pet.species}
            stage={state.pet.stage}
            mood={petMood}
            cosmetic={state.pet.cosmetic}
            size={46}
            onClick={handleUseHint}
          />
        </div>
      </header>

      {/* Brief Card */}
      <Card variant="glass" padding="md" className="bha-arena__brief">
        <h2 className="bha-brief-title">Mission Brief</h2>
        <p className="bha-brief-text">{currentPuzzle.brief}</p>
      </Card>

      {/* Active Hint Callout (if used) */}
      {activeHintIndex !== null && (
        <div className="bha-hint-callout" role="alert">
          <span className="bha-hint-callout__icon" aria-hidden="true">
            <PixelIcon name="bulb" />
          </span>
          <div className="bha-hint-callout__body">
            <strong>Hint {activeHintIndex + 1} (Tier {activeHintIndex + 1}):</strong>{' '}
            {currentPuzzle.hints[activeHintIndex]}
          </div>
        </div>
      )}

      {/* Main Play Area */}
      <div className="bha-arena__workspace">
        {/* Left Column: Code Viewer */}
        <div className="bha-workspace__col">
          <CodeViewer
            code={currentPuzzle.buggyCode}
            language={currentPuzzle.language}
            selectedLine={selectedLine}
            highlightedLine={confirmedBugLine}
            wrongLine={wrongLine}
            onSelectLine={(lineNum) => {
              if (phase === 'FIND_LINE') {
                setSelectedLine(lineNum);
              }
            }}
            disabled={phase !== 'FIND_LINE'}
          />

          {phase === 'FIND_LINE' && (
            <div className="bha-line-confirm">
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmLine}
                disabled={selectedLine === null}
                icon={<PixelIcon name="target" />}
              >
                Confirm Line {selectedLine ? `#${selectedLine}` : ''}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Output / Fix Options */}
        <div className="bha-workspace__col">
          <OutputPanel
            expectedOutput={currentPuzzle.expectedOutput}
            actualOutput={currentPuzzle.actualOutput}
          />

          {phase === 'FIX_BUG' && (
            <div className="bha-fix-phase">
              <FixOptions
                options={currentPuzzle.options}
                selectedOptionId={selectedOptionId}
                onSelectOption={setSelectedOptionId}
                onSubmit={handleConfirmFix}
              />
              <div className="bha-fix-confirm">
                <Button
                  variant="primary"
                  size="md"
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

      {/* Creature Reveal Modal */}
      {lastXpResult && (
        <CreatureReveal
          isOpen={isRevealOpen}
          puzzle={currentPuzzle}
          xpResult={lastXpResult}
          bitsEarned={lastBitsEarned}
          onNext={handleNextPuzzle}
          onClose={() => setIsRevealOpen(false)}
        />
      )}
    </div>
  );
}
