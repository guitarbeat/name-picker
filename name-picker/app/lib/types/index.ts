import type { ReactNode } from "react";

// Base Types
export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string;
}

// Tournament Types
export interface Player extends BaseEntity {
  name: string;
  seed?: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  winRate: number;
  averagePosition: number;
}

export type MatchResult = "1" | "2" | null;

export interface Match extends BaseEntity {
  name1: string;
  name2: string | null;
  winner: MatchResult;
  timestamp?: number;
  duration?: number;
  player1?: string;
  player2?: string;
}

export interface SavedList extends BaseEntity {
  name: string;
  items: string[];
  description?: string;
  tags?: string[];
  lastUsed?: string;
}

export interface TournamentResult extends BaseEntity {
  winner: Player;
  sortedList: Player[];
  matches: Match[];
  duration: number; // in milliseconds
  totalRounds: number;
  stats: TournamentStats;
}

export interface TournamentStats {
  averageMatchDuration: number;
  totalMatches: number;
  upsets: number; // number of times a lower seed beat a higher seed
  longestMatch: Match;
  shortestMatch: Match;
}

// Application State Types
export type AppState = "input" | "sorting" | "results";

export interface TournamentState {
  names: string[];
  appState: AppState;
  tournamentResults: TournamentResult[];
  matches: Match[];
  totalRounds: number;
  currentRound?: number;
  isLoading?: boolean;
  error?: Error;
}

// Theme Types
export type ColorMode = "light" | "dark" | "system";

export interface ThemeConfig {
  colorMode: ColorMode;
  useSystemColorMode: boolean;
}

// Component Props Types
export type WithChildren<P = Record<string, unknown>> = P & {
  children: ReactNode;
};

export type WithClassName<P = Record<string, unknown>> = P & {
  className?: string;
}; 