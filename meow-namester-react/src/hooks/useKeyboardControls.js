/**
 * @module useKeyboardControls
 * @description A custom hook that handles keyboard controls for the tournament interface
 */

import { useEffect } from 'react';

export function useKeyboardControls({
  onLeft,
  onRight,
  onBoth,
  onNone,
  onUndo,
  isDisabled = false
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isDisabled) return;
      
      switch(event.key.toLowerCase()) {
        case 'arrowleft':
          event.preventDefault();
          onLeft?.();
          break;
        case 'arrowright':
          event.preventDefault();
          onRight?.();
          break;
        case 'b':
          event.preventDefault();
          onBoth?.();
          break;
        case 'n':
          event.preventDefault();
          onNone?.();
          break;
        case 'u':
          event.preventDefault();
          onUndo?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLeft, onRight, onBoth, onNone, onUndo, isDisabled]);
} 