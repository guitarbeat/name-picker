import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Card } from '../ui/Card/Card';
import { Button } from '../ui/Button/Button';
import type { Match, MatchResult } from '../../types/tournament';
import styles from './Tournament.module.scss';

interface TournamentProps {
  currentMatch: Match;
  onVote: (result: MatchResult) => void;
  showTimer?: boolean;
  autoAdvance?: boolean;
  roundNumber?: number;
  totalMatches?: number;
  currentMatchNumber?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function Tournament({ 
  currentMatch, 
  onVote, 
  showTimer = false,
  autoAdvance = false,
  roundNumber = 1,
  totalMatches = 1,
  currentMatchNumber = 1,
  onNavigate,
}: TournamentProps) {
  const [startTime] = React.useState(Date.now());
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lastVoteTimeRef = useRef(0);
  const voteTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!showTimer) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, showTimer]);

  // Reset transition state when match changes
  useEffect(() => {
    setIsTransitioning(false);
  }, [currentMatch.id]);

  // Cleanup timeouts on unmount or match change
  useEffect(() => {
    return () => {
      if (voteTimeoutRef.current) {
        clearTimeout(voteTimeoutRef.current);
      }
    };
  }, [currentMatch.id]);

  const handleVote = useCallback((result: MatchResult) => {
    const now = Date.now();
    // Prevent rapid voting and voting during transitions
    if (isTransitioning || now - lastVoteTimeRef.current < 500) {
      return;
    }

    // Clear any existing timeout
    if (voteTimeoutRef.current) {
      clearTimeout(voteTimeoutRef.current);
    }

    setIsTransitioning(true);
    lastVoteTimeRef.current = now;
    onVote(result);

    // Set up the transition timeout
    voteTimeoutRef.current = setTimeout(() => {
      if (autoAdvance && currentMatchNumber < totalMatches) {
        onNavigate?.('next');
      }
      setIsTransitioning(false);
    }, 500);
  }, [onVote, isTransitioning, autoAdvance, currentMatchNumber, totalMatches, onNavigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.tournament}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {showTimer && (
            <div className={styles.timer}>
              Time: {formatTime(elapsedTime)}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="small"
          onClick={() => setShowMenu(!showMenu)}
          className={styles.menuButton}
        >
          {showMenu ? 'Hide Progress' : 'Show Progress'}
        </Button>
      </div>

      {showMenu && (
        <Card className={styles.menu}>
          <h3>Tournament Progress</h3>
          <div className={styles.progress}>
            <div className={styles.progressInfo}>
              <div className={styles.roundInfo}>
                <span className={styles.roundNumber}>Round {roundNumber}</span>
                <span className={styles.matchCount}>Match {currentMatchNumber} of {totalMatches}</span>
              </div>
              <div className={styles.percentageInfo}>
                {Math.round((currentMatchNumber / totalMatches) * 100)}% Complete
              </div>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${(currentMatchNumber / totalMatches) * 100}%`,
                  backgroundColor: roundNumber > 1 ? 'var(--primary-dark)' : 'var(--primary)',
                }} 
              />
            </div>
          </div>
        </Card>
      )}

      <div className={styles.matchup}>
        <div className={styles.nameContainer}>
          <Card
            variant={currentMatch.winner === -1 ? 'winner' : currentMatch.winner === 1 ? 'loser' : 'default'}
            className={`${styles.nameCard} ${isTransitioning ? styles.transitioning : ''}`}
            onClick={() => !isTransitioning && handleVote(-1)}
            isClickable={!isTransitioning}
          >
            <h3>{currentMatch.name1}</h3>
          </Card>

          <div className={styles.vsSection}>
            <div className={styles.vsText}>vs</div>
            <div className={styles.extraOptions}>
              <Button
                variant="outline"
                size="small"
                onClick={() => !isTransitioning && handleVote(0)}
                className={currentMatch.winner === 0 ? styles.selected : ''}
                disabled={isTransitioning}
              >
                Like Both
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => !isTransitioning && handleVote(2)}
                className={currentMatch.winner === 2 ? styles.selected : ''}
                disabled={isTransitioning}
              >
                No Opinion
              </Button>
            </div>
          </div>

          {currentMatch.name2 ? (
            <Card
              variant={currentMatch.winner === 1 ? 'winner' : currentMatch.winner === -1 ? 'loser' : 'default'}
              className={`${styles.nameCard} ${isTransitioning ? styles.transitioning : ''}`}
              onClick={() => !isTransitioning && handleVote(1)}
              isClickable={!isTransitioning}
            >
              <h3>{currentMatch.name2}</h3>
            </Card>
          ) : (
            <Card 
              variant="default" 
              className={`${styles.nameCard} ${styles.bye} ${isTransitioning ? styles.transitioning : ''}`}
            >
              <h3 className={styles.bye}>Bye</h3>
            </Card>
          )}
        </div>
      </div>

      <div className={styles.instructions}>
        <p>Click on a name to choose it, or select an option below</p>
        <div className={styles.legend}>
          <span>First Name: 2 points</span>
          <span>Second Name: 2 points</span>
          <span>Like Both: 1 point each</span>
          <span>No Opinion: 0 points</span>
        </div>
      </div>

      <div className={styles.navigationButtons}>
        <Button
          variant="outline"
          size="small"
          onClick={() => onNavigate?.('prev')}
          disabled={currentMatchNumber <= 1 || isTransitioning}
        >
          Previous
        </Button>
        {!autoAdvance && (
          <Button
            variant="primary"
            size="small"
            onClick={() => onNavigate?.('next')}
            disabled={currentMatchNumber >= totalMatches || isTransitioning}
          >
            Next Match
          </Button>
        )}
      </div>
    </div>
  );
} 