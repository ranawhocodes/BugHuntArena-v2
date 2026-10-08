import React, { forwardRef } from 'react';
import { PixelIcon } from './PixelIcon';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`bha-btn bha-btn--${variant} bha-btn--${size} ${
          fullWidth ? 'bha-btn--full' : ''
        } ${isLoading ? 'bha-btn--loading' : ''} ${className}`.trim()}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        {...props}
      >
        {isLoading ? (
          <span className="bha-btn__spinner" aria-hidden="true">
            <PixelIcon name="loader" size={16} />
          </span>
        ) : (
          icon && <span className="bha-btn__icon" aria-hidden="true">{icon}</span>
        )}
        <span className="bha-btn__text">{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
