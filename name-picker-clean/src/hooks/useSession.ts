import { useState, useCallback, useEffect } from 'react';
import type { UserSession, UserPreferences } from '../types/tournament';
import { 
  loadUserSession, 
  saveUserSessionToAPI, 
  clearUserSessionFromAPI 
} from '../services/storage';

// Default preferences for a new user session
const DEFAULT_PREFERENCES: UserPreferences = {
  autoAdvance: true,
  showTimer: true,
  matchesPerPage: 1,
  theme: 'system',
};

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);

  // Load the session from storage on component mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = await loadUserSession();
        if (savedSession) {
          setSession(savedSession);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
      }
    };
    loadSession();
  }, []);

  // Log in a user by creating a new session
  const login = useCallback(async (username: string) => {
    try {
      const newSession: UserSession = {
        username,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: DEFAULT_PREFERENCES,
      };
      await saveUserSessionToAPI(newSession);
      setSession(newSession);
    } catch (error) {
      console.error('Failed to create user session:', error);
    }
  }, []);

  // Log out the user by clearing the session
  const logout = useCallback(async () => {
    try {
      await clearUserSessionFromAPI();
      setSession(null);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }, []);

  // Update the user's preferences
  const updatePreferences = useCallback(
    async (updatedPreferences: Partial<UserPreferences>) => {
      if (session) {
        const newSession = {
          ...session,
          preferences: {
            ...session.preferences,
            ...updatedPreferences,
          },
        };
        try {
          await saveUserSessionToAPI(newSession);
          setSession(newSession);
        } catch (error) {
          console.error('Failed to update user preferences:', error);
        }
      }
    },
    [session]
  );

  return { session, login, logout, updatePreferences };
}
