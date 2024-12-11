import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import './TournamentSetup.css';

function TournamentSetup({ onStart, existingRatings = [] }) {
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [customNames, setCustomNames] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNames();
  }, []);

  const fetchNames = async () => {
    try {
      const { data, error } = await supabase
        .from('name_options')
        .select('name')
        .order('name');

      if (error) throw error;

      const names = data.map(item => item.name);
      setAvailableNames(names);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching names:', err);
      setError('Failed to load names. Please try again later.');
      setIsLoading(false);
    }
  };

  const toggleName = (name) => {
    setSelectedNames(prev => 
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleRandomSelect = () => {
    const shuffled = [...availableNames].sort(() => Math.random() - 0.5);
    setSelectedNames(shuffled.slice(0, 8));
  };

  const handleSelectAll = () => {
    setSelectedNames(availableNames);
  };

  const handleCustomNamesSubmit = (e) => {
    e.preventDefault();
    const newNames = customNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    setSelectedNames(prev => [...new Set([...prev, ...newNames])]);
    setCustomNames('');
  };

  const handleStart = () => {
    if (selectedNames.length < 2) {
      alert('Please select at least 2 names to start the tournament.');
      return;
    }
    onStart(selectedNames);
  };

  if (isLoading) return <div className="loading">Loading names...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tournament-setup">
      <h2>Name Selection</h2>
      
      <div className="selection-controls">
        <button onClick={handleRandomSelect} className="control-button">
          Random 8 Names
        </button>
        <button onClick={handleSelectAll} className="control-button">
          Select All Names
        </button>
        <button 
          onClick={() => setSelectedNames([])} 
          className="control-button clear"
        >
          Clear Selection
        </button>
      </div>

      <div className="name-count">
        Selected: {selectedNames.length} names
        {selectedNames.length > 0 && selectedNames.length < 2 && (
          <span className="warning"> (Select at least 2 names)</span>
        )}
      </div>

      <div className="names-grid">
        {availableNames.map(name => (
          <div
            key={name}
            onClick={() => toggleName(name)}
            className={`name-card ${selectedNames.includes(name) ? 'selected' : ''}`}
          >
            <span className="name-text">{name}</span>
            {selectedNames.includes(name) && (
              <span className="check-mark">✓</span>
            )}
          </div>
        ))}
      </div>

      <div className="custom-names-section">
        <h3>Add Custom Names</h3>
        <form onSubmit={handleCustomNamesSubmit}>
          <textarea
            value={customNames}
            onChange={(e) => setCustomNames(e.target.value)}
            placeholder="Enter custom names (one per line)"
            rows={4}
          />
          <button type="submit" className="add-custom-button">
            Add Custom Names
          </button>
        </form>
      </div>

      <div className="start-section">
        <button
          onClick={handleStart}
          className="start-button"
          disabled={selectedNames.length < 2}
        >
          Start Tournament with {selectedNames.length} Names
        </button>
      </div>
    </div>
  );
}

export default TournamentSetup; 