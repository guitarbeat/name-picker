import { Option } from './sortingLogic';

export interface TournamentResult {
  winner: Option;
  sortedList: Option[];
  timestamp: number;
  name?: string;
  userName: string;
}

const STORAGE_KEY = 'tournament-results';
const USER_KEY = 'current-user';

export function getCurrentUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setCurrentUser(userName: string): void {
  localStorage.setItem(USER_KEY, userName);
}

export function saveTournamentResult(result: Omit<TournamentResult, 'timestamp'>): TournamentResult {
  const userName = getCurrentUser();
  if (!userName) {
    throw new Error('No user name set');
  }

  const newResult = {
    ...result,
    timestamp: Date.now(),
    userName
  };

  // Get existing results
  const existingResults = getTournamentResults();
  
  // Add new result to the beginning
  const updatedResults = [newResult, ...existingResults];
  
  // Keep only the last 50 results to allow for multiple users
  const trimmedResults = updatedResults.slice(0, 50);
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedResults));
  
  return newResult;
}

export function getTournamentResults(): TournamentResult[] {
  try {
    const results = localStorage.getItem(STORAGE_KEY);
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Error reading tournament results:', error);
    return [];
  }
}

export function getTournamentResultsByUser(userName: string): TournamentResult[] {
  const results = getTournamentResults();
  return results.filter(result => result.userName === userName);
}

export function clearTournamentResults(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function renameTournament(timestamp: number, name: string): void {
  const results = getTournamentResults();
  const updatedResults = results.map(result => {
    if (result.timestamp === timestamp) {
      return { ...result, name };
    }
    return result;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
}
