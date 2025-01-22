/**
 * @module NameCard
 * @description A reusable card component for displaying name options
 * with consistent styling and behavior across the application.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './NameCard.css';

/**
 * NameCard Component
 * @param {Object} props
 * @param {string} props.name - The name to display in the card
 * @param {string} [props.description] - Optional description text
 * @param {boolean} [props.isSelected] - Whether the card is selected
 * @param {Function} [props.onClick] - Click handler function
 * @param {boolean} [props.disabled=false] - Whether the card is disabled
 * @param {string} [props.shortcutHint] - Keyboard shortcut hint
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {('small'|'medium')} [props.size='medium'] - Card size variant
 */
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
  const handleKeyPress = (event) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div 
      className={`name-card ${isSelected ? 'selected' : ''} ${size} ${className}`.trim()}
      onClick={() => !disabled && onClick?.()}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={disabled ? -1 : 0}
      title={shortcutHint}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      <h3 className="name-text">{name}</h3>
      {description && <p className="name-description">{description}</p>}
      {isSelected && (
        <span className="check-mark" aria-hidden="true">✓</span>
      )}
    </div>
  );
}

NameCard.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  shortcutHint: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium'])
};

export default NameCard; 