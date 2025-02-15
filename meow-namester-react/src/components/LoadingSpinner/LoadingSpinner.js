/**
 * @module LoadingSpinner
 * @description An elegant loading spinner component that provides visual feedback
 * during asynchronous operations. Features a dual-ring design with pulse animation.
 * 
 * @example
 * // Default size
 * {isLoading && <LoadingSpinner />}
 * 
 * // Custom size
 * {isLoading && <LoadingSpinner size="large" />}
 * 
 * @component
 * @param {Object} props
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Size variant of the spinner
 * @returns {JSX.Element} An animated loading spinner with proper ARIA attributes
 */

import React from 'react';
import './LoadingSpinner.css';

/**
 * A modern, elegant loading spinner component that provides visual feedback
 * during asynchronous operations.
 * 
 * @param {Object} props
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Size variant of the spinner
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div className="loading-spinner" role="status" aria-label="Loading content">
      <div className={`spinner ${size}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 