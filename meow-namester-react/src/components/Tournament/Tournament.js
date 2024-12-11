/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 * Includes keyboard controls and progress tracking.
 * 
 * @example
 * <Tournament
 *   currentMatch={{ left: "Whiskers", right: "Mittens" }}
 *   onVote={(result) => handleVote(result)}
 *   roundNumber={1}
 *   totalMatches={10}
 *   currentMatchNumber={3}
 * />
 * 
 * @param {Object} props
 * @param {Object} props.currentMatch - Object containing left and right name options
 * @param {Function} props.onVote - Callback function when a vote is made
 * @param {number} [props.roundNumber=1] - Current round number
 * @param {number} [props.totalMatches=1] - Total number of matches in the tournament
 * @param {number} [props.currentMatchNumber=1] - Current match number
 * @param {Function} [props.onNavigate] - Optional callback for navigation between matches
 */

import React, { useCallback, useState, useEffect } from 'react';
import { PreferenceSorter } from '../../utils/sortingAlgorithm';
import EloRating from '../../utils/EloRating';
import './Tournament.css';

function Tournament({ onComplete, existingRatings = {}, names = [], userName }) {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentMatchNumber, setCurrentMatchNumber] = useState(1);
  const [totalMatches, setTotalMatches] = useState(1);
  const [sorter, setSorter] = useState(null);
  const [elo] = useState(() => new EloRating());
  const [resolveVote, setResolveVote] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showEndEarlyConfirmation, setShowEndEarlyConfirmation] = useState(false);

  useEffect(() => {
    console.log('Tournament received names:', names);
  }, [names]);

  useEffect(() => {
    if (!names || names.length === 0) {
      console.log('No names provided for tournament');
      return;
    }

    console.log('Starting new tournament with names:', names);
    // Create a new sorter with just the name strings for compatibility
    const nameStrings = names.map(n => n.name);
    const newSorter = new PreferenceSorter(nameStrings);
    setSorter(newSorter);
    
    const n = names.length;
    const estimatedMatches = Math.ceil(n * Math.log2(n));
    setTotalMatches(estimatedMatches);
    setCurrentMatchNumber(1);
    setRoundNumber(1);

    runTournament(newSorter);
  }, [names]);

  const runTournament = async (tournamentSorter) => {
    try {
      // Save initial state for recovery
      const initialState = {
        names,
        existingRatings,
        currentMatchNumber: 1,
        roundNumber: 1
      };
      localStorage.setItem('tournamentState', JSON.stringify(initialState));

      const sortedResults = await tournamentSorter.sort(async (leftName, rightName) => {
        // Find the full name objects for the current match
        const left = names.find(n => n.name === leftName);
        const right = names.find(n => n.name === rightName);
        setCurrentMatch({ left, right });
        return new Promise((resolve) => {
          setResolveVote(() => resolve);
        });
      });

      // Calculate ratings with dynamic blend factor based on matches played
      const ratingsArray = sortedResults.map((name, index) => {
        // Get existing rating data
        const existingData = typeof existingRatings[name] === 'object'
          ? existingRatings[name]
          : { rating: existingRatings[name] || 1500, matches: 0 };

        const totalNames = sortedResults.length;
        const position = index;
        
        // Dynamic rating spread based on tournament size
        const ratingSpread = Math.min(1000, totalNames * 25);
        
        // Calculate position-based rating
        const positionValue = ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
        const newPositionRating = 1500 + positionValue;

        // Calculate blend factor based on number of matches played
        // More matches = more weight on new rating
        const matchesPlayed = currentMatchNumber;
        const maxMatches = totalMatches;
        const blendFactor = Math.min(0.8, (matchesPlayed / maxMatches) * 0.9);

        // Weighted average of existing and new ratings
        const newRating = Math.round(
          (blendFactor * newPositionRating) +
          ((1 - blendFactor) * existingData.rating)
        );

        // Ensure rating stays within reasonable bounds
        const minRating = 1000;
        const maxRating = 2000;
        const finalRating = Math.max(minRating, Math.min(maxRating, newRating));

        return {
          name,
          rating: finalRating,
          confidence: (matchesPlayed / maxMatches) // Add confidence score
        };
      });

      // Clear saved state on successful completion
      localStorage.removeItem('tournamentState');
      
      onComplete(ratingsArray);
    } catch (error) {
      console.error('Tournament error:', error);
      // Attempt to recover from saved state
      const savedState = localStorage.getItem('tournamentState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setCurrentMatchNumber(state.currentMatchNumber);
        setRoundNumber(state.roundNumber);
        // Could implement more recovery logic here
      }
    }
  };

  const handleVote = useCallback((result) => {
    if (isTransitioning || !resolveVote) return;

    setSelectedOption(result);
    setIsTransitioning(true);
    
    // Enhanced vote value calculation
    let voteValue;
    switch (result) {
      case 'left':
        voteValue = -1;
        break;
      case 'right':
        voteValue = 1;
        break;
      case 'both':
        // Randomize slight preference for variety
        voteValue = Math.random() * 0.2 - 0.1;
        break;
      case 'none':
        // True neutral with slight random variation
        voteValue = Math.random() * 0.1 - 0.05;
        break;
      default:
        voteValue = 0;
    }
    
    // Save progress
    localStorage.setItem('lastVote', JSON.stringify({
      matchNumber: currentMatchNumber,
      result: voteValue,
      timestamp: Date.now()
    }));

    resolveVote(voteValue);
    setCurrentMatchNumber(prev => prev + 1);
    
    // Update round number if needed
    if (currentMatchNumber % Math.ceil(names.length / 2) === 0) {
      setRoundNumber(prev => prev + 1);
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
      setSelectedOption(null);
    }, 500);
  }, [resolveVote, isTransitioning, currentMatchNumber, names.length]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (isTransitioning) return;
      
      switch(event.key) {
        case 'ArrowLeft':
          handleVote('left');
          break;
        case 'ArrowRight':
          handleVote('right');
          break;
        case 'b':
        case 'B':
          handleVote('both');
          break;
        case 'n':
        case 'N':
          handleVote('none');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleVote, isTransitioning]);

  const handleEndEarly = () => {
    setShowEndEarlyConfirmation(true);
  };

  const handleConfirmEnd = () => {
    // Calculate current rankings based on completed matches
    const currentRankings = sorter.getCurrentRankings().map((nameObj, index) => {
      // Get existing rating or default
      const currentRating = typeof existingRatings[nameObj.name] === 'object'
        ? existingRatings[nameObj.name].rating
        : (existingRatings[nameObj.name] || 1500);
      
      // Calculate new rating based on position
      const totalNames = names.length;
      const position = index;
      const ratingSpread = 500;
      const positionValue = ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
      
      // Blend existing rating with new position-based rating
      const blendFactor = 0.7;
      const newRating = Math.round(
        (blendFactor * (1500 + positionValue)) +
        ((1 - blendFactor) * currentRating)
      );

      // Ensure rating stays within bounds
      const finalRating = Math.max(1000, Math.min(2000, newRating));
      
      return {
        name: nameObj.name,
        rating: finalRating,
        description: nameObj.description
      };
    });

    onComplete(currentRankings);
  };

  const handleCancelEnd = () => {
    setShowEndEarlyConfirmation(false);
  };

  if (!currentMatch) {
    console.log('No current match');
    return <div>Loading tournament...</div>;
  }

  console.log('Current match:', currentMatch);

  const progress = Math.round((currentMatchNumber / totalMatches) * 100);

  return (
    <div className="tournament">
      <div className="progress-info">
        <div className="round-info">
          <span className="round-number">Round {roundNumber}</span>
          <span className="match-count">Match {currentMatchNumber} of {totalMatches}</span>
        </div>
        <div className="percentage-info">{progress}% Complete</div>
      </div>

      <div className="tournament-controls">
        <button 
          className="end-early-button"
          onClick={handleEndEarly}
          disabled={isTransitioning}
        >
          End Tournament Early
        </button>

        {showEndEarlyConfirmation && (
          <div className="end-early-confirmation">
            <p>Are you sure you want to end the tournament early? Current progress will be saved and you can adjust rankings manually.</p>
            <button 
              className="confirm-end-button"
              onClick={handleConfirmEnd}
            >
              Yes, End Now
            </button>
            <button 
              className="cancel-end-button"
              onClick={handleCancelEnd}
            >
              No, Continue
            </button>
          </div>
        )}
      </div>

      <div className="matchup">
        <div className="names-row">
          <div className="name-container left">
            <div 
              className={`name-card ${selectedOption === 'left' ? 'selected' : ''}`}
              onClick={() => !isTransitioning && handleVote('left')}
              role="button"
              tabIndex={0}
              title="Press ← arrow key"
            >
              <h3>{currentMatch.left.name}</h3>
              <p className="name-description">{currentMatch.left.description}</p>
            </div>
          </div>

          <div className="vs-section">
            <div className="vs-text">vs</div>
          </div>

          <div className="name-container right">
            <div 
              className={`name-card ${selectedOption === 'right' ? 'selected' : ''}`}
              onClick={() => !isTransitioning && handleVote('right')}
              role="button"
              tabIndex={0}
              title="Press → arrow key"
            >
              <h3>{currentMatch.right.name}</h3>
              <p className="name-description">{currentMatch.right.description}</p>
            </div>
          </div>
        </div>

        <div className="center-options">
          <button
            className={`extra-options-button ${selectedOption === 'both' ? 'selected' : ''}`}
            onClick={() => !isTransitioning && handleVote('both')}
            disabled={isTransitioning}
            title="Press 'B' key"
          >
            Like Both
          </button>
          <button
            className={`extra-options-button ${selectedOption === 'none' ? 'selected' : ''}`}
            onClick={() => !isTransitioning && handleVote('none')}
            disabled={isTransitioning}
            title="Press 'N' key"
          >
            No Opinion
          </button>
        </div>
      </div>

      <div className="tournament-instructions">
        <p>Click on a name to choose it, or select an option below</p>
      </div>

      <div className="keyboard-hints">
        <p>Keyboard shortcuts: ← Left, → Right, B (Both), N (No Opinion)</p>
      </div>
    </div>
  );
}

export default Tournament; 