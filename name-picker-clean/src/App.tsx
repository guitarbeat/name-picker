import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './App.module.scss';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { NameInput } from './components/NameInput';
import { Tournament } from './components/Tournament';
import { Results } from './components/Results';
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
import { UserMenu } from './components/UserMenu';
import { TournamentHistory } from './components/TournamentHistory';

export function App() {
  const tournament = useTournament();
  const { session, login, logout, updatePreferences } = useSession();
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout>();
  const isAutoAdvancingRef = useRef(false);
  const [matchesPerPage, setMatchesPerPage] = useState(session?.preferences.matchesPerPage ?? 1);
  const [autoAdvance, setAutoAdvance] = useState(session?.preferences.autoAdvance ?? true);
  const [showTimer, setShowTimer] = useState(session?.preferences.showTimer ?? false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentResult[]>([]);

  // Combined preferences effect
  useEffect(() => {
    const isInitialLoad = session && !matchesPerPage && !autoAdvance && !showTimer;
    
    if (isInitialLoad) {
      // Load initial preferences from session
      setMatchesPerPage(session.preferences.matchesPerPage);
      setAutoAdvance(session.preferences.autoAdvance);
      setShowTimer(session.preferences.showTimer);
    } else if (session) {
      // Update preferences when local state changes
      const debounceTimeout = setTimeout(() => {
        updatePreferences({
          matchesPerPage,
          autoAdvance,
          showTimer,
        });
      }, 300); // Debounce preference updates

      return () => clearTimeout(debounceTimeout);
    }
  }, [matchesPerPage, autoAdvance, showTimer, session, updatePreferences]);

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
    // Clear any existing timeout and reset state
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = undefined;
    }
    isAutoAdvancingRef.current = false;

    tournament.updateMatch(matchId, result);
    
    if (autoAdvance && tournament.currentMatchIndex < tournament.currentRound.length - 1) {
      isAutoAdvancingRef.current = true;
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (isAutoAdvancingRef.current) {
          tournament.advanceToNextMatch();
          isAutoAdvancingRef.current = false;
        }
      }, 500);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = undefined;
      }
      isAutoAdvancingRef.current = false;
    };
  }, []);

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

  const validateTournamentData = (data: unknown): data is TournamentResult[] => {
    if (!Array.isArray(data)) return false;
    
    return data.every(item => {
      if (typeof item !== 'object' || item === null) return false;
      
      const hasRequiredFields = 
        'id' in item &&
        'createdAt' in item &&
        'matches' in item &&
        'winner' in item &&
        'names' in item &&
        'points' in item;
      
      if (!hasRequiredFields) return false;
      
      // Validate matches array
      if (!Array.isArray(item.matches)) return false;
      return item.matches.every((match: unknown) => {
        if (typeof match !== 'object' || match === null) return false;
        const m = match as Record<string, unknown>;
        return (
          typeof m.id === 'string' &&
          typeof m.name1 === 'string' &&
          (m.name2 === null || typeof m.name2 === 'string') &&
          (m.winner === null || (typeof m.winner === 'number' && [-1, 0, 1, 2].includes(m.winner))) &&
          typeof m.timestamp === 'number' &&
          typeof m.createdAt === 'string'
        );
      });
    });
  };

  const handleImport = async (file: File) => {
    try {
      if (!file) {
        throw new Error('NO_FILE');
      }

      if (!file.name.endsWith('.json')) {
        throw new Error('INVALID_FORMAT');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('FILE_TOO_LARGE');
      }

      const fileContent = await file.text();
      let importedData;
      try {
        importedData = JSON.parse(fileContent);
      } catch {
        throw new Error('INVALID_JSON');
      }

      if (!validateTournamentData(importedData)) {
        throw new Error('INVALID_DATA_STRUCTURE');
      }

      setTournaments(importedData);
    } catch (error) {
      console.error('Import error:', error);
      
      const errorMessages = {
        'NO_FILE': 'No file selected for import.',
        'INVALID_FORMAT': 'Please select a valid JSON file.',
        'FILE_TOO_LARGE': 'File size exceeds 10MB limit.',
        'INVALID_JSON': 'Invalid JSON format.',
        'INVALID_DATA_STRUCTURE': 'Invalid tournament data structure.',
      } as const;

      const errorMessage = error instanceof Error && error.message in errorMessages
        ? errorMessages[error.message as keyof typeof errorMessages]
        : 'Failed to import data. Please try again.';

      alert(errorMessage);
    }
  };

  const handleUpdatePreferences = (preferences: Record<string, unknown>) => {
    if (!session) return;

    const validatedPreferences = {
      matchesPerPage: typeof preferences.matchesPerPage === 'number' ? preferences.matchesPerPage : matchesPerPage,
      autoAdvance: typeof preferences.autoAdvance === 'boolean' ? preferences.autoAdvance : autoAdvance,
      showTimer: typeof preferences.showTimer === 'boolean' ? preferences.showTimer : showTimer,
    };

    setMatchesPerPage(validatedPreferences.matchesPerPage);
    setAutoAdvance(validatedPreferences.autoAdvance);
    setShowTimer(validatedPreferences.showTimer);
    updatePreferences(validatedPreferences);
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
    <div className={styles.app} role="application">
      <div className={styles.background} aria-hidden="true" />
      
      <header className={styles.header} role="banner">
        <h1>Name Tournament</h1>
        {session ? (
          <UserMenu
            session={session}
            onLogout={logout}
            onExport={() => exportData(tournaments)}
            onImport={handleImport}
            onUpdatePreferences={handleUpdatePreferences}
            isAdmin={isAdmin}
            aria-label="User menu"
          />
        ) : (
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              const username = prompt('Enter username:');
              if (username) handleLogin(username);
            }}
            aria-label="Login"
          >
            Login
          </Button>
        )}
      </header>

      <main className={styles.main} role="main">
        <div aria-live="polite" aria-atomic="true">
          {tournament.state === 'results' && (
            <div role="status">Tournament completed! Winner: {tournament.winner}</div>
          )}
        </div>

        <div 
          role="region" 
          aria-label="Tournament matches"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') handleNavigation('prev');
            if (e.key === 'ArrowRight') handleNavigation('next');
          }}
          tabIndex={0}
        >
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
        </div>
      </main>
    </div>
  );
}

export default App; 