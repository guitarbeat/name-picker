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
  Results, 
  ErrorBoundary,
  Login,
  Profile,
  TournamentSetup
} from './components';
import Sidebar from './components/Sidebar/Sidebar';
import useUserSession from './hooks/useUserSession';
import useSupabaseStorage from './supabase/useSupabaseStorage';
import { supabase, getNamesWithDescriptions } from './supabase/supabaseClient';
import Tournament from './components/Tournament/Tournament';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

function App() {
  const { userName, isLoggedIn, login, logout, session } = useUserSession();
  const [ratings, setRatings] = useState({});
  const [view, setView] = useState('tournament');
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [tournamentNames, setTournamentNames] = useState(null);
  const [names, setNames] = useState([]);
  const [voteHistory, setVoteHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTournamentLoading, setIsTournamentLoading] = useState(false);

  console.log('App - Current ratings:', ratings);
  console.log('App - Tournament names:', tournamentNames);
  console.log('App - Vote history:', voteHistory);  // Add debug log

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

  // Handle vote history updates
  const handleVoteHistoryUpdate = (newVote) => {
    console.log('Recording new vote:', newVote);  // Add debug log
    setVoteHistory(prev => {
      const updated = [...prev, newVote];
      console.log('Updated vote history:', updated);  // Add debug log
      return updated;
    });
  };

  const handleTournamentComplete = async (finalRatings) => {
    try {
      if (!userName) {
        console.error('No user name available');
        return;
      }

      console.log('Starting tournament completion for user:', userName);
      console.log('Final vote history:', voteHistory);
      console.log('Final ratings:', finalRatings);

      // Convert finalRatings to array if it's an object
      const ratingsArray = Array.isArray(finalRatings) 
        ? finalRatings 
        : Object.entries(finalRatings).map(([name, rating]) => ({ name, rating }));

      // Initialize tournament results for all names
      const tournamentResults = {};
      ratingsArray.forEach(rating => {
        tournamentResults[rating.name] = { wins: 0, losses: 0 };
      });
      
      // Process vote history to count wins and losses
      voteHistory.forEach(vote => {
        const { match, result } = vote;
        const { left, right } = match;
        
        // Initialize if not exists (safety check)
        if (!tournamentResults[left.name]) tournamentResults[left.name] = { wins: 0, losses: 0 };
        if (!tournamentResults[right.name]) tournamentResults[right.name] = { wins: 0, losses: 0 };
        
        // Update based on numeric result
        if (result < -0.1) {  // left won (using threshold to account for floating point)
          tournamentResults[left.name].wins++;
          tournamentResults[right.name].losses++;
        } else if (result > 0.1) {  // right won
          tournamentResults[right.name].wins++;
          tournamentResults[left.name].losses++;
        }
        // For values near 0 (both/none), we don't update wins/losses
      });

      console.log('Tournament results:', tournamentResults);

      // Get name_ids from name_options table
      const { data: nameOptions, error: nameError } = await supabase
        .from('name_options')
        .select('id, name')
        .in('name', Object.keys(tournamentResults));

      if (nameError) {
        console.error('Error fetching name options:', nameError);
        return;
      }

      // Create a map of name to name_id
      const nameToIdMap = nameOptions.reduce((acc, { id, name }) => {
        acc[name] = id;
        return acc;
      }, {});

      // Prepare records for database update
      const recordsToUpsert = Object.entries(tournamentResults)
        .map(([name, results]) => {
          const name_id = nameToIdMap[name];
          if (!name_id) {
            console.warn(`No name_id found for ${name}`);
            return null;
          }

          // Get the final rating for this name
          const finalRating = ratingsArray.find(r => r.name === name)?.rating || 1500;
          
          // Get existing rating data
          const existingRating = ratings[name] || { wins: 0, losses: 0 };

          return {
            user_name: userName,
            name_id,
            rating: Math.round(finalRating),
            // Add new wins/losses to existing totals
            wins: (existingRating.wins || 0) + results.wins,
            losses: (existingRating.losses || 0) + results.losses,
            updated_at: new Date().toISOString()
          };
        })
        .filter(Boolean);

      console.log('Prepared records for upsert:', recordsToUpsert);

      if (recordsToUpsert.length > 0) {
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
        
        // Update local state with new ratings
        const updatedRatings = { ...ratings };
        recordsToUpsert.forEach(record => {
          const name = nameOptions.find(opt => opt.id === record.name_id)?.name;
          if (name) {
            updatedRatings[name] = {
              rating: record.rating,
              wins: record.wins,
              losses: record.losses
            };
          }
        });
        
        setRatings(updatedRatings);
      }

      // Set tournament as complete
      setTournamentComplete(true);
    } catch (error) {
      console.error('Error in tournament completion:', error);
    }
  };

  const handleStartNewTournament = () => {
    setTournamentComplete(false);
    setTournamentNames(null);
    setView('tournament');
  };

  const handleTournamentSetup = (names) => {
    console.log('App - Setting up tournament with names:', names);
    setIsTournamentLoading(true);
    
    // Set names directly without delay
    setTournamentNames(names.map(n => ({
      id: n.id,
      name: n.name,
      description: n.description,
      rating: ratings[n.name]?.rating || 1500
    })));
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Add effect to handle authentication state
  useEffect(() => {
    if (!isLoggedIn) {
      setView('tournament');
      setTournamentComplete(false);
      setTournamentNames(null);
      setVoteHistory([]);
    }
  }, [isLoggedIn]);

  // Update loading state effect
  useEffect(() => {
    if (tournamentNames === null) {
      setIsTournamentLoading(false);
    } else {
      setIsTournamentLoading(tournamentNames.length === 0);
    }
  }, [tournamentNames]);

  const renderMainContent = () => {
    if (!isLoggedIn) {
      return <Login onLogin={login} />;
    }

    switch (view) {
      case 'profile':
        return (
          <Profile 
            userName={userName}
            onStartNewTournament={handleStartNewTournament}
            ratings={ratings}
            onUpdateRatings={handleUpdateRatings}
          />
        );
      case 'tournament':
        if (tournamentComplete) {
          return (
            <Results 
              ratings={ratings}
              onStartNew={handleStartNewTournament}
              userName={userName}
              onUpdateRatings={handleUpdateRatings}
              currentTournamentNames={tournamentNames}
              voteHistory={voteHistory}
            />
          );
        }
        
        if (tournamentNames === null) {
          return (
            <TournamentSetup 
              onStart={handleTournamentSetup}
              userName={userName}
              existingRatings={ratings}
            />
          );
        }

        return (
          <ErrorBoundary>
            <Tournament 
              names={tournamentNames}
              existingRatings={ratings}
              onComplete={handleTournamentComplete}
              userName={userName}
              onVote={handleVoteHistoryUpdate}
            />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar 
        view={view}
        setView={setView}
        isLoggedIn={isLoggedIn}
        userName={userName}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {renderMainContent()}
      </div>
      
      {isTournamentLoading && (
        <div className="global-loading-overlay">
          <LoadingSpinner text="Initializing Tournament..." />
        </div>
      )}
    </div>
  );
}

export default App;