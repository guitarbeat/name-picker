import React, { useState, useEffect } from 'react';
import { supabase, getNamesWithDescriptions } from '../../supabase/supabaseClient';
import { LoadingSpinner, NameCard, ErrorBoundary } from '../';
import useNameOptions from '../../supabase/useNameOptions';
import './TournamentSetup.css';

const CAT_IMAGES = [
  'IMG_4844.jpg',
  'IMG_4845.jpg',
  'IMG_4846.jpg',
  'IMG_4847.jpg',
  'IMG_5044.JPEG',
  'IMG_5071.JPG'
];

const DEFAULT_DESCRIPTION = "A name as unique as your future companion";

const WelcomeSection = ({ enlargedImage, setEnlargedImage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="welcome-section">
      <h2>Ultimate Cat Name Championship! 🏆</h2>
      <div className={`welcome-text ${isExpanded ? 'expanded' : ''}`}>
        <button 
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="instructions"
        >
          <span className="toggle-text">{isExpanded ? 'Hide Instructions' : 'Show Instructions'}</span>
          <span className="toggle-icon">{isExpanded ? '−' : '+'}</span>
        </button>
        <div id="instructions" className="instructions-content">
          <p>Help name this adorable feline:</p>
          <ol className="tournament-steps">
            <li>Pick your favorite names from our collection</li>
            <li>Watch names battle in head-to-head matchups</li>
            <li>Vote to crown the purrfect champion</li>
            <li>Help write this kitty's next chapter</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

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
          ? "Pick some pawsome names! 🐾" 
          : `${selectedCount} Names Selected`}
      </span>
      <button 
        onClick={onSelectAll}
        className="select-all-button"
        aria-label={selectedCount === totalCount ? 'Clear all selections' : 'Select all names'}
      >
        {selectedCount === totalCount 
          ? '✨ Start Fresh' 
          : '🎲 Select All'}
      </button>
    </div>
    {selectedCount === 1 && (
      <span className="helper-text" role="alert">
        Just one more to start! 🎯
      </span>
    )}
  </div>
);

const NameSelection = ({ selectedNames, availableNames, onToggleName }) => (
  <div className="name-selection">
    <h2 className="heading">Choose Your Champions</h2>
    <p className="selection-guide">
      Each name has a unique story - hover to discover their meanings!
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
      <span className="button-text">Let the Games Begin! 🎮</span>
      <span className="button-subtext">
        {selectedNames.length} Names Ready 🏆
      </span>
    </button>
  </div>
);

const NameSuggestionSection = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addNameOption, loading } = useNameOptions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      await addNameOption(name.trim(), description.trim());
      setSuccess('Thank you for your suggestion!');
      setName('');
      setDescription('');
    } catch (err) {
      setError('Failed to add name. It might already exist.');
    }
  };

  return (
    <div className="suggestion-section">
      <div className="suggestion-card">
        <h2>Suggest a Cat Name</h2>
        <p className="suggestion-intro">
          Have a great cat name in mind? Share it with the community!
        </p>

        <form onSubmit={handleSubmit} className="suggestion-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a cat name"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this name's meaning or origin"
              maxLength={500}
              disabled={loading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Name'}
          </button>
        </form>
      </div>
    </div>
  );
};

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
    <div className="tournament-setup">
      <div className="tournament-layout">
        <aside className="photo-sidebar">
          <div className="photo-sidebar-content">
            <h3>Meet Your VIP! 😺</h3>
            <p>This charmer needs a name that matches their spirit</p>
            <div className="photo-grid">
              {CAT_IMAGES.map((image, index) => (
                <div 
                  key={image}
                  className="photo-thumbnail"
                  onClick={() => setEnlargedImage(image)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View cat photo ${index + 1}`}
                >
                  <img 
                    src={`/images/${image}`}
                    alt={`Cat photo ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <NameSuggestionSection />
        </aside>

        <main className="names-content">
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
        </main>

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
            </div>
          </div>
        )}
      </div>
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