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
import type { MatchResult, TournamentResult, Match } from './types/tournament';
import { DEFAULT_NAMES } from './constants/names';
import {
  loadTournaments,
  addTournamentToAPI,
  clearTournamentsFromAPI,
  exportData,
  importData,
} from './services/storage';
import { UserMenu } from './components/UserMenu';
import { TournamentHistory } from './components/TournamentHistory';

// Type guard for tournament winner
function isValidWinner(winner: string | null): winner is string {
  return typeof winner === 'string' && winner.length > 0;
}

// Helper function to create tournament result
function createTournamentResult(
  winner: string,
  matches: Match[],
  names: string[],
  points: Record<string, number>
): TournamentResult {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    matches,
    winner,
    names,
    points,
  };
}

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

  // Synchronize UI state with session preferences
  useEffect(() => {
    if (!session) return;

    const syncPreferences = () => {
      setMatchesPerPage(session.preferences.matchesPerPage ?? 1);
      setAutoAdvance(session.preferences.autoAdvance ?? true);
      setShowTimer(session.preferences.showTimer ?? false);
    };

    // Initial sync
    syncPreferences();

    // Set up interval to check for session changes
    const syncInterval = setInterval(syncPreferences, 1000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [session]);

  // Debounced preference updates
  useEffect(() => {
    if (!session) return;

    const debounceTimeout = setTimeout(() => {
      updatePreferences({
        matchesPerPage,
        autoAdvance,
        showTimer,
      });
    }, 300);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [matchesPerPage, autoAdvance, showTimer, session, updatePreferences]);

  // Tournament state cleanup
  useEffect(() => {
    let mounted = true;

    const saveTournament = async (winner: string) => {
      const result = createTournamentResult(
        winner,
        tournament.allMatches,
        tournament.names,
        tournament.points
      );
      await addTournamentToAPI(result);
      if (mounted) {
        setTournaments(prev => [result, ...prev]);
      }
    };

    // Save tournament results
    if (tournament.state === 'results' && tournament.winner && session && mounted) {
      if (isValidWinner(tournament.winner)) {
        saveTournament(tournament.winner);
      }
    }

    return () => {
      mounted = false;
    };
  }, [tournament.state, tournament.winner, session, tournament.allMatches, tournament.names, tournament.points]);

  // Load tournaments with cleanup
  useEffect(() => {
    let mounted = true;

    const loadStoredTournaments = async () => {
      try {
        const storedTournaments = await loadTournaments();
        if (mounted) {
          setTournaments(storedTournaments);
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
        if (mounted) {
          setTournaments([]); // Set empty array on error
        }
      }
    };

    loadStoredTournaments();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-advance cleanup
  useEffect(() => {
    const currentTimeout = autoAdvanceTimeoutRef.current;

    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        autoAdvanceTimeoutRef.current = undefined;
      }
      isAutoAdvancingRef.current = false;
    };
  }, []);

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

  const handleNavigation = (direction: 'prev' | 'next') => {
    const currentPage = Math.floor(tournament.currentMatchIndex / matchesPerPage);
    const totalPages = Math.ceil(tournament.currentRound.length / matchesPerPage);
    const lastMatchOnPage = (currentPage + 1) * matchesPerPage - 1;
    const firstMatchOnPage = currentPage * matchesPerPage;

    if (direction === 'next') {
      if (tournament.currentMatchIndex < tournament.currentRound.length - 1) {
        tournament.advanceToNextMatch();
        if (tournament.currentMatchIndex === lastMatchOnPage && currentPage < totalPages - 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      if (tournament.currentMatchIndex > 0) {
        tournament.goToPreviousMatch();
        if (tournament.currentMatchIndex === firstMatchOnPage && currentPage > 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  // Navigation event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleNavigation('prev');
      if (e.key === 'ArrowRight') handleNavigation('next');
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNavigation]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all tournament history?')) {
      await clearTournamentsFromAPI();
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
        <h1>Help Name My Cat! 🐱</h1>
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
              const username = prompt('Enter your name to help me choose:');
              if (username) handleLogin(username);
            }}
            aria-label="Join naming tournament"
          >
            Join Tournament
          </Button>
        )}
      </header>

      <main className={styles.main} role="main">
        {tournament.state === 'input' && (
          <div className={styles.welcomeSection}>
            <h2>Ready to Help Choose a Name?</h2>
            <p className={styles.welcomeText}>
              Thanks for helping me name my new cat! This is a fun tournament where you'll vote between different name options.
              It only takes a few minutes, and your votes will help me pick the perfect name.
            </p>
            
            <div className={styles.startOptions}>
              <div className={styles.tournamentOption}>
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleStartCatTournament}
                  className={styles.optionButton}
                >
                  <span className={styles.buttonTitle}>Use Suggested Cat Names</span>
                  <span className={styles.buttonDescription}>Vote on a curated list of cat names</span>
                </Button>
              </div>

              <div className={styles.tournamentOption}>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleStartCustomTournament}
                  className={styles.optionButton}
                >
                  <span className={styles.buttonTitle}>Enter Custom Names</span>
                  <span className={styles.buttonDescription}>Add your own name suggestions</span>
                </Button>
              </div>
            </div>

            {!session && (
              <p className={styles.loginPrompt}>
                👋 Enter your name above to get started and help me choose!
              </p>
            )}
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {tournament.state === 'results' && (
            <div role="status" className={styles.results}>
              Tournament completed! Winner: {tournament.winner}
            </div>
          )}
        </div>

        {tournament.state === 'tournament' && (
          <Tournament
            currentMatch={tournament.currentRound[tournament.currentMatchIndex]}
            onVote={(result) => handleMatchVote(tournament.currentRound[tournament.currentMatchIndex].id, result)}
            showTimer={showTimer}
            autoAdvance={autoAdvance}
            roundNumber={tournament.roundNumber}
            totalMatches={tournament.currentRound.length}
            currentMatchNumber={tournament.currentMatchIndex + 1}
            onNavigate={handleNavigation}
          />
        )}

        {tournament.state === 'results' && tournament.winner && (
          <Results
            winner={tournament.winner}
            matches={tournament.allMatches}
            points={tournament.points}
            onRestart={tournament.reset}
          />
        )}

        {showCustomInput && (
          <NameInput
            onSubmit={handleCustomNamesSubmit}
            useDefaultNames={false}
          />
        )}

        {session && tournaments.length > 0 && (
          <TournamentHistory
            tournaments={tournaments}
            isAdmin={isAdmin}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>
    </div>
  );
}

export default App; 