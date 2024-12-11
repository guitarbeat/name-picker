import React from 'react';
import './Results.css';

export function Results({ ratings, onRestart }) {
  // Sort ratings by value in descending order
  const sortedRatings = Object.entries(ratings)
    .sort(([, a], [, b]) => b - a)
    .map(([name, rating]) => ({ name, rating }));

  return (
    <div className="results">
      <h1>Results</h1>
      <div className="ratings-list">
        {sortedRatings.map(({ name, rating }) => (
          <div key={name} className="rating-item">
            {name} Rating: {rating}
          </div>
        ))}
      </div>
      <button className="redo-button" onClick={onRestart}>
        Redo Bracket
      </button>
    </div>
  );
}
