/**
 * @module ResultsTable
 * @description A component that displays a sorted table of cat names and their ratings.
 * Handles the sorting and formatting of ratings data.
 */

import React, { useMemo, memo } from 'react';
import styles from './ResultsTable.module.css';

const RatingItem = memo(({ name, rating, wins, losses, rank }) => (
  <div 
    className={styles.ratingItem}
    role="row"
    aria-label={`Rank ${rank}: ${name} with rating ${rating}`}
  >
    <span className={styles.rank} aria-hidden="true">{rank}</span>
    <span className={styles.name}>{name}</span>
    <span className={styles.stats}>
      <span className={styles.rating} aria-label={`Rating: ${rating}`}>
        {rating.toLocaleString()}
      </span>
      {(wins > 0 || losses > 0) && (
        <span className={styles.record}>
          ({wins}W - {losses}L)
        </span>
      )}
    </span>
  </div>
));

function ResultsTable({ ratings = {}, orderedNames }) {
  const sortedRatings = useMemo(() => {
    try {
      const ratingsObj = ratings || {};
      
      const processRating = (rating) => ({
        rating: Math.round(
          typeof rating === 'number' 
            ? rating 
            : (typeof rating === 'object' 
                ? rating.rating 
                : 1500)
        ),
        wins: typeof rating === 'object' ? (rating.wins || 0) : 0,
        losses: typeof rating === 'object' ? (rating.losses || 0) : 0
      });
      
      if (orderedNames) {
        return orderedNames.map(name => ({
          name,
          ...processRating(ratingsObj[name])
        }));
      }

      return Object.entries(ratingsObj)
        .map(([name, rating]) => ({
          name,
          ...processRating(rating)
        }))
        .sort((a, b) => {
          // Primary sort by rating
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          // Secondary sort by win percentage
          const aWinRate = a.wins / Math.max(1, a.wins + a.losses);
          const bWinRate = b.wins / Math.max(1, b.wins + b.losses);
          if (bWinRate !== aWinRate) {
            return bWinRate - aWinRate;
          }
          // Tertiary sort by total matches
          const aTotalMatches = a.wins + a.losses;
          const bTotalMatches = b.wins + b.losses;
          if (bTotalMatches !== aTotalMatches) {
            return bTotalMatches - aTotalMatches;
          }
          // Final sort alphabetically
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      console.error('Error processing ratings:', error);
      return [];
    }
  }, [ratings, orderedNames]);

  if (!sortedRatings.length) {
    return (
      <div 
        className={styles.noResults} 
        role="status" 
        aria-label="No ratings available"
      >
        <p>No ratings available yet.</p>
        <p className={styles.helpText}>Complete a tournament to see rankings here.</p>
      </div>
    );
  }

  return (
    <div 
      className={styles.ratingsList}
      role="table"
      aria-label="Name Rankings"
    >
      <div className={styles.ratingsHeader} role="row">
        <span role="columnheader" aria-sort="ascending">Rank</span>
        <span role="columnheader">Name</span>
        <span role="columnheader">Rating</span>
      </div>
      
      {sortedRatings.map(({ name, rating, wins, losses }, index) => (
        <RatingItem
          key={name}
          name={name}
          rating={rating}
          wins={wins}
          losses={losses}
          rank={index + 1}
        />
      ))}
    </div>
  );
}

export default memo(ResultsTable); 