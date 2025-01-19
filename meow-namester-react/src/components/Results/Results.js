/**
 * @module Results
 * @description Main results component that displays the final rankings of cat names.
 * Shows the tournament results with ratings and provides option to restart.
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import ResultsTable from './ResultsTable';
import RankingAdjustment from '../RankingAdjustment/RankingAdjustment';
import Bracket from '../Bracket/Bracket';
import './Results.css';

// Memoized stats card component for better performance
const StatsCard = memo(({ title, value }) => (
  <div className="stat-card" role="status" aria-label={`${title}: ${value}`}>
    <h3>{title}</h3>
    <div className="stat-value">{value}</div>
  </div>
));

// Toast component extracted for reusability
const Toast = memo(({ message, type, onClose }) => (
  <div 
    role="alert"
    className={`toast ${type}`}
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
    
    return voteHistory.map((vote, index) => ({
      id: index + 1,
      name1: vote.match.left.name,
      name2: vote.match.right.name,
      winner: vote.result < 0 ? -1 : vote.result > 0 ? 1 : 0
    }));
  }, [voteHistory]);

  // Memoized rankings processor
  const processRankings = useCallback((ratingsData) => {
    return Object.entries(ratingsData || {})
      .map(([name, rating]) => ({
        name,
        rating: Math.round(typeof rating === 'number' ? rating : 1500),
        change: 0
      }))
      .sort((a, b) => b.rating - a.rating);
  }, []);

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
          name_id: existingRating?.name_id,
          name: name,
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

  if (isLoading) {
    return (
      <div className="results-loading" role="status" aria-label="Loading rankings">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Processing rankings...</p>
      </div>
    );
  }

  const bracketMatches = getBracketMatches();

  return (
    <div className="results-container">
      <header className="results-header">
        <h2>Name Rankings</h2>
        <p className="results-welcome">
          Welcome back, <span className="user-name">{userName}</span>! 
          Here are your latest name rankings.
        </p>
      </header>

      <div className="results-content">
        <div className="rankings-stats">
          <StatsCard 
            title="Total Names" 
            value={currentRankings.length} 
          />
        </div>

        {bracketMatches.length > 0 && (
          <div className="tournament-bracket">
            <h3>Tournament Bracket</h3>
            <Bracket matches={bracketMatches} />
          </div>
        )}

        <RankingAdjustment
          rankings={currentRankings}
          onSave={handleSaveAdjustments}
          onCancel={onStartNew}
        />

        <div className="results-actions">
          <button 
            onClick={onStartNew} 
            className="primary-button start-new-button"
            aria-label="Start new tournament"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none"
              aria-hidden="true"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            Start New Tournament
          </button>
          <p className="results-tip" role="note">
            Starting a new tournament will let you rate more names while keeping your current rankings.
          </p>
        </div>
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
