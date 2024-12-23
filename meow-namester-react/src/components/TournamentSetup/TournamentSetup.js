import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import './TournamentSetup.css';

function TournamentSetup({ onStart }) {
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const { data } = await supabase
          .from('name_options')
          .select('id, name, description')
          .order('name');

        setAvailableNames(data || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching names:', err);
        setIsLoading(false);
      }
    };

    fetchNames();
  }, []);

  const toggleName = (nameObj) => {
    setSelectedNames(prev => 
      prev.some(n => n.id === nameObj.id)
        ? prev.filter(n => n.id !== nameObj.id)
        : [...prev, nameObj]
    );
  };

  const handleSelectAll = () => {
    if (selectedNames.length === availableNames.length) {
      setSelectedNames([]);
    } else {
      setSelectedNames([...availableNames]);
    }
  };

  if (isLoading) return <div className="container">Loading...</div>;

  return (
    <div className="tournament-setup container">
      <div className="welcome-section">
        <h2>Meet the cat who needs a name:</h2>
        <div className="cat-gallery">
          <img src="/images/IMG_4844.jpg" alt="My cat 1" className="cat-photo" />
          <img src="/images/IMG_4845.jpg" alt="My cat 2" className="cat-photo" />
          <img src="/images/IMG_4846.jpg" alt="My cat 3" className="cat-photo" />
          <img src="/images/IMG_4847.jpg" alt="My cat 4" className="cat-photo" />
        </div>
      </div>

      <div className="name-selection">
        <h2 className="heading">Pick some names to rate</h2>

        <div className="name-count">
          <div className="count-and-select">
            <span>Selected: {selectedNames.length} names</span>
            <button 
              onClick={handleSelectAll}
              className="select-all-button"
            >
              {selectedNames.length === availableNames.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {selectedNames.length === 1 && <span className="warning"> (Select at least one more)</span>}
        </div>

        <div className="cards-container">
          {availableNames.map(nameObj => (
            <div
              key={nameObj.id}
              onClick={() => toggleName(nameObj)}
              className={`name-card ${selectedNames.some(n => n.id === nameObj.id) ? 'selected' : ''}`}
            >
              <h3 className="name-text">{nameObj.name}</h3>
              <p className="name-description">{nameObj.description}</p>
              {selectedNames.some(n => n.id === nameObj.id) && (
                <span className="check-mark">✓</span>
              )}
            </div>
          ))}
        </div>

        {selectedNames.length >= 2 && (
          <div className="start-section">
            <button
              onClick={() => onStart(selectedNames.map(n => ({
                name: n.name,
                description: n.description
              })))}
              className="start-button"
              disabled={selectedNames.length < 2}
            >
              Start Tournament with {selectedNames.length} Names
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentSetup; 