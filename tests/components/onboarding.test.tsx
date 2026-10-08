import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingScreen } from '../../src/screens/Onboarding/OnboardingScreen';

describe('Onboarding experience question', () => {
  it('offers exactly two experience options in an accessible radio group', () => {
    render(<OnboardingScreen onComplete={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: /debugging experience/i })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByText('New to debugging')).toBeInTheDocument();
    expect(screen.getByText('Some experience')).toBeInTheDocument();
  });

  it('keeps Start disabled until an option is chosen', () => {
    const onComplete = vi.fn();
    render(<OnboardingScreen onComplete={onComplete} />);
    const start = screen.getByRole('button', { name: /start hunting/i });
    expect(start).toBeDisabled();
    fireEvent.click(start);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('submits the chosen level', () => {
    const onComplete = vi.fn();
    render(<OnboardingScreen onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Some experience'));
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: /start hunting/i }));
    expect(onComplete).toHaveBeenCalledWith('experienced');
  });

  it('is fully keyboard operable', () => {
    const onComplete = vi.fn();
    render(<OnboardingScreen onComplete={onComplete} />);
    const [first] = screen.getAllByRole('radio');
    expect(first).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(first, { key: ' ' });
    expect(first).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('button', { name: /start hunting/i }));
    expect(onComplete).toHaveBeenCalledWith('experienced');
  });
});
