/**
 * @module Results
 * @description Main results component that displays the final rankings of cat names.
 * Shows the tournament results with ratings and provides option to restart.
 * 
 * @example
 * <Results 
 *   ratings={{ "Whiskers": 1450, "Mittens": 1380 }}
 *   onRestart={() => handleRestart()}
 * />
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.ratings - Object mapping cat names to their Elo ratings
 * @param {Function} props.onRestart - Callback function to restart the tournament
 * @returns {JSX.Element} Results view with rankings and restart option
 */

import React, { useState, useEffect } from 'react';
import ResultsTable from './ResultsTable';
import RankingAdjustment from '../RankingAdjustment/RankingAdjustment';
import './Results.css';

function Results({ ratings, onStartNew, userName, onUpdateRatings, currentTournamentNames }) {
  const [currentRankings, setCurrentRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Process and sort rankings on mount
    const processedRankings = Object.entries(ratings || {})
      .map(([name, rating]) => ({
        name,
        rating: Math.round(typeof rating === 'number' ? rating : 1500),
        change: 0 // Track rating changes
      }))
      .sort((a, b) => b.rating - a.rating);

    setCurrentRankings(processedRankings);
    setIsLoading(false);
  }, [ratings]);

  const handleSaveAdjustments = async (adjustedRankings) => {
    try {
      setIsLoading(true);
      
      // Calculate rating changes
      const updatedRankings = adjustedRankings.map(ranking => {
        const oldRanking = currentRankings.find(r => r.name === ranking.name);
        return {
          ...ranking,
          change: oldRanking ? ranking.rating - oldRanking.rating : 0
        };
      });

      // Convert to expected format for API
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
      
      // Show success toast
      setToastMessage('Rankings updated successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to update rankings:', error);
      setToastMessage('Failed to update rankings. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner" />
        <p>Processing rankings...</p>
      </div>
    );
  }

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
          <div className="stat-card">
            <h3>Total Names</h3>
            <div className="stat-value">{currentRankings.length}</div>
          </div>
        </div>

        <RankingAdjustment
          rankings={currentRankings}
          onSave={handleSaveAdjustments}
          onCancel={() => {}} // Empty function since we're not using cancel anymore
        />

        <div className="results-actions">
          <button 
            onClick={onStartNew} 
            className="primary-button start-new-button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Start New Tournament
          </button>
          <p className="results-tip">
            Starting a new tournament will let you rate more names while keeping your current rankings.
          </p>
        </div>
      </div>

      {showToast && (
        <div className={`toast ${toastMessage.includes('Failed') ? 'error' : 'success'}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Results;
