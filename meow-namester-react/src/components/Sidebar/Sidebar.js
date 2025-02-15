import React from 'react';
import './Sidebar.css';

const Sidebar = ({ view, setView, isLoggedIn, userName, onLogout, isOpen, onToggle }) => {
  return (
    <>
      <button 
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src={`${process.env.PUBLIC_URL}/images/cat.gif`} 
              alt="Cat animation" 
              className="sidebar-cat-image" 
            />
            <h1 className="app-title">Meow Namester</h1>
          </div>
          {isLoggedIn && (
            <div className="user-info">
              <span className="user-greeting">Welcome back</span>
              <span className="user-name">{userName}</span>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-button ${view === 'tournament' ? 'active' : ''}`}
            onClick={() => {
              setView('tournament');
              onToggle();
            }}
          >
            <span className="button-icon">🏆</span>
            <span className="button-text">Tournament</span>
          </button>
          
          {isLoggedIn && (
            <>
              <button 
                className={`nav-button ${view === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setView('profile');
                  onToggle();
                }}
              >
                <span className="button-icon">👤</span>
                <span className="button-text">My Profile</span>
              </button>
            </>
          )}
        </nav>

        {isLoggedIn && (
          <div className="sidebar-footer">
            <button 
              className="logout-button"
              onClick={() => {
                onLogout();
                onToggle();
              }}
            >
              <span className="button-icon">👋</span>
              <span className="button-text">Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar; 