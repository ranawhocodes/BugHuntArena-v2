import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { PixelIcon } from '../../components/PixelIcon';
import type { PixelIconName } from '../../components/PixelIcon';
import type { ExperienceLevel } from '../../storage/schema';
import './OnboardingScreen.css';

interface OnboardingScreenProps {
  hunterName?: string;
  onComplete: (experience: ExperienceLevel) => void;
}

export const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  title: string;
  description: string;
  starts: string;
  icon: PixelIconName;
}[] = [
  {
    value: 'new',
    title: 'New to debugging',
    description:
      'I am still learning to read error messages and trace code line by line. Start me gently.',
    starts: 'Starts on Easy bugs',
    icon: 'sprout',
  },
  {
    value: 'experienced',
    title: 'Some experience',
    description:
      'I have fixed real bugs before. Skip the warm-ups and give me trickier challenges.',
    starts: 'Starts on Medium + Hard AI bugs',
    icon: 'target',
  },
];

export function OnboardingScreen({ hunterName, onComplete }: OnboardingScreenProps) {
  const [choice, setChoice] = useState<ExperienceLevel | null>(null);

  // Arrow keys move between options, as in a native radio group
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      const next = (index + step + EXPERIENCE_OPTIONS.length) % EXPERIENCE_OPTIONS.length;
      setChoice(EXPERIENCE_OPTIONS[next].value);
      const group = e.currentTarget.parentElement;
      (group?.children[next] as HTMLElement | undefined)?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setChoice(EXPERIENCE_OPTIONS[index].value);
    }
  };

  return (
    <div className="bha-onboarding screen">
      <header className="bha-onboarding__header">
        <Badge variant="primary" size="md">
          Welcome{hunterName ? `, ${hunterName}` : ''}
        </Badge>
        <h1 className="bha-onboarding__title" tabIndex={-1}>
          How much debugging have you done?
        </h1>
        <p className="bha-onboarding__subtitle">
          We tune puzzle difficulty, the Daily Hunt and AI-generated bugs to your answer. You can
          change it any time from your Profile.
        </p>
      </header>

      <div className="bha-onboarding__options" role="radiogroup" aria-label="Debugging experience">
        {EXPERIENCE_OPTIONS.map((option, index) => {
          const selected = choice === option.value;
          const focusable = selected || (choice === null && index === 0);
          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={selected}
              tabIndex={focusable ? 0 : -1}
              className={`bha-onboarding__option px-corners ${selected ? 'bha-onboarding__option--selected' : ''}`}
              onClick={() => setChoice(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <span className="bha-onboarding__option-icon" aria-hidden="true">
                <PixelIcon name={option.icon} size={42} />
              </span>
              <span className="bha-onboarding__option-body">
                <span className="bha-onboarding__option-title">{option.title}</span>
                <span className="bha-onboarding__option-desc">{option.description}</span>
                <span className="bha-onboarding__option-starts">{option.starts}</span>
              </span>
              <span className="bha-onboarding__option-check" aria-hidden="true">
                {selected && <PixelIcon name="check" size={21} />}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bha-onboarding__actions">
        <Button
          variant="primary"
          size="lg"
          disabled={!choice}
          onClick={() => choice && onComplete(choice)}
          icon={<PixelIcon name="arrow-right" />}
        >
          Start hunting
        </Button>
      </div>
    </div>
  );
}
