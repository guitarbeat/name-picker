/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTournament } from '../../hooks/useTournament';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import NameCard from '../NameCard/NameCard';
import Bracket from '../Bracket/Bracket';
import './Tournament.css';

const TournamentControls = ({ onEndEarly, isTransitioning, isMuted, onToggleMute }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEndConfirm = async () => {
    setShowConfirmation(false);
    await onEndEarly();
  };

  return (
    <div className="tournament-controls" role="group" aria-label="Tournament controls">
      <button 
        className={`sound-toggle-button ${isMuted ? 'muted' : ''}`}
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute tournament music" : "Mute tournament music"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
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
            onClick={handleEndConfirm}
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const pluckSoundRef = useRef(null);

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

  useEffect(() => {
    // Initialize audio with random song selection
    const songs = [
      '/sounds/AdhesiveWombat - Night Shade.mp3',
      '/sounds/what-is-love.mp3'
    ];
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    audioRef.current = new Audio(randomSong);
    audioRef.current.volume = 0.3; // Set initial volume to 30%
    audioRef.current.loop = true;
    
    // Start playing
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Autoplay prevented:", error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Playback prevented:", error);
          });
        }
      }
    }
  }, [isMuted]);

  useEffect(() => {
    // Initialize pluck sound
    pluckSoundRef.current = new Audio('/sounds/gameboy-pluck.mp3');
    pluckSoundRef.current.volume = 0.5; // Set pluck volume to 50%
    
    return () => {
      if (pluckSoundRef.current) {
        pluckSoundRef.current.pause();
        pluckSoundRef.current.currentTime = 0;
      }
    };
  }, []);

  const playPluckSound = useCallback(() => {
    if (!isMuted && pluckSoundRef.current) {
      pluckSoundRef.current.currentTime = 0; // Reset to start
      pluckSoundRef.current.play().catch(error => {
        console.log("Pluck sound playback prevented:", error);
      });
    }
  }, [isMuted]);

  const handleVoteWithAnimation = useCallback(async (result) => {
    if (isProcessing || isTransitioning) return;
    
    try {
      setIsProcessing(true);
      setSelectedOption(result);
      
      // Play pluck sound
      playPluckSound();
      
      // Convert string result to numeric value
      let numericResult;
      switch (result) {
        case 'left':
          numericResult = -1;
          break;
        case 'right':
          numericResult = 1;
          break;
        case 'both':
          numericResult = 0;
          break;
        case 'none':
          numericResult = 0;
          break;
        default:
          numericResult = 0;
      }
      
      // Create vote data with the numeric result
      const voteData = {
        matchNumber: currentMatchNumber,
        result: numericResult,
        timestamp: Date.now(),
        match: {
          left: { ...currentMatch.left },
          right: { ...currentMatch.right }
        }
      };

      // Add match to history
      setMatchHistory(prev => [...prev, {
        id: currentMatchNumber,
        name1: currentMatch.left.name,
        name2: currentMatch.right.name,
        winner: numericResult
      }]);
      
      // Call the onVote callback first to ensure vote is recorded
      if (onVote) {
        await onVote(voteData);
      }
      
      // Then handle the tournament logic
      await handleVote(result);
    } catch (error) {
      console.error('Error processing vote:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [handleVote, currentMatch, currentMatchNumber, onVote, isTransitioning, playPluckSound, isMuted]);

  const handleEndEarly = useCallback(async () => {
    try {
      setIsProcessing(true);
      // Stop the music when ending early
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const currentRatings = getCurrentRatings();
      // Pass the current ratings to onComplete
      if (currentRatings && Object.keys(currentRatings).length > 0) {
        await onComplete(currentRatings);
      } else {
        console.error('No ratings available to end tournament');
      }
    } catch (error) {
      console.error('Error ending tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [getCurrentRatings, onComplete]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  useEffect(() => {
    if (selectedOption) {
      // Add RGB shift effect when a selection is made
      const nameCard = document.querySelector(`.name-container.${selectedOption} .name-card`);
      if (nameCard && window.vfx) {
        window.vfx.add(nameCard, { shader: "rgbShift", intensity: 0.5 });
        setTimeout(() => {
          window.vfx.remove(nameCard);
        }, 500);
      }
      const timer = setTimeout(() => setSelectedOption(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedOption]);

  useEffect(() => {
    // Add glitch effect to VS text
    const vsText = document.querySelector('.vs-text');
    if (vsText && window.vfx) {
      window.vfx.add(vsText, { shader: "glitch", intensity: 0.3 });
    }
    return () => {
      if (vsText && window.vfx) {
        window.vfx.remove(vsText);
      }
    };
  }, []);

  useEffect(() => {
    // Add wave effect to progress info
    const progressInfo = document.querySelector('.progress-info');
    if (progressInfo && window.vfx) {
      window.vfx.add(progressInfo, { shader: "wave", frequency: 3, amplitude: 0.02 });
    }
    return () => {
      if (progressInfo && window.vfx) {
        window.vfx.remove(progressInfo);
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup function
    return () => {
      setSelectedOption(null);
      setIsProcessing(false);
    };
  }, []);

  useKeyboardControls({
    onLeft: () => !isProcessing && !isTransitioning && handleVoteWithAnimation('left'),
    onRight: () => !isProcessing && !isTransitioning && handleVoteWithAnimation('right'),
    onBoth: () => !isProcessing && !isTransitioning && handleVoteWithAnimation('both'),
    onNone: () => !isProcessing && !isTransitioning && handleVoteWithAnimation('none'),
    isDisabled: isProcessing || isTransitioning
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

      <TournamentControls 
        onEndEarly={handleEndEarly} 
        isTransitioning={isTransitioning || isProcessing}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      <div className="tournament-layout">
        <div className="matchup" role="region" aria-label="Current matchup">
          <div className="names-row">
            <div className="name-container left">
              <NameCard
                name={currentMatch.left.name}
                description={currentMatch.left.description}
                isSelected={selectedOption === 'left'}
                onClick={() => !isProcessing && !isTransitioning && handleVoteWithAnimation('left')}
                disabled={isProcessing || isTransitioning}
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
                onClick={() => !isProcessing && !isTransitioning && handleVoteWithAnimation('right')}
                disabled={isProcessing || isTransitioning}
                shortcutHint="Press → arrow key"
                size="large"
                aria-label={`Right option: ${currentMatch.right.name}`}
              />
            </div>
          </div>

          <div className="center-options" role="group" aria-label="Additional voting options">
            <button
              className={`extra-options-button ${selectedOption === 'both' ? 'selected' : ''}`}
              onClick={() => !isProcessing && !isTransitioning && handleVoteWithAnimation('both')}
              disabled={isProcessing || isTransitioning}
              aria-label="Like both names"
            >
              Like Both
            </button>
            <button
              className={`extra-options-button ${selectedOption === 'none' ? 'selected' : ''}`}
              onClick={() => !isProcessing && !isTransitioning && handleVoteWithAnimation('none')}
              disabled={isProcessing || isTransitioning}
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

        <div className="bracket-view">
          <Bracket matches={matchHistory} />
        </div>
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