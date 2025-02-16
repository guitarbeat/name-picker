import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [catFact, setCatFact] = useState('');

  const funnyPrefixes = [
    'Captain', 'Dr.', 'Professor', 'Lord', 'Lady', 'Sir', 'Duchess', 'Count',
    'Princess', 'Chief', 'Master', 'Agent', 'Detective', 'Admiral'
  ];

  const funnyAdjectives = [
    'Whiskers', 'Purrington', 'Meowington', 'Pawsome', 'Fluffles', 'Scratchy',
    'Naptastic', 'Furball', 'Cattastic', 'Pawdorable', 'Whiskertron', 'Purrfect'
  ];

  const generateFunName = () => {
    const prefix = funnyPrefixes[Math.floor(Math.random() * funnyPrefixes.length)];
    const adjective = funnyAdjectives[Math.floor(Math.random() * funnyAdjectives.length)];
    const randomNumber = Math.floor(Math.random() * 99) + 1;
    
    const generatedName = `${prefix} ${adjective}${randomNumber}`;
    setName(generatedName);
    if (error) setError('');
  };

  useEffect(() => {
    // Fetch a random cat fact for fun
    fetch('https://catfact.ninja/fact')
      .then(res => res.json())
      .then(data => setCatFact(data.fact))
      .catch(() => setCatFact('Cats make purr-fect companions!'));
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(trimmedName);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.backgroundContainer}>
        <div className={styles.overlay} />
        <img 
          src="/images/IMG_5044.JPEG" 
          alt="" 
          className={styles.backgroundImage}
          loading="eager"
        />
      </div>

      <div className={styles.loginContainer}>
        <section className={styles.imageSection}>
          <h1 className={styles.welcomeTitle}>Welcome to Meow Namester</h1>
          <img 
            src="/images/IMG_5071.JPG" 
            alt="Cute cat avatar" 
            className={styles.catImage}
            loading="eager"
          />
          <p className={styles.welcomeText}>
            Join our community of cat lovers in a fun tournament-style voting system 
            to help pick the purr-fect name for your feline friend!
          </p>
        </section>

        <div className={styles.loginContent}>
          <div>
            <h2 className={styles.loginTitle}>Start Your Journey</h2>
            <p className={styles.catFact}>{catFact || 'Loading a fun cat fact...'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name to join the fun"
                className={`${styles.loginInput} ${error ? styles.error : ''}`}
                autoFocus
                disabled={isLoading}
                aria-label="Your name"
                maxLength={30}
              />
              {error && <p className={styles.errorMessage} role="alert">{error}</p>}
            </div>

            <button
              type="button"
              onClick={generateFunName}
              className={styles.generateButton}
              disabled={isLoading}
            >
              <span className={styles.buttonContent}>
                Generate Fun Name
                <span className={styles.buttonEmoji} aria-hidden="true">😺</span>
              </span>
            </button>
            
            <button 
              type="submit" 
              className={`${styles.startButton} ${isLoading ? styles.loading : ''}`}
              disabled={!name.trim() || isLoading}
            >
              <span className={styles.buttonContent}>
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Loading...
                  </>
                ) : (
                  <>
                    Join the Tournament!
                    <span className={styles.buttonEmoji} aria-hidden="true">🏆</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className={styles.helperText}>
            By joining, you'll help others find the perfect cat name through fun, 
            tournament-style voting!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login; 