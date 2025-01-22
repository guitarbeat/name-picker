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

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: { width: '40px', height: '40px' },
    medium: { width: '60px', height: '60px' },
    large: { width: '80px', height: '80px' }
  };

  return (
    <div className="loading-spinner" role="status" aria-label="Loading content">
      <div className="spinner" style={sizeClasses[size]} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 