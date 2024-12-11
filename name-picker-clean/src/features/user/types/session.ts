export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  autoAdvance: boolean;
  showTimer: boolean;
  matchesPerPage: number;
  theme: Theme;
}

export interface UserSession {
  username: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
  metadata?: {
    displayName?: string;
    avatar?: string;
    bio?: string;
  };
} 