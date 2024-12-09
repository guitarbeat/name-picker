import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './App.module.scss';
import { Card } from './components/ui/Card/Card';
import { Button } from './components/ui/Button/Button';
import { NameInput } from './components/NameInput/NameInput';
import { Tournament } from './components/Tournament/Tournament';
import { Results } from './components/Results/Results';
import { useTournament } from './hooks/useTournament';
import { useSession } from './hooks/useSession';
import type { MatchResult, TournamentResult } from './types/tournament';
import { DEFAULT_NAMES } from './constants/names';
import {
  loadTournaments,
  addTournament,
  clearTournaments,
  exportData,
  importData,
} from './services/storage';
import { UserMenu } from './components/UserMenu/UserMenu';
import { TournamentHistory } from './components/TournamentHistory/TournamentHistory';

export function App() {
  const tournament = useTournament();
  const { session, login, logout, updatePreferences } = useSession();
  const [matchesPerPage, setMatchesPerPage] = useState(session?.preferences.matchesPerPage ?? 1);
  const [autoAdvance, setAutoAdvance] = useState(session?.preferences.autoAdvance ?? true);
  const [showTimer, setShowTimer] = useState(session?.preferences.showTimer ?? false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentResult[]>([]);

  // Update preferences when local state changes
  useEffect(() => {
    if (session) {
      updatePreferences({
        matchesPerPage,
        autoAdvance,
        showTimer,
      });
    }
  }, [matchesPerPage, autoAdvance, showTimer, session, updatePreferences]);

  // Load user preferences when session changes
  useEffect(() => {
    if (session) {
      setMatchesPerPage(session.preferences.matchesPerPage);
      setAutoAdvance(session.preferences.autoAdvance);
      setShowTimer(session.preferences.showTimer);
    }
  }, [session]);

  // Load tournaments from storage
  useEffect(() => {
    const storedTournaments = loadTournaments();
    setTournaments(storedTournaments);
  }, []);

  // Save tournament results
  useEffect(() => {
    if (tournament.state === 'results' && tournament.winner && session) {
      const result: TournamentResult = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        matches: tournament.allMatches,
        winner: tournament.winner,
        names: tournament.names,
        points: tournament.points,
      };
      addTournament(result);
      setTournaments(prev => [result, ...prev]);
    }
  }, [tournament.state, tournament.winner, session]);

  const handleMatchVote = (matchId: string, result: MatchResult) => {
    tournament.updateMatch(matchId, result);
    
    if (autoAdvance && tournament.currentMatchIndex < tournament.currentRound.length - 1) {
      setTimeout(() => {
        tournament.advanceToNextMatch();
      }, 500);
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    const currentPage = Math.floor(tournament.currentMatchIndex / matchesPerPage);
    const totalPages = Math.ceil(tournament.currentRound.length / matchesPerPage);
    const lastMatchOnPage = (currentPage + 1) * matchesPerPage - 1;
    const firstMatchOnPage = currentPage * matchesPerPage;

    if (direction === 'next') {
      if (tournament.currentMatchIndex < tournament.currentRound.length - 1) {
        tournament.advanceToNextMatch();
        // If we're at the last match of the current page and not the last page
        if (tournament.currentMatchIndex === lastMatchOnPage && currentPage < totalPages - 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      if (tournament.currentMatchIndex > 0) {
        tournament.goToPreviousMatch();
        // If we're moving to the previous page
        if (tournament.currentMatchIndex === firstMatchOnPage && currentPage > 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all tournament history?')) {
      clearTournaments();
      setTournaments([]);
    }
  };

  const handleLogin = (username: string) => {
    login(username);
    setIsAdmin(username.toLowerCase() === 'aaron');
  };

  const handleImport = async (file: File) => {
    try {
      const importedTournaments = await importData(file);
      setTournaments(importedTournaments);
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };

  const handleUpdatePreferences = (preferences: Record<string, unknown>) => {
    console.log('Update preferences:', preferences);
  };

  const handleStartCatTournament = () => {
    tournament.submitNames(DEFAULT_NAMES);
  };

  const handleStartCustomTournament = () => {
    tournament.reset();
    setShowCustomInput(true);
  };

  const handleCustomNamesSubmit = (names: string[]) => {
    tournament.submitNames(names);
    setShowCustomInput(false);
  };

  return (
    <div className={styles.app}>
      <div className={styles.background} />
      
      <header className={styles.header}>
        <h1>Name Tournament</h1>
        {session ? (
          <UserMenu
            session={session}
            onLogout={logout}
            onExport={() => exportData(tournaments)}
            onImport={handleImport}
            onUpdatePreferences={handleUpdatePreferences}
            isAdmin={isAdmin}
          />
        ) : (
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              const username = prompt('Enter username:');
              if (username) handleLogin(username);
            }}
          >
            Login
          </Button>
        )}
      </header>

      <main className={styles.main}>
        {tournament.state === 'tournament' && (
          <div className={styles.tournamentSection}>
            <div className={styles.controls}>
              <div className={styles.matchesPerPage}>
                <span>Matches per page:</span>
                {[1, 2, 4].map(num => (
                  <Button
                    key={num}
                    variant={matchesPerPage === num ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setMatchesPerPage(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className={styles.options}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setAutoAdvance(!autoAdvance)}
                >
                  Auto-advance {autoAdvance ? 'On' : 'Off'}
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setShowTimer(!showTimer)}
                >
                  {showTimer ? 'Hide Timer' : 'Show Timer'}
                </Button>
              </div>
            </div>

            <div className={styles.matches}>
              {tournament.currentRound.slice(0, matchesPerPage).map(match => (
                <Tournament
                  key={match.id}
                  currentMatch={match}
                  onVote={(result) => handleMatchVote(match.id, result)}
                  showTimer={showTimer}
                  autoAdvance={autoAdvance}
                  roundNumber={tournament.roundNumber}
                  totalMatches={tournament.currentRound.length}
                  currentMatchNumber={tournament.currentMatchIndex + 1}
                  onNavigate={handleNavigation}
                />
              ))}
            </div>
          </div>
        )}

        {tournament.state === 'input' && (
          <div className={styles.startSection}>
            <Card className={styles.startCard}>
              <h2>Ready to Pick a Name?</h2>
              <p>Start a new tournament!</p>
              {!showCustomInput && (
                <div className={styles.startOptions}>
                  <Button
                    variant="primary"
                    onClick={handleStartCatTournament}
                    className={styles.optionButton}
                  >
                    Cat Names Tournament
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleStartCustomTournament}
                    className={styles.optionButton}
                  >
                    Custom Names Tournament
                  </Button>
                </div>
              )}
              {showCustomInput && (
                <>
                  <NameInput onSubmit={handleCustomNamesSubmit} useDefaultNames={false} />
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomInput(false)}
                    className={styles.backButton}
                  >
                    Back to Options
                  </Button>
                </>
              )}
            </Card>
            <TournamentHistory 
              tournaments={tournaments}
              isAdmin={isAdmin}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {tournament.state === 'results' && tournament.winner && (
          <div className={styles.resultsSection}>
            <Results
              winner={tournament.winner}
              matches={tournament.allMatches}
              points={tournament.points}
              onRestart={tournament.reset}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 