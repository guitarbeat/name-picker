import React, { useEffect, useCallback, useState } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ view, setView, isLoggedIn, userName, onLogout, isOpen, onToggle }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onToggle();
    }
  }, [isOpen, onToggle]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle backdrop and animation states with improved timing
  useEffect(() => {
    if (isOpen) {
      // Show backdrop immediately when opening
      setShowBackdrop(true);
      setIsAnimating(true);
      
      // Allow time for animation to complete
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Slightly longer than CSS transition
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      
      // Delay hiding backdrop until close animation completes
      const timer = setTimeout(() => {
        setShowBackdrop(false);
        setIsAnimating(false);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    const body = document.body;
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - body.clientWidth;
      body.style.overflow = 'hidden';
      body.style.paddingRight = `${scrollbarWidth}px`; // Prevent layout shift
    } else {
      body.style.overflow = '';
      body.style.paddingRight = '';
    }
    return () => {
      body.style.overflow = '';
      body.style.paddingRight = '';
    };
  }, [isOpen]);

  return (
    <>
      <button 
        className={`${styles.sidebarToggle} ${isOpen ? styles.open : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="sidebar-menu"
        aria-haspopup="true"
      >
        <span className={styles.srOnly}>Toggle menu</span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
      
      {/* Backdrop with improved animation support */}
      {showBackdrop && (
        <div 
          className={`${styles.backdrop} ${isOpen ? styles.open : ''} ${isAnimating ? styles.animating : ''}`}
          onClick={onToggle}
          aria-hidden="true"
          role="presentation"
        />
      )}
      
      <aside 
        id="sidebar-menu"
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isAnimating ? styles.animating : ''}`}
        role="navigation"
        aria-label="Main menu"
        aria-hidden={!isOpen}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <img 
              src={`${process.env.PUBLIC_URL}/images/cat.gif`} 
              alt="Cat animation" 
              className={styles.sidebarCatImage}
              width="40"
              height="40"
            />
            <h1 className={styles.appTitle}>Meow Namester</h1>
          </div>
          {isLoggedIn && (
            <div className={styles.userInfo} role="status">
              <span className={styles.userGreeting}>Welcome back</span>
              <span className={styles.userName}>{userName}</span>
            </div>
          )}
        </div>
        
        <nav className={styles.sidebarNav}>
          <button 
            className={view === 'tournament' ? styles.active : styles.navButton}
            onClick={() => {
              setView('tournament');
              onToggle();
            }}
            aria-current={view === 'tournament' ? 'page' : undefined}
          >
            <span className={styles.buttonIcon} aria-hidden="true">🏆</span>
            <span className={styles.buttonText}>Tournament</span>
          </button>
          
          {isLoggedIn && (
            <>
              <button 
                className={view === 'profile' ? styles.active : styles.navButton}
                onClick={() => {
                  setView('profile');
                  onToggle();
                }}
                aria-current={view === 'profile' ? 'page' : undefined}
              >
                <span className={styles.buttonIcon} aria-hidden="true">👤</span>
                <span className={styles.buttonText}>My Profile</span>
              </button>
            </>
          )}
        </nav>

        {isLoggedIn && (
          <div className={styles.sidebarFooter}>
            <button 
              className={styles.logoutButton}
              onClick={() => {
                onLogout();
                onToggle();
              }}
            >
              <span className={styles.buttonIcon} aria-hidden="true">👋</span>
              <span className={styles.buttonText}>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar; 