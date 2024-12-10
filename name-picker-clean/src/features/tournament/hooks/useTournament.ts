import { useState, useCallback, useRef, useEffect } from 'react';
import type { Match, MatchResult, TournamentState as TournamentPhase } from '../types/tournament';
import {
  createInitialMatches,
  createNextRound,
  isRoundComplete,
  updateMatch as updateMatchUtil,
  getSortedNames,
} from '@features/tournament/utils/tournament';

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
  const stateRef = useRef(state);
  const pendingUpdatesRef = useRef<(() => void)[]>([]);
  const isProcessingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Process pending updates
  const processPendingUpdates = useCallback(() => {
    if (isProcessingRef.current || pendingUpdatesRef.current.length === 0) return;

    isProcessingRef.current = true;
    while (pendingUpdatesRef.current.length > 0) {
      const update = pendingUpdatesRef.current.shift();
      update?.();
    }
    isProcessingRef.current = false;
  }, []);

  // Queue state update
  const queueUpdate = useCallback((update: () => void) => {
    pendingUpdatesRef.current.push(update);
    processPendingUpdates();
  }, [processPendingUpdates]);

  const submitNames = useCallback((names: string[]) => {
    if (names.length < 2) return;

    queueUpdate(() => {
      const initialMatches = createInitialMatches(names);
      const points: Record<string, number> = {};

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
    });
  }, [queueUpdate]);

  const updateMatch = useCallback((matchId: string, result: MatchResult) => {
    queueUpdate(() => {
      setState(prev => {
        const match = prev.currentRound[prev.currentMatchIndex];
        if (!match || match.id !== matchId) return prev;

        const updatedMatches = updateMatchUtil(prev.allMatches, matchId, result);
        const updatedCurrentRound = updateMatchUtil(prev.currentRound, matchId, result);
        const updatedPoints = { ...prev.points };

        if (result === -1) {
          updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 2;
          if (match.name2) updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 0;
        } else if (result === 1 && match.name2) {
          updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 0;
          updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 2;
        } else if (result === 0 && match.name2) {
          updatedPoints[match.name1] = (updatedPoints[match.name1] || 0) + 1;
          updatedPoints[match.name2] = (updatedPoints[match.name2] || 0) + 1;
        }

        const nextMatchIndex = prev.currentMatchIndex + 1;
        const roundComplete = isRoundComplete(updatedCurrentRound);

        if (roundComplete) {
          const sortedNames = getSortedNames(updatedMatches);

          if (sortedNames.length <= 2) {
            return {
              ...prev,
              state: 'results',
              winner: sortedNames[0],
              allMatches: updatedMatches,
              points: updatedPoints,
              roundNumber: prev.roundNumber + 1,
            };
          }

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
    });
  }, [queueUpdate]);

  const reset = useCallback(() => {
    queueUpdate(() => {
      setState(initialState);
    });
  }, [queueUpdate]);

  const advanceToNextMatch = useCallback(() => {
    queueUpdate(() => {
      setState(prev => ({
        ...prev,
        currentMatchIndex: Math.min(prev.currentMatchIndex + 1, prev.currentRound.length - 1),
      }));
    });
  }, [queueUpdate]);

  const goToPreviousMatch = useCallback(() => {
    queueUpdate(() => {
      setState(prev => ({
        ...prev,
        currentMatchIndex: Math.max(prev.currentMatchIndex - 1, 0),
      }));
    });
  }, [queueUpdate]);

  // Cleanup
  useEffect(() => {
    return () => {
      pendingUpdatesRef.current = [];
      isProcessingRef.current = false;
    };
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