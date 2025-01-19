/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Manages the overall application state and tournament flow, including:
 * - Name input and management
 * - Tournament progression
 * - Rating calculations
 * - Results display
 * 
 * Uses the Elo rating system for ranking and a custom sorting algorithm
 * for determining the best cat name through user preferences.
 * 
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import React, { useState, useEffect } from 'react';
import { 
  Tournament, 
  Results, 
  ErrorBoundary,
  Login,
  Profile,
  TournamentSetup,
  NameSuggestion  // Add this import
} from './components';
import useUserSession from './hooks/useUserSession';
import useSupabaseStorage from './supabase/useSupabaseStorage';
import { supabase, getNamesWithDescriptions } from './supabase/supabaseClient';

function App() {
  const { userName, isLoggedIn, login, logout, session } = useUserSession();
  const [ratings, setRatings] = useState({});
  const [view, setView] = useState('tournament');
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [tournamentNames, setTournamentNames] = useState(null);
  const [names, setNames] = useState([]);

  console.log('App - Current ratings:', ratings);
  console.log('App - Tournament names:', tournamentNames);

  useEffect(() => {
    const loadNames = async () => {
      try {
        const namesData = await getNamesWithDescriptions();
        console.log('Loaded names:', namesData); // Debug log
        setNames(namesData);
      } catch (error) {
        console.error('Error loading names:', error);
      }
    };

    loadNames();
  }, []);

  // Reset tournament state when changing views
  useEffect(() => {
    if (view !== 'tournament') {
      setTournamentNames(null);
      setTournamentComplete(false);
    }
  }, [view]);

  const handleTournamentComplete = async (finalRatings) => {
    try {
      if (!userName) {
        console.error('No user name available');
        return;
      }

      console.log('Starting tournament completion for user:', userName);

      // Convert finalRatings to array if it's an object
      const ratingsArray = Array.isArray(finalRatings) 
        ? finalRatings 
        : Object.entries(finalRatings).map(([name, rating]) => ({ name, rating }));

      // Merge new ratings with existing ones, preserving wins/losses
      const updatedRatings = { ...ratings };
      ratingsArray.forEach(({ name, rating }) => {
        const existingRating = typeof updatedRatings[name] === 'object'
          ? updatedRatings[name]
          : { rating: updatedRatings[name] || 1500, wins: 0, losses: 0 };

        // If rating improved, count as a win, otherwise a loss
        const isImprovement = rating > (existingRating.rating || 1500);
        updatedRatings[name] = {
          rating: Math.round(rating),
          wins: (existingRating.wins || 0) + (isImprovement ? 1 : 0),
          losses: (existingRating.losses || 0) + (isImprovement ? 0 : 1)
        };
      });

      console.log('Fetching name_ids for:', Object.keys(updatedRatings));

      // Get name_ids from name_options table
      const { data: nameOptions, error: nameError } = await supabase
        .from('name_options')
        .select('id, name')
        .in('name', Object.keys(updatedRatings));

      if (nameError) {
        console.error('Error fetching name options:', nameError);
        return;
      }

      console.log('Retrieved name options:', nameOptions);

      // Create a map of name to name_id
      const nameToIdMap = nameOptions.reduce((acc, { id, name }) => {
        acc[name] = id;
        return acc;
      }, {});

      // Prepare records for database
      const recordsToUpsert = Object.entries(updatedRatings)
        .map(([name, data]) => {
          const name_id = nameToIdMap[name];
          if (!name_id) {
            console.warn(`No name_id found for ${name}`);
            return null;
          }
          return {
            user_name: userName,
            name_id,
            rating: data.rating,
            wins: data.wins,
            losses: data.losses,
            updated_at: new Date().toISOString()
          };
        })
        .filter(Boolean);

      console.log('Prepared records for upsert:', recordsToUpsert);

      if (recordsToUpsert.length > 0) {
        // Update ratings directly without checking user
        const { error: upsertError } = await supabase
          .from('cat_name_ratings')
          .upsert(recordsToUpsert, {
            onConflict: 'user_name,name_id',
            returning: 'minimal'
          });

        if (upsertError) {
          console.error('Error updating ratings:', upsertError);
          return;
        }

        console.log('Successfully updated ratings');
      }

      // Update local state
      setRatings(updatedRatings);
      setTournamentComplete(true);

    } catch (error) {
      console.error('Tournament completion error:', error);
    }
  };

  const handleStartNewTournament = () => {
    setTournamentComplete(false);
    setTournamentNames(null);
    setView('tournament');
  };

  const handleTournamentSetup = (names) => {
    console.log('App - Setting up tournament with names:', names);
    setTournamentNames(names);
  };

  // Simplified ratings update logic
  const handleUpdateRatings = async (adjustedRatings) => {
    try {
      // Convert array format to consistent object format
      const updatedRatings = adjustedRatings.reduce((acc, { name, rating, wins = 0, losses = 0 }) => {
        acc[name] = {
          rating: Math.round(rating),
          wins: wins,
          losses: losses
        };
        return acc;
      }, {});

      // Get name_ids in a single query
      const { data: nameOptions, error: nameError } = await supabase
        .from('name_options')
        .select('id, name')
        .in('name', Object.keys(updatedRatings));

      if (nameError) throw nameError;

      // Create records for database update
      const recordsToUpsert = nameOptions
        .map(({ id, name }) => ({
          user_name: userName,
          name_id: id,
          rating: updatedRatings[name].rating,
          wins: updatedRatings[name].wins,
          losses: updatedRatings[name].losses,
          updated_at: new Date().toISOString()
        }));

      if (recordsToUpsert.length === 0) {
        throw new Error('No valid records to update');
      }

      // Update database
      const { error: upsertError } = await supabase
        .from('cat_name_ratings')
        .upsert(recordsToUpsert, {
          onConflict: 'user_name,name_id',
          returning: 'minimal'
        });

      if (upsertError) throw upsertError;

      // Update local state
      setRatings(updatedRatings);
      return true;
    } catch (error) {
      console.error('Error updating ratings:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    logout();
  };

  if (!isLoggedIn) {
    return <Login onLogin={login} />;
  }

  const renderMainContent = () => {
    if (view === 'profile') {
      return (
        <Profile 
          userName={userName}
          onStartNewTournament={handleStartNewTournament}
          ratings={ratings}
          onUpdateRatings={handleUpdateRatings}
        />
      );
    }

    if (view === 'suggest') {  // Add this section
      return <NameSuggestion />;
    }

    if (tournamentComplete) {
      return (
        <Results 
          ratings={ratings}
          onStartNew={handleStartNewTournament}
          userName={userName}
          onUpdateRatings={handleUpdateRatings}
          currentTournamentNames={tournamentNames}
        />
      );
    }

    if (!tournamentNames) {
      return (
        <TournamentSetup 
          onStart={handleTournamentSetup}
          userName={userName}
          existingRatings={ratings}
        />
      );
    }

    return (
      <Tournament 
        names={tournamentNames}
        existingRatings={ratings}
        onComplete={handleTournamentComplete}
        userName={userName}
      />
    );
  };

  return (
    <div className="app">
      <header>
        <div 
          className="header-background"
          style={{ 
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/cat.gif)` 
          }}
        ></div>
        <img src={`${process.env.PUBLIC_URL}/images/cat.gif`} alt="Cat animation" className="header-image" />
        <h1>Meow Namester</h1>
        <div className="user-controls">
          <div className="nav-menu">
            <button 
              onClick={() => setView('tournament')}
              className={view === 'tournament' ? 'active' : ''}
            >
              Tournament
            </button>
            <button 
              onClick={() => setView('profile')}
              className={view === 'profile' ? 'active' : ''}
            >
              My Profile
            </button>
            <button 
              onClick={() => setView('suggest')}
              className={view === 'suggest' ? 'active' : ''}
            >
              Suggest Names
            </button>
          </div>
          <span className="user-welcome">Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main>
        <ErrorBoundary>
          {renderMainContent()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;