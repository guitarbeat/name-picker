import React from 'react';
import './Sidebar.css';

const Sidebar = ({ view, setView, isLoggedIn, userName, onLogout, isOpen, onToggle }) => {
  return (
    <>
      <button 
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img 
            src={`${process.env.PUBLIC_URL}/images/cat.gif`} 
            alt="Cat animation" 
            className="sidebar-cat-image" 
          />
          {isLoggedIn && (
            <div className="user-info">
              <span>👋 {userName}</span>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-button ${view === 'tournament' ? 'active' : ''}`}
            onClick={() => {
              setView('tournament');
              onToggle();
            }}
          >
            Tournament
          </button>
          
          {isLoggedIn && (
            <>
              <button 
                className={`sidebar-button ${view === 'suggest' ? 'active' : ''}`}
                onClick={() => {
                  setView('suggest');
                  onToggle();
                }}
              >
                Suggest Names
              </button>
              <button 
                className={`sidebar-button ${view === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setView('profile');
                  onToggle();
                }}
              >
                My Profile
              </button>
              <button 
                className="sidebar-button logout"
                onClick={() => {
                  onLogout();
                  onToggle();
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 