import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type TournamentState,
  type Match,
  type TournamentResult,
  type Player,
  type BaseEntity,
} from "../types";
import { createEntity } from "../utils";

interface TournamentStore extends TournamentState {
  // Actions
  setNames: (names: string[]) => void;
  setAppState: (state: TournamentState["appState"]) => void;
  addTournamentResult: (result: Omit<TournamentResult, keyof BaseEntity>) => void;
  setMatches: (matches: Match[]) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  reset: () => void;
  
  // Tournament Actions
  startTournament: (names: string[]) => void;
  completeTournament: (sortedNames: string[], matchHistory: Match[]) => void;
  
  // Loading State
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | undefined) => void;
}

const initialState: TournamentState = {
  names: [],
  appState: "input",
  tournamentResults: [],
  matches: [],
  totalRounds: 0,
  isLoading: false,
};

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Basic State Updates
      setNames: (names) => set({ names }),
      setAppState: (appState) => set({ appState }),
      setMatches: (matches) => set({ matches }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Match Updates
      updateMatch: (matchId, updates) =>
        set((state) => ({
          matches: state.matches.map((match) =>
            match.id === matchId ? { ...match, ...updates } : match,
          ),
        })),

      // Tournament Results
      addTournamentResult: (result) => {
        const newResult = createEntity(result);
        set((state) => ({
          tournamentResults: [newResult, ...state.tournamentResults],
        }));
      },

      // Complex Actions
      startTournament: (names) => {
        set({
          names,
          appState: "sorting",
          matches: [],
          totalRounds: Math.ceil(Math.log2(names.length)),
          currentRound: 1,
          isLoading: false,
          error: undefined,
        });
      },

      completeTournament: (sortedNames, matchHistory) => {
        const state = get();
        const winner = createEntity<Omit<Player, keyof BaseEntity>>({
          name: sortedNames[0],
        });

        const sortedList = sortedNames.map((name, index) =>
          createEntity<Omit<Player, keyof BaseEntity>>({
            name,
            seed: index + 1,
          }),
        );

        const startTime = matchHistory[0]?.timestamp || Date.now();
        const duration = Date.now() - startTime;

        const result = createEntity<Omit<TournamentResult, keyof BaseEntity>>({
          winner,
          sortedList,
          matches: matchHistory,
          duration,
          totalRounds: state.totalRounds,
          stats: {
            averageMatchDuration:
              matchHistory.reduce(
                (acc, match) => acc + (match.duration || 0),
                0,
              ) / matchHistory.length,
            totalMatches: matchHistory.length,
            upsets: matchHistory.filter(
              (match) =>
                match.winner === "2" &&
                sortedList.findIndex((p) => p.name === match.player1) <
                  sortedList.findIndex((p) => p.name === match.player2),
            ).length,
            longestMatch: matchHistory.reduce(
              (longest, match) =>
                (match.duration || 0) > (longest.duration || 0)
                  ? match
                  : longest,
              matchHistory[0],
            ),
            shortestMatch: matchHistory.reduce(
              (shortest, match) =>
                (match.duration || 0) < (shortest.duration || 0)
                  ? match
                  : shortest,
              matchHistory[0],
            ),
          },
        });

        set((state) => ({
          appState: "results",
          tournamentResults: [result, ...state.tournamentResults],
          matches: matchHistory,
        }));
      },

      // Reset
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "tournament-storage",
      partialize: (state) => ({
        tournamentResults: state.tournamentResults,
      }),
    },
  ),
); 