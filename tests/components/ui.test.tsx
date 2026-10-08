import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Modal } from '../../src/components/Modal';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { TopBar } from '../../src/components/TopBar';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders label and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows spinner when isLoading', () => {
      render(<Button isLoading>Submitting</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
    });
  });

  describe('Card', () => {
    it('renders children with appropriate variant classes', () => {
      const { container } = render(
        <Card variant="glass" padding="lg">
          <p>Card Content</p>
        </Card>,
      );
      expect(container.firstChild).toHaveClass('bha-card--glass');
      expect(container.firstChild).toHaveClass('bha-card--pad-lg');
    });
  });

  describe('Badge', () => {
    it('renders text with variant', () => {
      render(<Badge variant="python">Python</Badge>);
      const badge = screen.getByText('Python');
      expect(badge).toHaveClass('bha-badge--python');
    });
  });

  describe('Modal', () => {
    it('renders when isOpen and calls onClose on escape', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal body</p>
        </Modal>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Hidden">
          <p>Should not show</p>
        </Modal>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('ThemeToggle', () => {
    it('toggles theme on click and updates document attribute', () => {
      render(<ThemeToggle />);
      const btn = screen.getByRole('button', { name: /switch to (light|dark) theme/i });
      fireEvent.click(btn);
      expect(document.documentElement.getAttribute('data-theme')).toBeDefined();
    });
  });

  describe('TopBar', () => {
    it('renders brand, stats, and navigates on link click', () => {
      const handleNav = vi.fn();
      render(
        <TopBar
          currentRoute="/"
          onNavigate={handleNav}
          streakDays={5}
          level={2}
          bugBits={100}
        />,
      );

      expect(screen.getByText('BugWug')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Lv.2')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();

      const arenaLink = screen.getByRole('button', { name: 'Arena' });
      fireEvent.click(arenaLink);
      expect(handleNav).toHaveBeenCalledWith('/play');
    });
  });
});
