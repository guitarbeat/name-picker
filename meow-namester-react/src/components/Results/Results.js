/**
 * @module Results
 * @description Main results component that displays the final rankings of cat names.
 * Shows the tournament results with ratings and provides option to restart.
 */

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import ResultsTable from './ResultsTable';
import RankingAdjustment from '../RankingAdjustment/RankingAdjustment';
import Bracket from '../Bracket/Bracket';
import styles from './Results.module.css';

// Memoized stats card component for better performance
const StatsCard = memo(({ title, value }) => (
  <div className={styles.statCard} role="status" aria-label={`${title}: ${value}`}>
    <h3>{title}</h3>
    <div className={styles.statValue}>{value}</div>
  </div>
));

// Toast component extracted for reusability
const Toast = memo(({ message, type, onClose }) => (
  <div 
    role="alert"
    className={type === 'success' ? styles.toastSuccess : styles.toastError}
    onClick={onClose}
  >
    {message}
  </div>
));

function Results({ ratings, onStartNew, userName, onUpdateRatings, currentTournamentNames, voteHistory }) {
  const [currentRankings, setCurrentRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Convert vote history to bracket matches
  const getBracketMatches = useCallback(() => {
    if (!voteHistory || !voteHistory.length) return [];
    
    // Filter to only include matches from the current tournament
    const tournamentNameSet = new Set(currentTournamentNames?.map(n => n.name) || []);
    
    return voteHistory
      .filter(vote => 
        tournamentNameSet.has(vote.match.left.name) && 
        tournamentNameSet.has(vote.match.right.name)
      )
      .map((vote, index) => ({
        id: index + 1,
        name1: vote.match.left.name,
        name2: vote.match.right.name,
        winner: vote.result < 0 ? -1 : vote.result > 0 ? 1 : 0
      }));
  }, [voteHistory, currentTournamentNames]);

  // Memoized rankings processor
  const processRankings = useCallback((ratingsData) => {
    // Filter to only include names from the current tournament
    const tournamentNameSet = new Set(currentTournamentNames?.map(n => n.name) || []);
    
    return Object.entries(ratingsData || {})
      .filter(([name]) => tournamentNameSet.has(name))
      .map(([name, rating]) => ({
        name,
        rating: Math.round(typeof rating === 'number' ? rating : rating?.rating || 1500),
        wins: typeof rating === 'object' ? rating.wins || 0 : 0,
        losses: typeof rating === 'object' ? rating.losses || 0 : 0,
        change: 0
      }))
      .sort((a, b) => b.rating - a.rating);
  }, [currentTournamentNames]);

  useEffect(() => {
    try {
      const processedRankings = processRankings(ratings);
      setCurrentRankings(processedRankings);
    } catch (error) {
      console.error('Error processing rankings:', error);
      setToast({
        show: true,
        message: 'Error processing rankings data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [ratings, processRankings]);

  const handleSaveAdjustments = useCallback(async (adjustedRankings) => {
    try {
      setIsLoading(true);
      
      const updatedRankings = adjustedRankings.map(ranking => {
        const oldRanking = currentRankings.find(r => r.name === ranking.name);
        return {
          ...ranking,
          change: oldRanking ? ranking.rating - oldRanking.rating : 0
        };
      });

      const newRatings = updatedRankings.map(({ name, rating }) => {
        const existingRating = ratings[name];
        return {
          name,
          rating: Math.round(rating),
          wins: existingRating?.wins || 0,
          losses: existingRating?.losses || 0
        };
      });

      await onUpdateRatings(newRatings);
      setCurrentRankings(updatedRankings);
      
      setToast({
        show: true,
        message: 'Rankings updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to update rankings:', error);
      setToast({
        show: true,
        message: 'Failed to update rankings. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentRankings, ratings, onUpdateRatings]);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(closeToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, closeToast]);

  useEffect(() => {
    // Add cool effects to the results header
    const header = document.querySelector('.results-header');
    if (header && window.vfx) {
      window.vfx.add(header, { shader: "wave", frequency: 2, amplitude: 0.01 });
    }

    // Add glitch effect to stats cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      if (window.vfx) {
        window.vfx.add(card, { shader: "glitch", intensity: 0.2 });
      }
    });

    // Add RGB shift to the tournament bracket
    const bracket = document.querySelector('.tournament-bracket');
    if (bracket && window.vfx) {
      window.vfx.add(bracket, { shader: "rgbShift", intensity: 0.3 });
    }

    return () => {
      if (window.vfx) {
        if (header) window.vfx.remove(header);
        statCards.forEach(card => window.vfx.remove(card));
        if (bracket) window.vfx.remove(bracket);
      }
    };
  }, []);

  // Memoize processed rankings
  const processedRankings = useMemo(() => 
    processRankings(ratings), [ratings]
  );

  // Optimize vfx.js usage
  useEffect(() => {
    const vfxElements = [];
    
    const addVfx = (selector, config) => {
      const el = document.querySelector(selector);
      if (el && window.vfx) {
        window.vfx.add(el, config);
        vfxElements.push(el);
      }
    };

    addVfx('.results-header', { shader: "wave", frequency: 2, amplitude: 0.01 });
    addVfx('.stat-card', { shader: "glitch", intensity: 0.2 });
    addVfx('.tournament-bracket', { shader: "rgbShift", intensity: 0.3 });

    return () => {
      vfxElements.forEach(el => window.vfx?.remove(el));
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading rankings">
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <p>Processing rankings...</p>
      </div>
    );
  }

  const bracketMatches = getBracketMatches();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Name Rankings</h2>
        <p className={styles.welcome}>
          Welcome back, <span className={styles.userName}>{userName}</span>! 
          Here are your latest name rankings.
        </p>
      </header>

      <div className={styles.content}>
        <div className={styles.statsGrid}>
          <StatsCard 
            title="Total Names" 
            value={currentRankings.length} 
          />
        </div>

        <RankingAdjustment
          rankings={currentRankings}
          onSave={handleSaveAdjustments}
          onCancel={onStartNew}
        />

        <div className={styles.actions}>
          <button 
            onClick={onStartNew} 
            className={styles.startNewButton}
            aria-label="Start new tournament"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none"
              className={styles.buttonIcon}
              aria-hidden="true"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            Start New Tournament
          </button>
          <p className={styles.tip} role="note">
            Starting a new tournament will let you rate more names while keeping your current rankings.
          </p>
        </div>

        {bracketMatches.length > 0 && (
          <div className={styles.tournamentBracket}>
            <h3>Tournament Bracket</h3>
            <Bracket matches={bracketMatches} />
          </div>
        )}
      </div>

      {toast.show && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default memo(Results);
