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

import React, { useState } from 'react';
import ResultsTable from './ResultsTable';
import RankingAdjustment from '../RankingAdjustment/RankingAdjustment';
import './Results.css';

function Results({ ratings, onStartNew, userName, onUpdateRatings, currentTournamentNames }) {
  const [currentRankings, setCurrentRankings] = useState(
    Object.entries(ratings || {})
      .map(([name, rating]) => ({
        name,
        rating: Math.round(typeof rating === 'number' ? rating : 1500)
      }))
      .sort((a, b) => b.rating - a.rating)
  );

  // Convert ratings to object format if it's an array
  const ratingsObject = Array.isArray(ratings) 
    ? ratings.reduce((acc, item) => {
        const name = item.name || (item.name_options && item.name_options.name);
        const rating = typeof item.rating === 'object' 
          ? item.rating.rating 
          : (item.rating || item.elo_rating || 1500);
        if (name) {
          acc[name] = rating;
        }
        return acc;
      }, {})
    : Object.fromEntries(
        Object.entries(ratings || {}).map(([name, value]) => [
          name,
          typeof value === 'object' ? value.rating : value
        ])
      );

  // Filter ratings to only show current tournament results
  const currentRatings = currentTournamentNames 
    ? Object.fromEntries(
        Object.entries(ratingsObject || {}).filter(([name]) => 
          currentTournamentNames.includes(name)
        )
      )
    : ratingsObject;

  // Update rankings immediately when adjustments are made
  const handleSaveAdjustments = async (adjustedRankings) => {
    setCurrentRankings(adjustedRankings);
    
    // Convert the array to the expected ratings object format while preserving name_id
    const newRatings = adjustedRankings.map(({ name, rating }) => {
      const existingRating = ratings[name];
      return {
        name_id: existingRating?.name_id,
        name: name,
        rating: Math.round(rating),
        wins: existingRating?.wins || 0,
        losses: existingRating?.losses || 0
      };
    });
    
    if (onUpdateRatings) {
      await onUpdateRatings(newRatings);
    }
  };

  return (
    <div className="results-container">
      <h2>Name Rankings</h2>
      <p className="results-info">
        Adjust your name rankings here, {userName}! Drag and drop to reorder names.
      </p>

      <RankingAdjustment
        rankings={currentRankings}
        onSave={handleSaveAdjustments}
        onCancel={() => {}} // Empty function since we're not using cancel anymore
      />

      <div className="results-actions">
        <button 
          onClick={onStartNew} 
          className="primary-button"
        >
          Start New Tournament
        </button>
        <p className="results-tip">
          Starting a new tournament will let you rate more names while keeping your current rankings.
        </p>
      </div>
    </div>
  );
}

export default Results;
