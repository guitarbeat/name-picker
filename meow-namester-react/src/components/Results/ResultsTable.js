/**
 * @module ResultsTable
 * @description A component that displays a sorted table of cat names and their ratings.
 * Handles the sorting and formatting of ratings data.
 * 
 * @example
 * <ResultsTable 
 *   ratings={[{ name: "Whiskers", rating: 1450 }, { name: "Mittens", rating: 1380 }]}
 * />
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.ratings - Object with name and rating properties
 * @param {Array} props.orderedNames - Array of ordered cat names
 * @returns {JSX.Element} Formatted table of cat names and their ratings
 */

import React from 'react';

function ResultsTable({ ratings = {}, orderedNames }) {
  // Ensure ratings is an object and handle null/undefined
  const ratingsObj = ratings || {};
  
  // Convert ratings object to array and sort by rating, unless ordered names provided
  const sortedRatings = orderedNames
    ? orderedNames.map(name => ({
        name,
        rating: Math.round(typeof ratingsObj[name] === 'number' ? ratingsObj[name] : 
          (typeof ratingsObj[name] === 'object' ? ratingsObj[name].rating : 1500))
      }))
    : Object.entries(ratingsObj)
        .map(([name, rating]) => ({
          name,
          rating: Math.round(typeof rating === 'number' ? rating : 
            (typeof rating === 'object' ? rating.rating : 1500))
        }))
        .sort((a, b) => b.rating - a.rating);

  if (!sortedRatings.length) {
    return (
      <div className="no-results">
        <p>No ratings available yet.</p>
        <p className="help-text">Complete a tournament to see rankings here.</p>
      </div>
    );
  }

  return (
    <div className="ratings-list">
      {sortedRatings.map(({ name, rating }, index) => (
        <div key={name} className="rating-item">
          <span className="rank">{index + 1}</span>
          <span className="name">{name}</span>
          <span className="rating">Rating: {Math.round(rating)}</span>
        </div>
      ))}
    </div>
  );
}

export default ResultsTable; 