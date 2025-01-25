import React, { useState, useEffect } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [catFact, setCatFact] = useState('');

  useEffect(() => {
    // Fetch a random cat fact for fun
    fetch('https://catfact.ninja/fact')
      .then(res => res.json())
      .then(data => setCatFact(data.fact))
      .catch(() => setCatFact('Cats are purr-fect name critics! 😺'));
  }, []);

  const validateName = (name) => {
    if (name.length < 2) return 'Name must be at least 2 characters long';
    if (name.length > 30) return 'Name must be less than 30 characters';
    if (!/^[a-zA-Z\s-']+$/.test(name)) return 'Please use only letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateName(name.trim());
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onLogin(name.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (error) {
      const validationError = validateName(newName.trim());
      setError(validationError);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="background-container">
        <img 
          src="/images/cat.gif" 
          alt="Animated cat" 
          className="background-gif"
        />
        <div className="overlay"></div>
      </div>

      <div className="login-container">
        <img 
          src="/images/kittens.png" 
          alt="Cute kittens" 
          className="kittens-image"
          loading="eager"
        />
        <div className="login-content">
          <h1>Hi! I'm Aaron, and I need your help naming this adorable cat! 😺</h1>
          <p className="subtitle">These are actual photos of my new feline friend, who's currently living with a temporary name until we find the perfect one!</p>
          <p className="cat-fact">{catFact || 'Loading a fun cat fact...'}</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name to join the fun"
                className={`login-input ${error ? 'error' : ''}`}
                autoFocus
                disabled={isLoading}
                aria-label="Your name"
                maxLength={30}
              />
              {error && <p className="error-message" role="alert">{error}</p>}
            </div>
            <button 
              type="submit" 
              className={`start-button ${isLoading ? 'loading' : ''}`}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <span className="button-content">
                  <span className="spinner"></span>
                  Loading...
                </span>
              ) : (
                <span className="button-content">
                  Join the Cat Name Tournament!
                  <span className="button-emoji">🏆</span>
                </span>
              )}
            </button>
          </form>
          <p className="helper-text">Join hundreds of others in a fun tournament-style voting system to help pick the purr-fect name!</p>
        </div>
      </div>
    </div>
  );
}

export default Login; 