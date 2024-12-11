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

import React, { useState } from 'react';
import { 
  Tournament, 
  Results, 
  ErrorBoundary,
  Login,
  Profile,
  TournamentSetup,
  RankingAdjustment
} from './components';
import useUserSession from './hooks/useUserSession';
import useSupabaseStorage from './supabase/useSupabaseStorage';
import { supabase } from './supabase/supabaseClient';

function App() {
  const { userName, isLoggedIn, login, logout, session } = useUserSession();
  const [ratings, setRatings] = useState({});
  const [view, setView] = useState('tournament');
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [tournamentNames, setTournamentNames] = useState(null);

  console.log('App - Current ratings:', ratings);
  console.log('App - Tournament names:', tournamentNames);

  const handleTournamentComplete = async (finalRankings) => {
    try {
      // Convert finalRankings array to the format expected by handleUpdateRatings
      const ratingsForUpdate = finalRankings.map(item => ({
        name: item.name,
        rating: item.rating,
        // Preserve existing wins/losses if available, or default to 0
        wins: ratings[item.name]?.wins || 0,
        losses: ratings[item.name]?.losses || 0
      }));

      // Update local state
      setRatings(finalRankings);
      setTournamentComplete(true);

      // Save to database
      await handleUpdateRatings(ratingsForUpdate);
      console.log('Tournament results saved successfully');
    } catch (error) {
      console.error('Error saving tournament results:', error);
      // Optionally show an error message to the user
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

  const handleUpdateRatings = (adjustedRatings) => {
    // Convert array to object format and merge with existing ratings
    const updatedRatings = { ...ratings };
    adjustedRatings.forEach(({ name, rating, wins, losses }) => {
      const existingRating = typeof updatedRatings[name] === 'object'
        ? updatedRatings[name]
        : { rating: updatedRatings[name] || 1500, wins: 0, losses: 0 };

      updatedRatings[name] = {
        name_id: existingRating.name_id,
        rating: Math.round(rating),
        wins: wins || existingRating.wins || 0,
        losses: losses || existingRating.losses || 0
      };
    });

    setRatings(updatedRatings);

    // Return a promise for the update operation
    return new Promise(async (resolve, reject) => {
      try {
        // First, get name_ids from name_options table
        const { data: nameOptions, error: nameError } = await supabase
          .from('name_options')
          .select('id, name')
          .in('name', Object.keys(updatedRatings));

        if (nameError) throw nameError;
        if (!nameOptions?.length) {
          console.warn('No matching name options found');
          throw new Error('No matching name options found');
        }

        // Create a map of name to name_id
        const nameToIdMap = nameOptions.reduce((acc, { id, name }) => {
          acc[name] = id;
          return acc;
        }, {});

        // Prepare records with proper name_ids
        const recordsToUpsert = Object.entries(updatedRatings)
          .map(([name, data]) => {
            const name_id = nameToIdMap[name];
            if (!name_id) {
              console.warn(`No name_id found for ${name}`);
              return null;
            }
            return {
              user_name: userName, // Use userName instead of session.user.id
              name_id: name_id,
              rating: data.rating,
              wins: data.wins || 0,
              losses: data.losses || 0,
              updated_at: new Date().toISOString()
            };
          })
          .filter(Boolean);

        if (!recordsToUpsert.length) {
          throw new Error('No valid records to update');
        }

        const { error: upsertError } = await supabase
          .from('cat_name_ratings')
          .upsert(recordsToUpsert, {
            onConflict: 'user_name,name_id',
            returning: 'minimal'
          });

        if (upsertError) throw upsertError;
        resolve();
      } catch (error) {
        console.error('Error updating ratings:', error);
        reject(error);
      }
    });
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
        onComplete={handleTournamentComplete}
        existingRatings={ratings}
        names={tournamentNames}
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
        <h1>Cat Name Picker</h1>
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