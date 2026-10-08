import { useState, useEffect } from 'react';
import { PixelIcon } from './PixelIcon';
import './ThemeToggle.css';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bha-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      // Default to dark per spec Section 6.2
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const shell = document.querySelector('.app-shell');
    if (shell) shell.setAttribute('data-theme', theme);
    localStorage.setItem('bha-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      type="button"
      className="bha-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Current: ${theme} mode`}
    >
      <PixelIcon name={theme === 'dark' ? 'moon' : 'sun'} className="bha-theme-toggle__icon" />
    </button>
  );
}
