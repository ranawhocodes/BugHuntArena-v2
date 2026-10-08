import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'highlight' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  as: Component = 'div',
  className = '',
  ...props
}: CardProps) {
  const corners = variant === 'interactive' || variant === 'highlight' ? 'px-corners' : '';

  return (
    <Component
      className={`bha-card bha-card--${variant} bha-card--pad-${padding} ${corners} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
