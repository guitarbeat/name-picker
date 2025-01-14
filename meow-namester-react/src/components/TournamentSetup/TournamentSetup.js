import React, { useState, useEffect } from 'react';
import { supabase, getNamesWithDescriptions } from '../../supabase/supabaseClient';
import { LoadingSpinner, NameCard, ErrorBoundary } from '../';
import './TournamentSetup.css';

const CAT_IMAGES = [
  'IMG_4844.jpg',
  'IMG_4845.jpg',
  'IMG_4846.jpg',
  'IMG_4847.jpg'
];

const DEFAULT_DESCRIPTION = "A name as unique as your future companion";

const WelcomeSection = ({ enlargedImage, setEnlargedImage }) => (
  <div className="welcome-section">
    <h2>What do you think I should name my cat! 🐈‍⬛ ✨</h2>
    <p className="welcome-text">
      Welcome to the ultimate cat name showdown! Pick your favorite names and let them battle it out in a fun tournament.
      Each name has been carefully chosen with love and personality in mind.
    </p>
    
    <CatGallery 
      enlargedImage={enlargedImage} 
      setEnlargedImage={setEnlargedImage} 
    />
    
    {enlargedImage && (
      <div 
        className="overlay active" 
        onClick={() => setEnlargedImage(null)}
        role="button"
        tabIndex={0}
        aria-label="Close enlarged image"
      />
    )}
  </div>
);

const CatGallery = ({ enlargedImage, setEnlargedImage }) => (
  <div className="cat-gallery">
    {CAT_IMAGES.map((image, index) => (
      <img 
        key={image}
        src={`/images/${image}`}
        alt={`Adorable cat photo ${index + 1}`}
        className={`cat-photo ${enlargedImage === image ? 'enlarged' : ''}`}
        onClick={() => setEnlargedImage(enlargedImage === image ? null : image)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setEnlargedImage(enlargedImage === image ? null : image);
          }
        }}
        role="button"
        tabIndex={0}
      />
    ))}
  </div>
);

const NameCounter = ({ selectedCount, totalCount, onSelectAll }) => (
  <div className="name-count">
    <div className="count-and-select">
      <span className="count-text">
        {selectedCount === 0 
          ? "No names selected yet - let's get started!" 
          : `${selectedCount} Purr-fect Names Selected`}
      </span>
      <button 
        onClick={onSelectAll}
        className="select-all-button"
        aria-label={selectedCount === totalCount ? 'Clear all selections' : 'Select all names'}
      >
        {selectedCount === totalCount 
          ? '✨ Start Fresh' 
          : '🎲 Include All Names'}
      </button>
    </div>
    {selectedCount === 1 && (
      <span className="helper-text" role="alert">
        Just one more name and we can start the tournament! 🎯
      </span>
    )}
  </div>
);

const NameSelection = ({ selectedNames, availableNames, onToggleName }) => (
  <div className="name-selection">
    <h2 className="heading">Choose Your Contestants</h2>
    <p className="selection-guide">
      Click on the names you'd like to include in the tournament. 
      Hover over each card to learn more about the name's meaning and charm!
    </p>

    <div className="cards-container">
      {availableNames.map(nameObj => (
        <NameCard
          key={nameObj.id}
          name={nameObj.name}
          description={nameObj.description || DEFAULT_DESCRIPTION}
          isSelected={selectedNames.some(n => n.id === nameObj.id)}
          onClick={() => onToggleName(nameObj)}
          size="small"
          shortcutHint={`Press Enter to ${selectedNames.some(n => n.id === nameObj.id) ? 'deselect' : 'select'} ${nameObj.name}`}
        />
      ))}
    </div>
  </div>
);

const StartButton = ({ selectedNames, onStart }) => (
  <div className="start-section">
    <button
      onClick={() => {
        onStart(selectedNames.map(n => ({
          name: n.name,
          description: n.description || DEFAULT_DESCRIPTION
        })));
      }}
      className="start-button"
      disabled={selectedNames.length < 2}
      aria-label={`Start tournament with ${selectedNames.length} names`}
    >
      <span className="button-text">Start the Name Tournament!</span>
      <span className="button-subtext">
        {selectedNames.length} Names Ready to Compete 🏆
      </span>
    </button>
  </div>
);

function useTournamentSetup(onStart) {
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState(null);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const data = await getNamesWithDescriptions();
        setAvailableNames(data || []);
      } catch (err) {
        console.error('Error fetching names:', err);
      } finally {
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
    setSelectedNames(
      selectedNames.length === availableNames.length ? [] : [...availableNames]
    );
  };

  return {
    availableNames,
    selectedNames,
    isLoading,
    enlargedImage,
    setEnlargedImage,
    toggleName,
    handleSelectAll
  };
}

function TournamentSetupContent({ onStart }) {
  const {
    availableNames,
    selectedNames,
    isLoading,
    enlargedImage,
    setEnlargedImage,
    toggleName,
    handleSelectAll
  } = useTournamentSetup(onStart);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="tournament-setup container">
      <WelcomeSection 
        enlargedImage={enlargedImage} 
        setEnlargedImage={setEnlargedImage} 
      />

      <NameSelection 
        selectedNames={selectedNames}
        availableNames={availableNames}
        onToggleName={toggleName}
      />

      <NameCounter 
        selectedCount={selectedNames.length}
        totalCount={availableNames.length}
        onSelectAll={handleSelectAll}
      />

      {selectedNames.length >= 2 && (
        <StartButton 
          selectedNames={selectedNames}
          onStart={onStart}
        />
      )}
    </div>
  );
}

function TournamentSetup(props) {
  return (
    <ErrorBoundary>
      <TournamentSetupContent {...props} />
    </ErrorBoundary>
  );
}

export default TournamentSetup; 