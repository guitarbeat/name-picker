import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './RankingAdjustment.css';

function RankingAdjustment({ rankings, onRankingsUpdate }) {
  const [adjustedRankings, setAdjustedRankings] = useState(rankings);

  const handleRankChange = (itemId, newRank) => {
    const updatedRankings = adjustedRankings.map(item => {
      if (item.id === itemId) {
        return { ...item, rank: parseInt(newRank) };
      }
      return item;
    });
    
    // Sort by rank
    const sortedRankings = updatedRankings.sort((a, b) => a.rank - b.rank);
    setAdjustedRankings(sortedRankings);
    onRankingsUpdate(sortedRankings);
  };

  return (
    <div className="ranking-adjustment">
      <h3>Adjust Rankings</h3>
      <div className="rankings-list">
        {adjustedRankings.map((item, index) => (
          <div key={item.id} className="ranking-item">
            <span>{item.name}</span>
            <input
              type="number"
              min="1"
              max={rankings.length}
              value={item.rank}
              onChange={(e) => handleRankChange(item.id, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankingAdjustment; 