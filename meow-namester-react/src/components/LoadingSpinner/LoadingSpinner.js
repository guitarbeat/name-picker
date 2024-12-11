/**
 * @module LoadingSpinner
 * @description A simple loading spinner component that provides visual feedback
 * during asynchronous operations. Uses CSS animations for the spinning effect.
 * 
 * @example
 * // Show loading state
 * {isLoading && <LoadingSpinner />}
 * 
 * @component
 * @returns {JSX.Element} A spinning loader with proper ARIA label
 */

import React from 'react';

const LoadingSpinner = () => (
  <div className="loading-spinner" aria-label="Loading...">
    <div className="spinner"></div>
  </div>
);

export default LoadingSpinner; 