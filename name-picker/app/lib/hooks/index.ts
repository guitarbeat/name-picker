import { useCallback } from "react";
import { create } from "zustand";
import type { Match, TournamentState } from "../types";

const initialState: TournamentState = {
  names: [],
  appState: "input",
  tournamentResults: [],
  matches: [],
  totalRounds: 0,
};

export const useTournamentStore = create<TournamentState>(() => initialState);

export const useTournamentState = () => {
  const state = useTournamentStore();

  const setNames = useCallback((names: string[]) => {
    useTournamentStore.setState({ names, appState: "sorting" });
  }, []);

  const setMatches = useCallback((matches: Match[]) => {
    useTournamentStore.setState({ matches });
  }, []);

  const setAppState = useCallback((appState: TournamentState["appState"]) => {
    useTournamentStore.setState({ appState });
  }, []);

  const reset = useCallback(() => {
    useTournamentStore.setState(initialState);
  }, []);

  return {
    ...state,
    setNames,
    setMatches,
    setAppState,
    reset,
  };
}; 