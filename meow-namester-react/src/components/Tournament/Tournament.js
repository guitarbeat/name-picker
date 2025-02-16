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
import TournamentControls from './TournamentControls';
import styles from './Tournament.module.css';
import { shuffleArray } from '../../utils/arrayUtils';

function TournamentContent({ onComplete, existingRatings = {}, names = [], userName, onVote }) {
  const [randomizedNames, setRandomizedNames] = useState([]);

  useEffect(() => {
    if (Array.isArray(names) && names.length > 0) {
      setRandomizedNames(shuffleArray([...names]));
    }
  }, [names]);

  const {
    currentMatch,
    handleVote,
    progress,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    matchHistory = [],
    getCurrentRatings
  } = useTournament({ 
    names: randomizedNames.length > 0 ? randomizedNames : names,
    existingRatings, 
    onComplete 
  });

  const [selectedOption, setSelectedOption] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState({ music: 0.2, effects: 0.3 });
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);
  const musicRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const musicTracks = [
    { path: '/sounds/AdhesiveWombat - Night Shade.mp3', name: 'Night Shade' },
    { path: '/sounds/MiseryBusiness.mp3', name: 'Misery Business' },
    { path: '/sounds/what-is-love.mp3', name: 'What is Love' }
  ];

  // Initialize audio only once
  useEffect(() => {
    audioRef.current = new Audio('/sounds/gameboy-pluck.mp3');
    audioRef.current.volume = volume.effects;
    
    musicRef.current = new Audio(musicTracks[0].path);
    musicRef.current.volume = volume.music;
    musicRef.current.loop = true;

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    const playNewTrack = async () => {
      try {
        if (musicRef.current) {
          musicRef.current.pause();
          musicRef.current.src = musicTracks[currentTrack].path;
          musicRef.current.volume = volume.music;
          musicRef.current.loop = true;
          
          if (!isMuted) {
            await musicRef.current.play();
          }
        }
        setAudioError(null);
      } catch (error) {
        console.error('Error playing audio:', error);
        setAudioError('Unable to play background music. Click to try again.');
      }
    };

    playNewTrack();
  }, [currentTrack, isMuted, volume.music]);

  const playSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume.effects;
      audioRef.current.play().catch(error => {
        console.error('Error playing sound effect:', error);
      });
    }
  }, [isMuted, volume.effects]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      try {
        if (newMuted) {
          if (musicRef.current) musicRef.current.pause();
          if (audioRef.current) audioRef.current.pause();
        } else if (musicRef.current) {
          musicRef.current.play().catch(() => {
            setAudioError('Unable to play audio. Click to try again.');
          });
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
      return newMuted;
    });
  }, []);

  const handleNextTrack = useCallback(() => {
    setCurrentTrack(prev => (prev + 1) % musicTracks.length);
  }, []);

  const retryAudio = useCallback(() => {
    if (audioError && !isMuted && musicRef.current) {
      musicRef.current.play()
        .then(() => setAudioError(null))
        .catch(error => {
          console.error('Error retrying audio:', error);
          setAudioError('Unable to play audio. Click to try again.');
        });
    }
  }, [audioError, isMuted]);

  const handleVoteWithAnimation = async (option) => {
    if (isProcessing || isTransitioning) return;
    
    setIsProcessing(true);
    setSelectedOption(option);
    playSound();
    setIsTransitioning(true);
    
    try {
      // Convert option to numeric value for the vote
      let voteValue;
      switch (option) {
        case 'left':
          voteValue = -1;
          break;
        case 'right':
          voteValue = 1;
          break;
        case 'both':
          voteValue = 0;
          break;
        case 'none':
          voteValue = 0;
          break;
        default:
          voteValue = 0;
      }
      
      // Create vote data
      const voteData = {
        matchNumber: currentMatchNumber,
        result: voteValue,
        timestamp: Date.now(),
        match: {
          left: { ...currentMatch.left },
          right: { ...currentMatch.right }
        }
      };

      // Call onVote if provided
      if (onVote) {
        await onVote(voteData);
      }

      await handleVote(option);
    } catch (error) {
      console.error('Error processing vote:', error);
    } finally {
      setSelectedOption(null);
      setIsTransitioning(false);
      setIsProcessing(false);
    }
  };

  const handleEndEarly = useCallback(async () => {
    try {
      setIsProcessing(true);
      const currentRatings = getCurrentRatings();
      if (currentRatings && Object.keys(currentRatings).length > 0) {
        await onComplete(currentRatings);
      }
    } catch (error) {
      console.error('Error ending tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [getCurrentRatings, onComplete]);

  const handleRandomize = useCallback(() => {
    if (!isTransitioning && !isProcessing && Array.isArray(names) && names.length > 0) {
      setIsTransitioning(true);
      setRandomizedNames(shuffleArray([...names]));
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [names, isTransitioning, isProcessing]);

  useKeyboardControls({
    ArrowLeft: () => handleVoteWithAnimation('left'),
    ArrowRight: () => handleVoteWithAnimation('right'),
    Space: () => handleVoteWithAnimation('both'),
    Escape: () => handleVoteWithAnimation('none'),
  }, !isProcessing && !isTransitioning);

  if (!currentMatch) {
    return <LoadingSpinner />;
  }

  return (
    <div 
      className={styles.tournament} 
      role="main"
      aria-live="polite"
    >
      <div 
        className={styles.progressInfo} 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.roundInfo}>
          <span className={styles.roundNumber}>Round {roundNumber}</span>
          <span className={styles.matchCount}>Match {currentMatchNumber} of {totalMatches}</span>
        </div>
        <div 
          className={styles.percentageInfo} 
          aria-label={`Tournament is ${progress}% complete`}
        >
          {progress}% Complete
        </div>
      </div>

      <TournamentControls 
        onEndEarly={handleEndEarly} 
        isTransitioning={isTransitioning || isProcessing}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNextTrack={handleNextTrack}
        currentTrack={currentTrack}
        trackInfo={musicTracks[currentTrack]}
        audioError={audioError}
        onRetryAudio={retryAudio}
        onRandomize={handleRandomize}
      />

      <div className={styles.tournamentLayout}>
        <div 
          className={styles.matchup} 
          role="region" 
          aria-label="Current matchup"
          aria-busy={isTransitioning || isProcessing}
        >
          <div className={styles.namesRow}>
            <div 
              className={`${styles.nameContainer} ${selectedOption === 'left' ? styles.selected : ''}`}
              role="group"
              aria-label="Left name option"
            >
              <NameCard
                name={currentMatch.left.name}
                description={currentMatch.left.description}
                onClick={() => handleVoteWithAnimation('left')}
                selected={selectedOption === 'left'}
                disabled={isProcessing || isTransitioning}
                shortcutHint="Press ← arrow key"
                size="large"
              />
            </div>

            <div 
              className={styles.vsSection}
              aria-hidden="true"
            >
              <span className={styles.vsText}>vs</span>
            </div>

            <div 
              className={`${styles.nameContainer} ${selectedOption === 'right' ? styles.selected : ''}`}
              role="group"
              aria-label="Right name option"
            >
              <NameCard
                name={currentMatch.right.name}
                description={currentMatch.right.description}
                onClick={() => handleVoteWithAnimation('right')}
                selected={selectedOption === 'right'}
                disabled={isProcessing || isTransitioning}
                shortcutHint="Press → arrow key"
                size="large"
              />
            </div>
          </div>

          <div 
            className={styles.extraOptions}
            role="group"
            aria-label="Additional voting options"
          >
            <button
              className={`${styles.extraOptionsButton} ${selectedOption === 'both' ? styles.selected : ''}`}
              onClick={() => handleVoteWithAnimation('both')}
              disabled={isProcessing || isTransitioning}
              aria-pressed={selectedOption === 'both'}
            >
              I Like Both! <span className={styles.shortcutHint}>(Space)</span>
            </button>
            
            <button
              className={`${styles.extraOptionsButton} ${selectedOption === 'none' ? styles.selected : ''}`}
              onClick={() => handleVoteWithAnimation('none')}
              disabled={isProcessing || isTransitioning}
              aria-pressed={selectedOption === 'none'}
            >
              Skip <span className={styles.shortcutHint}>(Esc)</span>
            </button>
          </div>
        </div>

        <div 
          className={styles.bracketView}
          role="complementary"
          aria-label="Tournament bracket history"
        >
          <Bracket matches={matchHistory || []} />
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