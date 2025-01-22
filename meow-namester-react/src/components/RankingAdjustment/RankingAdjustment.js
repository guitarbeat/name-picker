import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './RankingAdjustment.css';

function RankingAdjustment({ rankings, onSave, onCancel }) {
  const [items, setItems] = useState(rankings);
  const [saveStatus, setSaveStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Helper function to check if rankings have actually changed
  const haveRankingsChanged = (newItems, oldRankings) => {
    if (newItems.length !== oldRankings.length) return true;
    return newItems.some((item, index) => {
      return item.name !== oldRankings[index].name || 
             item.rating !== oldRankings[index].rating;
    });
  };

  useEffect(() => {
    setItems(rankings); // Update items when rankings prop changes
  }, [rankings]);

  useEffect(() => {
    if (items && rankings && haveRankingsChanged(items, rankings)) {
      setSaveStatus('saving');
      const saveTimer = setTimeout(() => {
        onSave(items)
          .then(() => {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 2000);
          })
          .catch(() => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
          });
      }, 500);

      return () => clearTimeout(saveTimer);
    }
  }, [items, rankings, onSave]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result) => {
    setIsDragging(false);
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    // Enhanced rating calculation with smoother distribution while preserving wins/losses
    const adjustedItems = newItems.map((item, index) => ({
      ...item,
      rating: Math.round(
        1000 + (1000 * (newItems.length - index)) / newItems.length
      ),
      // Preserve wins and losses from the original item
      wins: item.wins || 0,
      losses: item.losses || 0
    }));

    setItems(adjustedItems);
  };

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="save-status saving">Saving changes...</div>;
      case 'success':
        return <div className="save-status success">✓ Changes saved</div>;
      case 'error':
        return <div className="save-status error">Failed to save. Try again.</div>;
      default:
        return null;
    }
  };

  return (
    <div className={`ranking-adjustment ${isDragging ? 'is-dragging' : ''}`}>
      <header className="ranking-header">
        <h2>Your Cat Name Rankings</h2>
        {getSaveStatusDisplay()}
      </header>

      <div className="instructions-card">
        <div className="instruction-icon">↕️</div>
        <div className="instruction-text">
          <h3>How to Adjust Rankings</h3>
          <p>
            Drag and drop names to reorder them. Names at the top will receive higher
            ratings. Your changes are saved automatically.
          </p>
        </div>
      </div>
      
      <div className="rankings-grid">
        <div className="rankings-header">
          <div className="rank-header">Rank</div>
          <div className="name-header">Name</div>
          <div className="rating-header">Rating</div>
        </div>

        <DragDropContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="rankings">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`rankings-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {items.map((item, index) => (
                  <Draggable 
                    key={item.name} 
                    draggableId={item.name} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`ranking-card ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="rank-badge">{index + 1}</div>
                        <div className="card-content">
                          <h3 className="name">{item.name}</h3>
                          <div className="stats">
                            <span className="rating">Rating: {Math.round(item.rating)}</span>
                            <span className="record">W: {item.wins || 0} L: {item.losses || 0}</span>
                          </div>
                        </div>
                        <div className="drag-handle">
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="adjustment-controls">
        <button onClick={onCancel} className="back-button">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Tournament
        </button>
      </div>
    </div>
  );
}

export default RankingAdjustment; 