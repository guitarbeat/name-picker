/**
 * @module NameCard
 * @description A reusable card component for displaying name options
 * with consistent styling and behavior across the application.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './NameCard.module.css';

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
  const [rippleStyle, setRippleStyle] = useState({});
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    if (isRippling) {
      const timer = setTimeout(() => setIsRippling(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isRippling]);

  const handleInteraction = (event) => {
    if (disabled) return;

    if (event.type === 'click' || (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' '))) {
      event.preventDefault();
      
      // Create ripple effect
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
      const y = event.clientY ? event.clientY - rect.top : rect.height / 2;
      
      setRippleStyle({
        left: `${x}px`,
        top: `${y}px`
      });
      
      setIsRippling(true);
      onClick?.();
    }
  };

  const cardClasses = [
    styles.card,
    styles[size],
    isSelected && styles.selected,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-selected={isSelected}
    >
      <h3 className={styles.name}>{name}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {shortcutHint && (
        <span className={styles.shortcutHint} aria-hidden="true">
          {shortcutHint}
        </span>
      )}
      {isSelected && (
        <span className={styles.checkMark} aria-hidden="true">✓</span>
      )}
      {isRippling && (
        <span 
          className={styles.rippleEffect}
          style={rippleStyle}
          aria-hidden="true"
        />
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