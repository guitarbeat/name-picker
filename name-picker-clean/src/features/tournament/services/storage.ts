import type { TournamentResult } from '../types/tournament';
import type { UserSession } from '@features/user/types/session';

const TOURNAMENTS_KEY = 'tournaments';
const USER_SESSION_KEY = 'user_session';

export async function loadTournaments(): Promise<TournamentResult[]> {
  try {
    const data = localStorage.getItem(TOURNAMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tournaments:', error);
    return [];
  }
}

export async function saveTournament(tournament: TournamentResult): Promise<void> {
  try {
    const tournaments = await loadTournaments();
    tournaments.push(tournament);
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
  } catch (error) {
    console.error('Failed to save tournament:', error);
    throw new Error('Failed to save tournament');
  }
}

export async function clearTournaments(): Promise<void> {
  try {
    localStorage.removeItem(TOURNAMENTS_KEY);
  } catch (error) {
    console.error('Failed to clear tournaments:', error);
    throw new Error('Failed to clear tournaments');
  }
}

export async function saveUserSessionToAPI(session: UserSession): Promise<void> {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save user session:', error);
    throw new Error('Failed to save user session');
  }
}

export async function loadUserSessionFromAPI(): Promise<UserSession | null> {
  try {
    const data = localStorage.getItem(USER_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load user session:', error);
    return null;
  }
}

export async function clearUserSessionFromAPI(): Promise<void> {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear user session:', error);
    throw new Error('Failed to clear user session');
  }
} 