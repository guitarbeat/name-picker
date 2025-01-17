/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTournament } from '../../hooks/useTournament';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import NameCard from '../NameCard/NameCard';
import './Tournament.css';

const TournamentControls = ({ onEndEarly, isTransitioning }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <div className="tournament-controls" role="group" aria-label="Tournament controls">
      <button 
        className="end-early-button"
        onClick={() => setShowConfirmation(true)}
        disabled={isTransitioning}
        aria-label="End tournament early"
      >
        End Tournament Early
      </button>

      {showConfirmation && (
        <div className="end-early-confirmation" role="alertdialog" aria-label="Confirm ending tournament">
          <p>Are you sure you want to end the tournament early? Current progress will be saved and you can adjust rankings manually.</p>
          <button 
            className="confirm-end-button"
            onClick={onEndEarly}
            aria-label="Confirm end tournament"
          >
            Yes, End Now
          </button>
          <button 
            className="cancel-end-button"
            onClick={() => setShowConfirmation(false)}
            aria-label="Continue tournament"
          >
            No, Continue
          </button>
        </div>
      )}
    </div>
  );
};

function TournamentContent({ onComplete, existingRatings = {}, names = [], userName, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const {
    currentMatch,
    isTransitioning,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    progress,
    handleVote,
    getCurrentRatings
  } = useTournament({ names, existingRatings, onComplete });

  const handleVoteWithAnimation = useCallback((result) => {
    setSelectedOption(result);
    
    // Create vote data
    const voteData = {
      matchNumber: currentMatchNumber,
      result: result === 'left' ? -1 : result === 'right' ? 1 : result === 'both' ? 0 : 2,
      timestamp: Date.now(),
      match: currentMatch
    };
    
    // Call the onVote callback
    if (onVote) {
      onVote(voteData);
    }
    
    handleVote(result);
  }, [handleVote, currentMatch, currentMatchNumber, onVote]);

  const handleEndEarly = useCallback(() => {
    const currentRatings = getCurrentRatings();
    onComplete(currentRatings);
  }, [getCurrentRatings, onComplete]);

  useEffect(() => {
    if (selectedOption) {
      const timer = setTimeout(() => setSelectedOption(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedOption]);

  useKeyboardControls({
    onLeft: () => !isTransitioning && handleVoteWithAnimation('left'),
    onRight: () => !isTransitioning && handleVoteWithAnimation('right'),
    onBoth: () => !isTransitioning && handleVoteWithAnimation('both'),
    onNone: () => !isTransitioning && handleVoteWithAnimation('none'),
    isDisabled: isTransitioning
  });

  if (!currentMatch) {
    return <LoadingSpinner />;
  }

  return (
    <div className="tournament" role="main">
      <div className="progress-info" role="status" aria-live="polite">
        <div className="round-info">
          <span className="round-number">Round {roundNumber}</span>
          <span className="match-count">Match {currentMatchNumber} of {totalMatches}</span>
        </div>
        <div className="percentage-info" aria-label={`${progress}% Complete`}>{progress}% Complete</div>
      </div>

      <TournamentControls onEndEarly={handleEndEarly} isTransitioning={isTransitioning} />

      <div className="matchup" role="region" aria-label="Current matchup">
        <div className="names-row">
          <div className="name-container left">
            <NameCard
              name={currentMatch.left.name}
              description={currentMatch.left.description}
              isSelected={selectedOption === 'left'}
              onClick={() => !isTransitioning && handleVoteWithAnimation('left')}
              disabled={isTransitioning}
              shortcutHint="Press ← arrow key"
              size="large"
              aria-label={`Left option: ${currentMatch.left.name}`}
            />
          </div>

          <div className="vs-section" aria-hidden="true">
            <div className="vs-text">vs</div>
          </div>

          <div className="name-container right">
            <NameCard
              name={currentMatch.right.name}
              description={currentMatch.right.description}
              isSelected={selectedOption === 'right'}
              onClick={() => !isTransitioning && handleVoteWithAnimation('right')}
              disabled={isTransitioning}
              shortcutHint="Press → arrow key"
              size="large"
              aria-label={`Right option: ${currentMatch.right.name}`}
            />
          </div>
        </div>

        <div className="center-options" role="group" aria-label="Additional voting options">
          <button
            className={`extra-options-button ${selectedOption === 'both' ? 'selected' : ''}`}
            onClick={() => !isTransitioning && handleVoteWithAnimation('both')}
            disabled={isTransitioning}
            aria-label="Like both names"
          >
            Like Both
          </button>
          <button
            className={`extra-options-button ${selectedOption === 'none' ? 'selected' : ''}`}
            onClick={() => !isTransitioning && handleVoteWithAnimation('none')}
            disabled={isTransitioning}
            aria-label="No opinion"
          >
            No Opinion
          </button>
        </div>
      </div>

      <div className="tournament-instructions" role="note">
        <p>Click on a name to choose it, or select an option below</p>
      </div>

      <div className="keyboard-hints" role="note">
        <p>Keyboard shortcuts: ← Left, → Right, B (Both), N (No Opinion)</p>
      </div>
    </div>
  );
}

function Tournament(props) {
  return (
    <ErrorBoundary>
      <TournamentContent {...props} />
    </ErrorBoundary>
  );
}

export default Tournament; 