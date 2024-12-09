import { useState, useCallback } from 'react';
import type { Match, MatchResult, TournamentState as TournamentPhase } from '../types/tournament';
import {
  createInitialMatches,
  createNextRound,
  isRoundComplete,
  updateMatch as updateMatchUtil,
  getSortedNames,
} from '../utils/tournament';

interface TournamentStore {
  names: string[];
  currentRound: Match[];
  allMatches: Match[];
  state: TournamentPhase;
  currentMatchIndex: number;
  points: Record<string, number>;
  winner: string | null;
  roundNumber: number;
}

const initialState: TournamentStore = {
  names: [],
  currentRound: [],
  allMatches: [],
  state: 'input',
  currentMatchIndex: 0,
  points: {},
  winner: null,
  roundNumber: 0,
};

export function useTournament() {
  const [state, setState] = useState<TournamentStore>(initialState);

  const submitNames = useCallback((names: string[]) => {
    if (names.length < 2) return;

    const initialMatches = createInitialMatches(names);
    const points: Record<string, number> = {};

    // Initialize points for each name
    names.forEach(name => {
      points[name] = 0;
    });

    setState({
      ...initialState,
      names,
      currentRound: initialMatches,
      allMatches: initialMatches,
      state: 'tournament',
      points,
      roundNumber: 1,
    });
  }, []);

  const updateMatch = useCallback((matchId: string, result: MatchResult) => {
    setState(prev => {
      const match = prev.currentRound[prev.currentMatchIndex];
      if (!match || match.id !== matchId) return prev;

      const updatedMatches = updateMatchUtil(prev.allMatches, matchId, result);
      const updatedCurrentRound = updateMatchUtil(prev.currentRound, matchId, result);

      // Update points based on the result
      const updatedPoints = { ...prev.points };
      if (result === -1) {
        // First name wins
        updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 2;
        if (match.name2) updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 0;
      } else if (result === 1 && match.name2) {
        // Second name wins
        updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 0;
        updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 2;
      } else if (result === 0 && match.name2) {
        // Like both
        updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 1;
        updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 1;
      }
      // No points for "no opinion" (result === 2)

      const nextMatchIndex = prev.currentMatchIndex + 1;
      const roundComplete = isRoundComplete(updatedCurrentRound);

      if (roundComplete) {
        // Sort names by points to determine winners
        const sortedNames = getSortedNames(updatedMatches);

        if (sortedNames.length <= 2) {
          // Tournament is complete
          return {
            ...prev,
            state: 'results',
            winner: sortedNames[0],
            allMatches: updatedMatches,
            points: updatedPoints,
            roundNumber: prev.roundNumber + 1,
          };
        }

        // Create next round matches using sorted names
        const nextRound = createNextRound(updatedCurrentRound);

        return {
          ...prev,
          currentRound: nextRound,
          allMatches: [...updatedMatches, ...nextRound],
          currentMatchIndex: 0,
          points: updatedPoints,
          roundNumber: prev.roundNumber + 1,
        };
      }

      return {
        ...prev,
        currentMatchIndex: nextMatchIndex,
        currentRound: updatedCurrentRound,
        allMatches: updatedMatches,
        points: updatedPoints,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const advanceToNextMatch = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentMatchIndex: Math.min(prev.currentMatchIndex + 1, prev.currentRound.length - 1),
    }));
  }, []);

  const goToPreviousMatch = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentMatchIndex: Math.max(prev.currentMatchIndex - 1, 0),
    }));
  }, []);

  return {
    ...state,
    submitNames,
    updateMatch,
    reset,
    advanceToNextMatch,
    goToPreviousMatch,
  };
} 