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
  isDisabled = false
}) {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (isDisabled) return;
      
      switch(event.key) {
        case 'ArrowLeft':
          onLeft?.();
          break;
        case 'ArrowRight':
          onRight?.();
          break;
        case 'b':
        case 'B':
          onBoth?.();
          break;
        case 'n':
        case 'N':
          onNone?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onLeft, onRight, onBoth, onNone, isDisabled]);
} 