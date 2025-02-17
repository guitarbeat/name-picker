/**
 * @module Tournament
 * @description A React component that handles the tournament-style voting interface for cat names.
 * Provides a UI for comparing two names, with options for liking both or neither.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
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
  const [isRandomizing, setIsRandomizing] = useState(false);
  const tournamentStateRef = useRef({ isActive: false });

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
    getCurrentRatings,
    isError
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
  const [lastMatchResult, setLastMatchResult] = useState(null);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [showBracket, setShowBracket] = useState(false);

  const musicTracks = [
    { path: '/sounds/AdhesiveWombat - Night Shade.mp3', name: 'Night Shade' },
    { path: '/sounds/MiseryBusiness.mp3', name: 'Misery Business' },
    { path: '/sounds/what-is-love.mp3', name: 'What is Love' },
    { path: '/sounds/Lemon Demon - The Ultimate Showdown (8-Bit Remix).mp3', name: 'Ultimate Showdown (8-Bit)' },
    { path: '/sounds/Main Menu 1 (Ruins).mp3', name: 'Ruins' }
  ];

  // Sound effects configuration with updated weights
  const soundEffects = [
    { path: '/sounds/gameboy-pluck.mp3', weight: 0.5 },
    { path: '/sounds/wow.mp3', weight: 0.2 },
    { path: '/sounds/surprise.mp3', weight: 0.1 },
    { path: '/sounds/level-up.mp3', weight: 0.2 },
  ];

  // Initialize audio only once
  useEffect(() => {
    audioRef.current = new Audio(soundEffects[0].path);
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

  // Function to pick a random sound effect based on weights
  const getRandomSoundEffect = useCallback(() => {
    const totalWeight = soundEffects.reduce((sum, effect) => sum + effect.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const effect of soundEffects) {
      if (random < effect.weight) {
        return effect.path;
      }
      random -= effect.weight;
    }
    
    return soundEffects[0].path; // Fallback to default sound
  }, []);

  const playSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      const soundEffect = getRandomSoundEffect();
      audioRef.current.src = soundEffect;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume.effects;
      audioRef.current.play().catch(error => {
        console.error('Error playing sound effect:', error);
      });
    }
  }, [isMuted, volume.effects, getRandomSoundEffect]);

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

  // Reset state when error occurs
  useEffect(() => {
    if (isError) {
      setSelectedOption(null);
      setIsTransitioning(false);
      setIsProcessing(false);
      setIsRandomizing(false);
      tournamentStateRef.current.isActive = false;
    }
  }, [isError]);

  // Track tournament state
  useEffect(() => {
    if (currentMatch) {
      tournamentStateRef.current.isActive = true;
    }
  }, [currentMatch]);

  const handleRandomize = useCallback(() => {
    if (!isTransitioning && !isProcessing && !isRandomizing && Array.isArray(names) && names.length > 0) {
      // Prevent randomization during active tournament
      if (tournamentStateRef.current.isActive) {
        console.warn('Cannot randomize during active tournament');
        return;
      }

      setIsRandomizing(true);
      setIsTransitioning(true);
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setRandomizedNames(shuffleArray([...names]));
        setIsRandomizing(false);
        setIsTransitioning(false);
      }, 500);
    }
  }, [names, isTransitioning, isProcessing, isRandomizing]);

  // Track match results and tournament progress
  const updateMatchResult = useCallback((option) => {
    let resultMessage = '';
    if (option === 'both') {
      resultMessage = `Both "${currentMatch.left.name}" and "${currentMatch.right.name}" advance!`;
    } else if (option === 'left') {
      resultMessage = `"${currentMatch.left.name}" wins this round!`;
    } else if (option === 'right') {
      resultMessage = `"${currentMatch.right.name}" wins this round!`;
    } else if (option === 'neither') {
      resultMessage = 'Match skipped';
    }

    setLastMatchResult(resultMessage);
    
    // Show result after a short delay
    setTimeout(() => setShowMatchResult(true), 500);
    // Hide result after 2 seconds
    setTimeout(() => setShowMatchResult(false), 2500);
  }, [currentMatch]);

  const handleVoteWithAnimation = async (option) => {
    if (isProcessing || isTransitioning || isError) {
      console.log('Vote blocked:', { isProcessing, isTransitioning, isError });
      return;
    }
    
    try {
      setIsProcessing(true);
      setIsTransitioning(true);
      
      // Play sound effect for selection
      if (audioRef.current && !isMuted) {
        playSound();
      }

      // Update match result
      updateMatchResult(option);
      
      // Handle the vote and get updated ratings
      const updatedRatings = await handleVote(option);
      
      // Convert option to vote data for parent component
      if (onVote && currentMatch) {
        const leftName = currentMatch.left.name;
        const rightName = currentMatch.right.name;
        
        // Determine winners and losers based on the option
        let leftWon = false;
        let rightWon = false;
        
        switch (option) {
          case 'left':
            leftWon = true;
            break;
          case 'right':
            rightWon = true;
            break;
          case 'both':
            leftWon = true;
            rightWon = true;
            break;
          // 'neither' case doesn't affect wins/losses
        }
        
        const voteData = {
          match: {
            left: {
              name: leftName,
              description: currentMatch.left.description || '',
              won: leftWon
            },
            right: {
              name: rightName,
              description: currentMatch.right.description || '',
              won: rightWon
            }
          },
          result: option === 'left' ? -1 : option === 'right' ? 1 : 0,
          ratings: updatedRatings
        };
        
        onVote(voteData);
      }

      setSelectedOption(null);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setIsProcessing(false);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsTransitioning(false);
    } catch (error) {
      console.error('Error handling vote:', error);
      setIsProcessing(false);
      setIsTransitioning(false);
    }
  };

  // Separate click handler for name cards
  const handleNameCardClick = (option) => {
    if (isProcessing || isTransitioning) return;
    
    // Set the selected option first
    setSelectedOption(option);
    
    // Then trigger the vote
    handleVoteWithAnimation(option);
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

  // Add keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isProcessing || isTransitioning) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          setSelectedOption('left');
          if (audioRef.current && !isMuted) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
          break;
        case 'ArrowRight':
          setSelectedOption('right');
          if (audioRef.current && !isMuted) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
          break;
        case ' ':
          if (selectedOption) {
            handleVoteWithAnimation(selectedOption);
          }
          break;
        case 'ArrowUp':
          handleVoteWithAnimation('both');
          break;
        case 'ArrowDown':
          handleVoteWithAnimation('neither');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, isProcessing, isTransitioning]);

  // Match result component
  const MatchResult = () => {
    if (!showMatchResult || !lastMatchResult) return null;

    return (
      <div 
        className={styles.matchResult}
        role="status"
        aria-live="polite"
      >
        <div className={styles.resultContent}>
          <span className={styles.resultMessage}>{lastMatchResult}</span>
          <span className={styles.tournamentProgress}>
            Round {roundNumber} - Match {currentMatchNumber} of {totalMatches}
          </span>
        </div>
      </div>
    );
  };

  const handleVolumeChange = useCallback((type, value) => {
    setVolume(prev => {
      const newVolume = { ...prev, [type]: value };
      if (audioRef.current && type === 'effects') {
        audioRef.current.volume = value;
      }
      if (musicRef.current && type === 'music') {
        musicRef.current.volume = value;
      }
      return newVolume;
    });
  }, []);

  // Transform match history for the Bracket component
  const transformedMatches = useMemo(() => {
    console.log('Raw match history:', matchHistory);
    return matchHistory.map((vote, index) => {
      // Convert numeric result to winner format
      let winner;
      if (vote.result < -0.1) winner = -1;      // left won
      else if (vote.result > 0.1) winner = 1;   // right won
      else if (Math.abs(vote.result) <= 0.1) winner = 0;  // both or neither
      else winner = 2; // skip

      const match = {
        id: index + 1,
        name1: vote.match.left.name,
        name2: vote.match.right.name,
        winner
      };
      console.log('Transformed match:', match);
      return match;
    });
  }, [matchHistory]);

  // Add debug log when bracket is shown
  useEffect(() => {
    if (showBracket) {
      console.log('Showing bracket with matches:', transformedMatches);
    }
  }, [showBracket, transformedMatches]);

  // Add error UI
  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <h3>Tournament Error</h3>
        <p>There was an error with the tournament. Please try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.retryButton}
        >
          Restart Tournament
        </button>
      </div>
    );
  }

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
        volume={volume}
        onVolumeChange={handleVolumeChange}
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
                onClick={() => handleNameCardClick('left')}
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
                onClick={() => handleNameCardClick('right')}
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
              type="button"
            >
              I Like Both! <span className={styles.shortcutHint}>(↑ Up)</span>
            </button>
            
            <button
              className={`${styles.extraOptionsButton} ${selectedOption === 'neither' ? styles.selected : ''}`}
              onClick={() => handleVoteWithAnimation('neither')}
              disabled={isProcessing || isTransitioning}
              aria-pressed={selectedOption === 'neither'}
              type="button"
            >
              Skip <span className={styles.shortcutHint}>(↓ Down)</span>
            </button>
          </div>
        </div>

        <button
          className={styles.bracketToggle}
          onClick={() => setShowBracket(!showBracket)}
          aria-expanded={showBracket}
          aria-controls="bracketView"
        >
          {showBracket ? 'Hide Tournament History' : 'Show Tournament History'} 
          <span className={styles.bracketToggleIcon}>
            {showBracket ? '▼' : '▶'}
          </span>
        </button>

        {showBracket && (
          <div 
            id="bracketView"
            className={styles.bracketView}
            role="complementary"
            aria-label="Tournament bracket history"
          >
            <Bracket matches={transformedMatches} />
          </div>
        )}
      </div>

      {/* Replace name insight with match result */}
      <MatchResult />
    </div>
  );
}

const MusicControls = memo(({ isMusicPlaying, volume, onVolumeChange, onToggleMusic, currentTrack }) => {
  const [isMinimized, setIsMinimized] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMinimized(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`${styles.musicControls} ${isMinimized ? styles.minimized : ''}`}>
      <button 
        className={styles.musicToggle}
        onClick={onToggleMusic}
        aria-label={isMusicPlaying ? 'Pause music' : 'Play music'}
      >
        {isMusicPlaying ? '⏸️' : '▶️'}
      </button>

      {!isMinimized && (
        <>
          <div className={styles.volumeControls}>
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={onVolumeChange}
              className={styles.volumeSlider}
              aria-label="Volume control"
            />
          </div>

          <div className={styles.trackInfo}>
            <span>🎵</span>
            <span>{currentTrack}</span>
          </div>
        </>
      )}

      <button
        className={styles.minimizeButton}
        onClick={() => setIsMinimized(!isMinimized)}
        aria-label={isMinimized ? 'Expand music controls' : 'Minimize music controls'}
      >
        {isMinimized ? '▲' : '▼'}
      </button>
    </div>
  );
});

function Tournament(props) {
  return (
    <ErrorBoundary>
      <TournamentContent {...props} />
    </ErrorBoundary>
  );
}

export default Tournament; 