/**
 * @module ErrorBoundary
 * @description A React error boundary component that catches JavaScript errors
 * in child component tree and displays a fallback UI. Prevents the entire app
 * from crashing when an error occurs.
 * 
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * @component
 * @extends {React.Component}
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} Either the children or error UI
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 