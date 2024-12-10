// Types for Match and Tournament

/**
 * Result of a match.
 * -1: Player 1 loses, 0: Draw, 1: Player 1 wins, 2: Match not played.
 */
export type MatchResult = -1 | 0 | 1 | 2;

/**
 * Represents a single match in the tournament.
 */
export interface Match {
  id: string;                  // Unique identifier for the match
  name1: string;               // Name of the first participant
  name2: string | null;        // Name of the second participant, or null if it's a bye
  winner: number | null;      // Result of the match
  timestamp: number;           // Unix timestamp for the match
  createdAt: string;           // Date when the match was created
}

/**
 * Represents the result of an entire tournament.
 */
export interface TournamentResult {
  id: string;                           // Unique identifier for the tournament
  createdAt: string;             // Creation date of the tournament
  matches: Match[];                     // List of matches in the tournament
  winner: string;                       // Name of the tournament winner
  names: string[];                      // List of participant names
  points: Record<string, number>;       // Points scored by each participant
}

// Types for Tournament State

/**
 * Current state of the tournament process.
 */
export type TournamentState = 'input' | 'tournament' | 'results';

/**
 * Represents the state of the tournament in progress.
 */
export interface TournamentStore {
  state: TournamentState;               // Current state of the tournament
  names: string[];                      // List of participant names
  currentRound: Match[];                // Matches in the current round
  allMatches: Match[];                  // All matches in the tournament
  currentMatchIndex: number;            // Index of the current match being played
  points: Record<string, number>;       // Points scored by each participant
  winner: string | null;                // Name of the tournament winner, or null if undecided
}

// Types for User Preferences and Sessions

/**
 * Themes supported by the application.
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Represents user preferences for the application.
 */
export interface UserPreferences {
  autoAdvance: boolean;                 // Whether to auto-advance between matches
  showTimer: boolean;                   // Whether to display timers during matches
  matchesPerPage: number;               // Number of matches displayed per page
  theme: Theme;                         // Preferred theme
}

/**
 * Represents a user session in the application.
 */
export interface UserSession {
  username: string;                     // Unique username of the user
  createdAt: Date | string;             // Date when the account was created
  lastLoginAt: Date | string;           // Date of the user's last login
  preferences: UserPreferences;         // User preferences
  metadata?: {                          // Optional additional metadata about the user
    displayName?: string;               // Display name of the user
    avatar?: string;                    // URL of the user's avatar
    bio?: string;                       // User bio
  };
}
