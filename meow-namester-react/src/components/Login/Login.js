import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your (human) name');
      return;
    }
    try {
      onLogin(name);
    } catch (err) {
      setError(err.message);
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
        />
        <div className="login-content">
          
          <h1>Thanks for helping me name my cat!</h1>
          <p>Enter your (human) name to start rating cat names</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="login-input"
              autoFocus
            />
            {error && <p className="error-message">{error}</p>}
            <button 
              type="submit" 
              className="start-button"
              disabled={!name.trim()}
            >
              Start Rating Names
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login; 