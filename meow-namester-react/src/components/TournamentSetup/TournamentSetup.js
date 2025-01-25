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
    <h2>Welcome to Aaron's Cat Name Tournament! 🏆</h2>
    <div className="welcome-text">
      <p>Here's how it works:</p>
      <ol className="tournament-steps">
        <li>Pick the names you find interesting (they'll compete in head-to-head matchups)</li>
        <li>Vote in fun 1v1 matches between names</li>
        <li>Your votes help determine which names rise to the top</li>
        <li>I'll use everyone's collective wisdom to make the final choice!</li>
      </ol>
    </div>
    
    <div className="cat-intro">
      <h3>Meet my cat! 😺</h3>
      <p>Still unnamed but full of personality, as you can see from these photos!</p>
    </div>
    
    <CatGallery 
      enlargedImage={enlargedImage} 
      setEnlargedImage={setEnlargedImage} 
    />
  </div>
);

const CatGallery = ({ enlargedImage, setEnlargedImage }) => {
  const [loadedImages, setLoadedImages] = useState({});
  const [imageError, setImageError] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleImageLoad = (image) => {
    setLoadedImages(prev => ({ ...prev, [image]: true }));
  };

  const handleImageError = (image) => {
    setImageError(prev => ({ ...prev, [image]: true }));
    console.error(`Failed to load image: ${image}`);
  };

  const handleMouseDown = (e) => {
    if (!enlargedImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !enlargedImage) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setDragOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!enlargedImage) {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [enlargedImage]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <>
      <div className="cat-gallery">
        {CAT_IMAGES.map((image, index) => {
          const isEnlarged = enlargedImage === image;
          const isLoaded = loadedImages[image];
          const hasError = imageError[image];

          return (
            <div 
              key={image}
              className="cat-photo-container"
              role="button"
              tabIndex={0}
              onClick={() => !hasError && setEnlargedImage(isEnlarged ? null : image)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !hasError && setEnlargedImage(isEnlarged ? null : image);
                }
                if (e.key === 'Escape' && isEnlarged) {
                  setEnlargedImage(null);
                }
              }}
              aria-label={`${hasError ? 'Failed to load' : 'View'} cat photo ${index + 1}`}
            >
              {!isLoaded && !hasError && (
                <div className="loading-placeholder" aria-hidden="true">
                  <div className="loading-spinner" />
                </div>
              )}
              
              {hasError ? (
                <div className="error-placeholder">
                  <span role="img" aria-label="Error">⚠️</span>
                  <p>Failed to load image</p>
                </div>
              ) : (
                <img 
                  src={`/images/${image}`}
                  alt={`Adorable cat photo ${index + 1}`}
                  className={`cat-photo ${!isLoaded ? 'loading' : ''}`}
                  onLoad={() => handleImageLoad(image)}
                  onError={() => handleImageError(image)}
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>

      {enlargedImage && (
        <div 
          className="overlay-backdrop"
          onClick={() => setEnlargedImage(null)}
          role="button"
          tabIndex={-1}
          aria-label="Close enlarged image"
        >
          <div className="overlay-content">
            <img 
              src={`/images/${enlargedImage}`}
              alt="Enlarged cat photo"
              className="enlarged-image"
              style={{
                transform: `translate(-50%, -50%) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
            />
            <button 
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(null);
              }}
              aria-label="Close enlarged image"
            >
              ×
            </button>
            <p className="image-instructions">
              Click and drag to pan • Press ESC or click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
};

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
    <h2 className="heading">Step 1: Choose Your Contestants</h2>
    <p className="selection-guide">
      Select the names you'd like to see compete in the tournament. Each name has been carefully chosen
      and comes with a unique story - hover over the cards to learn more about their meanings!
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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all names and hidden names in parallel for efficiency
        const [namesData, { data: hiddenData, error: hiddenError }] = await Promise.all([
          getNamesWithDescriptions(),
          supabase.from('hidden_names').select('name_id')
        ]);
        
        if (hiddenError) throw hiddenError;
        
        // Create Set of hidden IDs for O(1) lookup
        const hiddenIds = new Set(hiddenData?.map(item => item.name_id) || []);
        
        // Filter out hidden names
        const filteredNames = namesData.filter(name => !hiddenIds.has(name.id));
        
        // Sort names alphabetically for better UX
        const sortedNames = filteredNames.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Loaded ${sortedNames.length} available names (${hiddenIds.size} hidden)`);
        setAvailableNames(sortedNames);
        
        // If any currently selected names are now hidden, remove them
        setSelectedNames(prev => prev.filter(name => !hiddenIds.has(name.id)));
        
      } catch (err) {
        console.error('Error fetching names:', err);
        setError(`Failed to load names: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, []); // Empty dependency array since we only want to fetch once on mount

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
    error,
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
    error,
    enlargedImage,
    setEnlargedImage,
    toggleName,
    handleSelectAll
  } = useTournamentSetup(onStart);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="tournament-setup error-container">
        <h2>Error Loading Names</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (availableNames.length === 0) {
    return (
      <div className="tournament-setup empty-container">
        <h2>No Names Available</h2>
        <p className="empty-message">There are no names available for the tournament at this time.</p>
      </div>
    );
  }

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