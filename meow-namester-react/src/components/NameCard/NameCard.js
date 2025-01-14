/**
 * @module NameCard
 * @description A reusable card component for displaying name options
 * with consistent styling and behavior across the application.
 */

import React from 'react';
import './NameCard.css';

function NameCard({
  name,
  description,
  isSelected,
  onClick,
  disabled = false,
  shortcutHint,
  className = '',
  size = 'medium'
}) {
  return (
    <div 
      className={`name-card ${isSelected ? 'selected' : ''} ${size} ${className}`}
      onClick={() => !disabled && onClick?.()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      title={shortcutHint}
    >
      <h3>{name}</h3>
      {description && <p className="name-description">{description}</p>}
      {isSelected && <span className="check-mark">✓</span>}
    </div>
  );
}

export default NameCard; 