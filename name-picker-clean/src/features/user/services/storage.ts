import type { UserSession } from '@features/user/types/session';

const SESSION_KEY = 'user_session';

export async function loadUserSessionFromAPI(): Promise<UserSession | null> {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Failed to load user session:', error);
    return null;
  }
}

export async function saveUserSessionToAPI(session: UserSession): Promise<void> {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save user session:', error);
    throw error;
  }
}

export async function clearUserSessionFromAPI(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear user session:', error);
    throw error;
  }
} 