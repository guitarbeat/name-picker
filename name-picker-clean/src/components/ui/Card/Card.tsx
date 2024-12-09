import React from 'react';
import styles from './Card.module.scss';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'active' | 'winner' | 'loser';
  isClickable?: boolean;
}

export function Card({ 
  children, 
  className, 
  variant = 'default',
  isClickable = false,
  ...props 
}: CardProps) {
  return (
    <div 
      className={clsx(
        styles.card,
        styles[variant],
        isClickable && styles.clickable,
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
} 