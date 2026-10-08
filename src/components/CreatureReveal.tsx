import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { PixelIcon } from './PixelIcon';
import type { BugPuzzle } from '../content/types';
import type { XpResult } from '../engine/engine';
import './CreatureReveal.css';

export interface CreatureRevealProps {
  isOpen: boolean;
  puzzle: BugPuzzle;
  xpResult: XpResult;
  bitsEarned: number;
  onNext: () => void;
  onClose: () => void;
}

export function CreatureReveal({
  isOpen,
  puzzle,
  xpResult,
  bitsEarned,
  onNext,
  onClose,
}: CreatureRevealProps) {
  const { creature } = puzzle;
  const lines = puzzle.buggyCode.split('\n');
  const buggyLine = lines[puzzle.bugLineNumber - 1];
  const correctOption = puzzle.options.find((o) => o.id === puzzle.correctOptionId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bug Creature Captured!"
      description={`You successfully squashed ${creature.name}!`}
      maxWidth="640px"
      footer={
        <div className="bha-reveal__actions">
          <Button variant="secondary" onClick={onClose}>
            Review Arena
          </Button>
          <Button variant="primary" onClick={onNext} icon={<PixelIcon name="arrow-right" />}>
            Next Hunt
          </Button>
        </div>
      }
    >
      <div className="bha-reveal">
        {/* Creature Header Card */}
        <div className="bha-creature-card">
          <div className="bha-creature-card__avatar" aria-hidden="true">
            {creature.avatarEmoji}
          </div>
          <div className="bha-creature-card__details">
            <div className="bha-creature-card__row">
              <h3 className="bha-creature-card__name">{creature.name}</h3>
              <Badge variant="accent" size="sm">
                {creature.rarity}
              </Badge>
            </div>
            <p className="bha-creature-card__species">Species: {creature.species}</p>
            <p className="bha-creature-card__lore">{creature.description}</p>
          </div>
        </div>

        {/* Rewards Ribbon */}
        <div className="bha-rewards-ribbon">
          <div className="bha-reward-item">
            <span className="bha-reward-item__label">XP Earned</span>
            <span className="bha-reward-item__val bha-reward-item__val--xp">
              +{xpResult.totalXp} XP
            </span>
          </div>
          <div className="bha-reward-item">
            <span className="bha-reward-item__label">Bug Bits</span>
            <span className="bha-reward-item__val bha-reward-item__val--bits">
              +{bitsEarned} <PixelIcon name="coin" size={21} />
            </span>
          </div>
          {xpResult.cleanCatch && (
            <div className="bha-reward-item">
              <span className="bha-reward-item__label">Bonus</span>
              <span className="bha-reward-item__val bha-reward-item__val--bonus">
                Clean Catch! <PixelIcon name="target" size={21} />
              </span>
            </div>
          )}
        </div>

        {/* Code Diff */}
        <div className="bha-diff-section">
          <h4 className="bha-diff-title">Code Resolution Diff</h4>
          <div className="bha-diff-box">
            <div className="bha-diff-line bha-diff-line--del">
              <span className="bha-diff-sign">-</span>
              <code>{buggyLine}</code>
            </div>
            <div className="bha-diff-line bha-diff-line--add">
              <span className="bha-diff-sign">+</span>
              <code>{correctOption?.codeReplacement}</code>
            </div>
          </div>
        </div>

        {/* Post-Mortem Explanation */}
        <div className="bha-explanation-section">
          <h4 className="bha-explanation-title">Bug Post-Mortem</h4>
          <p className="bha-explanation-text">{puzzle.explanation}</p>
        </div>
      </div>
    </Modal>
  );
}
