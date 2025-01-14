/**
 * @module ResultsTable
 * @description A component that displays a sorted table of cat names and their ratings.
 * Handles the sorting and formatting of ratings data.
 */

import React, { useMemo, memo } from 'react';

const RatingItem = memo(({ name, rating, rank }) => (
  <div 
    className="rating-item"
    role="row"
    aria-label={`Rank ${rank}: ${name} with rating ${rating}`}
  >
    <span className="rank" aria-hidden="true">{rank}</span>
    <span className="name">{name}</span>
    <span className="rating" aria-label={`Rating: ${rating}`}>
      {rating.toLocaleString()}
    </span>
  </div>
));

function ResultsTable({ ratings = {}, orderedNames }) {
  const sortedRatings = useMemo(() => {
    try {
      const ratingsObj = ratings || {};
      
      if (orderedNames) {
        return orderedNames.map(name => ({
          name,
          rating: Math.round(
            typeof ratingsObj[name] === 'number' 
              ? ratingsObj[name] 
              : (typeof ratingsObj[name] === 'object' 
                  ? ratingsObj[name].rating 
                  : 1500)
          )
        }));
      }

      return Object.entries(ratingsObj)
        .map(([name, rating]) => ({
          name,
          rating: Math.round(
            typeof rating === 'number' 
              ? rating 
              : (typeof rating === 'object' 
                  ? rating.rating 
                  : 1500)
          )
        }))
        .sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error('Error processing ratings:', error);
      return [];
    }
  }, [ratings, orderedNames]);

  if (!sortedRatings.length) {
    return (
      <div 
        className="no-results" 
        role="status" 
        aria-label="No ratings available"
      >
        <p>No ratings available yet.</p>
        <p className="help-text">Complete a tournament to see rankings here.</p>
      </div>
    );
  }

  return (
    <div 
      className="ratings-list"
      role="table"
      aria-label="Name Rankings"
    >
      <div className="ratings-header" role="row">
        <span role="columnheader" aria-sort="ascending">Rank</span>
        <span role="columnheader">Name</span>
        <span role="columnheader">Rating</span>
      </div>
      
      {sortedRatings.map(({ name, rating }, index) => (
        <RatingItem
          key={name}
          name={name}
          rating={rating}
          rank={index + 1}
        />
      ))}
    </div>
  );
}

export default memo(ResultsTable); 