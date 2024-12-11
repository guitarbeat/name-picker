import { useState, useCallback } from 'react';
import type { UserSession, UserPreferences } from '@features/user/types/session';
import {
  saveUserSessionToAPI,
  clearUserSessionFromAPI,
  loadUserSessionFromAPI
} from '../services/storage';

const DEFAULT_PREFERENCES: UserPreferences = {
  autoAdvance: true,
  showTimer: true,
  theme: 'light',
  matchesPerPage: 1
};

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const savedSession = await loadUserSessionFromAPI();
      setSession(savedSession);
      return savedSession;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }, []);

  const login = useCallback(async (username: string) => {
    const newSession: UserSession = {
      username,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: DEFAULT_PREFERENCES
    };

    try {
      await saveUserSessionToAPI(newSession);
      setSession(newSession);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, []);

  const saveSession = useCallback(async (updates: Partial<UserSession>) => {
    if (!session) return;

    const newSession = {
      ...session,
      ...updates,
      lastUpdatedAt: new Date().toISOString()
    };

    try {
      await saveUserSessionToAPI(newSession);
      setSession(newSession);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [session]);

  const clearSession = useCallback(async () => {
    try {
      await clearUserSessionFromAPI();
      setSession(null);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  return {
    session,
    login,
    loadSession,
    saveSession,
    clearSession
  };
}
