import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import useLocalStorage from './hooks/useLocalStorage';
import { PreferenceSorter } from './utils/sortingAlgorithm';
import EloRating from './utils/EloRating';
import './index.css';

function App() {
  const [userName, setUserName] = useState('');
  const [nameOptions, setNameOptions] = useState([]);
  const [currentPair, setCurrentPair] = useState({ left: null, right: null });
  const [isSorting, setIsSorting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [sorter, setSorter] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalComparisons, setTotalComparisons] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useLocalStorage('catNameRatings', {});
  const [newOption, setNewOption] = useState('');
  const elo = useMemo(() => new EloRating(), []);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/options.txt');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.text();
        const optionsArray = data.split('\n').filter(option => option.trim() !== '');
        if (optionsArray.length > 1) {
          setNameOptions(shuffleArray(optionsArray));
        } else {
          console.error('Insufficient options to perform sorting.');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading options:', error);
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const addNewOption = () => {
    if (newOption.trim() === '') {
      return;
    }
    setNameOptions(prev => [...prev, newOption.trim()]);
    setRatings(prev => ({...prev, [newOption.trim()]: elo.defaultRating}));
    setNewOption('');
  };

  const handleChoice = useCallback((choice) => {
    if (!window.resolveComparison) {
      return;
    }
    
    const {left, right} = currentPair;
    const ratingLeft = ratings[left] || elo.defaultRating;
    const ratingRight = ratings[right] || elo.defaultRating;
    
    const newRatings = elo.calculateNewRatings(ratingLeft, ratingRight, choice);
    setRatings(prev => ({
      ...prev,
      [left]: newRatings.newRatingA,
      [right]: newRatings.newRatingB
    }));

    window.resolveComparison(choice === 'left' ? -1 : choice === 'right' ? 1 : 0);
  }, [currentPair, ratings, elo]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isSorting) {
        return;
      }
      
      switch(event.key) {
        case 'ArrowLeft':
          handleChoice('left');
          break;
        case 'ArrowRight':
          handleChoice('right');
          break;
        case 'b':
        case 'B':
          handleChoice('both');
          break;
        case 'n':
        case 'N':
          handleChoice('none');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSorting, handleChoice]);

  useEffect(() => {
    if (isSorting) {
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusableElement = focusableElements[0];
          const lastFocusableElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstFocusableElement) {
            e.preventDefault();
            lastFocusableElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
            e.preventDefault();
            firstFocusableElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isSorting]);

  const handleStart = async () => {
    if (userName.trim() === '') {
      alert('Please enter your name to start the quiz.');
      return;
    }
    if (nameOptions.length < 2) {
      alert('Not enough options to start sorting.');
      return;
    }
    const newSorter = new PreferenceSorter(nameOptions);
    setSorter(newSorter);
    setIsSorting(true);
    const n = nameOptions.length;
    const estimatedComparisons = Math.ceil(n * Math.log2(n));
    setTotalComparisons(estimatedComparisons);
    setProgress(0);
    
    try {
      let comparisons = 0;
      const sortedResults = await newSorter.sort(async (a, b) => {
        setCurrentPair({ left: a, right: b });
        comparisons++;
        setProgress(Math.floor((comparisons / estimatedComparisons) * 100));
        return new Promise((resolve) => {
          window.resolveComparison = resolve;
        });
      });
      setResults(sortedResults);
      setShowResults(true);
      setIsSorting(false);
    } catch (error) {
      console.error('Sorting error:', error);
    }
  };

  const shuffleArray = (array) => {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleRedo = () => {
    setCurrentPair({ left: null, right: null });
    setIsSorting(false);
    setShowResults(false);
    setResults([]);
    setSorter(null);
    setNameOptions(shuffleArray([...nameOptions]));
  };

  const sortedResults = showResults ? 
    [...results].sort((a, b) => (ratings[b] || 0) - (ratings[a] || 0)) : [];

  return (
    <ErrorBoundary>
      <div className="App">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header className="App-header">
          <h1>Help Me Name My Cat!</h1>
          <p>Welcome to the ultimate cat name sorter! Help decide the perfect name through fun matchups.</p>
        </header>

        <main id="main">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {!isSorting && !showResults && (
                <section className="setup-section">
                  <div className="user-input">
                    <label htmlFor="userName">Your Name:</label>
                    <input 
                      type="text" 
                      id="userName" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      placeholder="Enter your name" 
                      required 
                    />
                  </div>

                  <div className="options-management">
                    <h2>Name Options</h2>
                    <div className="add-option">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add a new name option"
                        onKeyPress={(e) => e.key === 'Enter' && addNewOption()}
                      />
                      <button className="primary-button" onClick={addNewOption}>
                        Add Name
                      </button>
                    </div>
                    
                    <div className="options-list">
                      {nameOptions.map((option, index) => (
                        <div key={index} className="option-item">
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>

                  {nameOptions.length >= 2 && (
                    <button 
                      className="primary-button start-button"
                      onClick={handleStart}
                    >
                      Start Sorting!
                    </button>
                  )}
                </section>
              )}

              {isSorting && currentPair.left && currentPair.right && (
                <div className="quiz-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${progress}%`}}
                    />
                    <span>{progress}% complete</span>
                  </div>

                  <h2>Matchup ({Math.floor(progress)}% Complete)</h2>
                  
                  <div className="matchup">
                    <button 
                      onClick={() => handleChoice('left')}
                      title="Press ← arrow key"
                    >
                      {currentPair.left}
                    </button>
                    <button 
                      onClick={() => handleChoice('right')}
                      title="Press → arrow key"
                    >
                      {currentPair.right}
                    </button>
                  </div>
                  <div className="middleField">
                    <button 
                      onClick={() => handleChoice('both')}
                      title="Press 'B' key"
                    >
                      I like both
                    </button>
                    <button 
                      onClick={() => handleChoice('none')}
                      title="Press 'N' key"
                    >
                      No Opinion
                    </button>
                  </div>
                  <div className="keyboard-hints">
                    <p>Keyboard shortcuts: ← Left, → Right, B (Both), N (No Opinion)</p>
                  </div>
                </div>
              )}
        
              {showResults && (
                <div className="results-section">
                  <h2>Results</h2>
                  <ul className="results-list">
                    {sortedResults.map((result, index) => (
                      <li key={index} className="result-item">
                        <span className="result-name">{result}</span>
                        <span className="result-rating">
                          Rating: {Math.round(ratings[result] || elo.defaultRating)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleRedo}>Redo Bracket</button>
                </div>
              )}
            </>
          )}
        </main>
  
        <footer>
          <p>Made with ❤️ by a fellow cat lover</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;