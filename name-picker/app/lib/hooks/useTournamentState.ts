import { useState, useCallback } from 'react';
import { TournamentResult, Match } from '../types';

type AppState = "input" | "sorting";

interface TournamentState {
  names: string[];
  appState: AppState;
  tournamentResults: TournamentResult[];
  matches: Match[];
  totalRounds: number;
}

export function useTournamentState() {
  const [state, setState] = useState<TournamentState>({
    names: [],
    appState: "input",
    tournamentResults: [],
    matches: [],
    totalRounds: 0,
  });

  const handleNamesSubmit = useCallback((nameList: string[]) => {
    setState((prev) => ({
      ...prev,
      names: nameList,
      appState: "sorting",
    }));
  }, []);

  const handleSortingComplete = useCallback(
    (sortedNames: string[], matchHistory: Match[]) => {
      const now = new Date().toISOString();
      const totalRounds = Math.ceil(Math.log2(sortedNames.length));
      
      const result: TournamentResult = {
        id: crypto.randomUUID(),
        createdAt: now,
        winner: { 
          id: "1", 
          name: sortedNames[0],
          createdAt: now,
        },
        sortedList: sortedNames.map((name, index) => ({
          id: String(index + 1),
          name,
          createdAt: now,
        })),
        matches: matchHistory,
        duration: 0, // TODO: Track actual duration
        totalRounds,
        stats: {
          averageMatchDuration: 0, // TODO: Calculate actual stats
          totalMatches: matchHistory.length,
          upsets: 0, // TODO: Track upsets
          longestMatch: matchHistory[0], // TODO: Track actual longest match
          shortestMatch: matchHistory[0], // TODO: Track actual shortest match
        },
      };

      setState((prev) => ({
        ...prev,
        tournamentResults: [result, ...prev.tournamentResults],
        matches: matchHistory,
        totalRounds,
        appState: "input",
      }));
    },
    []
  );

  const loadList = useCallback((list: string[]) => {
    setState((prev) => ({
      ...prev,
      names: list,
      appState: "sorting",
    }));
  }, []);

  return {
    state,
    handleNamesSubmit,
    handleSortingComplete,
    loadList,
  };
} 