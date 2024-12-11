import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './RankingAdjustment.css';

function RankingAdjustment({ rankings, onSave, onCancel }) {
  const [items, setItems] = useState(rankings);
  const [saveStatus, setSaveStatus] = useState('');

  // Autosave whenever items change
  useEffect(() => {
    if (items !== rankings) {
      setSaveStatus('Saving...');
      onSave(items)
        .then(() => {
          setSaveStatus('Saved ✓');
          // Clear the success message after 2 seconds
          setTimeout(() => setSaveStatus(''), 2000);
        })
        .catch(() => {
          setSaveStatus('Save failed! Try again later');
          // Clear the error message after 3 seconds
          setTimeout(() => setSaveStatus(''), 3000);
        });
    }
  }, [items, rankings, onSave]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    // Recalculate ratings based on new positions
    const adjustedItems = newItems.map((item, index) => ({
      ...item,
      rating: Math.round(Math.max(1000, 2000 - ((newItems.length - 1 - index) * 50)))
    }));

    setItems(adjustedItems);
  };

  return (
    <div className="ranking-adjustment">
      <h2>Your Cat Name Rankings</h2>
      <div className="save-status-indicator">
        {saveStatus && <span className={`save-status ${saveStatus.includes('failed') ? 'error' : ''}`}>{saveStatus}</span>}
      </div>
      <p className="instructions">
        Drag and drop cards to adjust rankings. Names at the top will be rated higher.
        Changes are saved automatically.
      </p>
      
      <div className="rankings-grid">
        <div className="rankings-header">
          <div className="rank-header">Rank</div>
          <div className="name-header">Name</div>
          <div className="rating-header">Rating</div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="rankings">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="rankings-list"
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
                          <div className="rating">Rating: {item.rating}</div>
                        </div>
                        <div className="drag-handle">
                          <span className="drag-icon">⋮⋮</span>
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
          Back to Tournament
        </button>
      </div>
    </div>
  );
}

export default RankingAdjustment; 