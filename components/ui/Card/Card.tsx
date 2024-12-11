import React from 'react';
import styles from './Card.module.scss';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'winner' | 'loser';
  isClickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className,
  variant = 'default',
  isClickable = false,
  onClick,
  ...props 
}) => {
  return (
    <div 
      className={clsx(
        styles.card,
        styles[variant],
        isClickable && styles.clickable,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}; 