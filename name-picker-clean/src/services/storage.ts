import type { TournamentResult, UserSession } from '../types/tournament';
import { getTournaments, addTournament, clearTournaments, importTournaments } from '../api/tournaments';
import { getUserSession, saveUserSession, clearUserSession } from '../api/sessions';

// Cache keys for localStorage
const CACHE_KEYS = {
  TOURNAMENTS: 'cached_tournaments',
  USER_SESSION: 'cached_user_session',
} as const;

// Common error messages
const ERROR_MESSAGES = {
  LOAD_FAIL: 'Failed to load data:',
  SAVE_FAIL: 'Failed to save data:',
  CLEAR_FAIL: 'Failed to clear data:',
  EXPORT_FAIL: 'Failed to export data:',
  IMPORT_FAIL: 'Failed to import data:',
  VALIDATION_FAIL: 'Data validation failed:',
};

/**
 * Load tournaments with local caching.
 */
export async function loadTournaments(): Promise<TournamentResult[]> {
  try {
    // Try to get from cache first
    const cached = localStorage.getItem(CACHE_KEYS.TOURNAMENTS);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch from API
    const tournaments = await getTournaments();
    
    // Cache the results
    localStorage.setItem(CACHE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    return tournaments;
  } catch (error) {
    console.error(`${ERROR_MESSAGES.LOAD_FAIL} tournaments`, error);
    return [];
  }
}

/**
 * Load user session with local caching.
 */
export async function loadUserSession(): Promise<UserSession | null> {
  try {
    // Try to get from cache first
    const cached = localStorage.getItem(CACHE_KEYS.USER_SESSION);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch from API
    const session = await getUserSession();
    
    // Cache the results if we got them
    if (session) {
      localStorage.setItem(CACHE_KEYS.USER_SESSION, JSON.stringify(session));
    }
    return session;
  } catch (error) {
    console.error(`${ERROR_MESSAGES.LOAD_FAIL} user session`, error);
    return null;
  }
}

/**
 * Save user session and update cache.
 */
export async function saveUserSessionToAPI(session: UserSession): Promise<void> {
  try {
    if (!session.username || !session.createdAt) {
      throw new Error(`${ERROR_MESSAGES.VALIDATION_FAIL} missing required fields`);
    }

    await saveUserSession(session);
    localStorage.setItem(CACHE_KEYS.USER_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error(`${ERROR_MESSAGES.SAVE_FAIL} user session`, error);
    throw error;
  }
}

/**
 * Add a new tournament and update cache.
 */
export async function addTournamentToAPI(tournament: TournamentResult): Promise<void> {
  try {
    await addTournament(tournament);
    
    // Update cache with new tournament
    const cached = await loadTournaments();
    localStorage.setItem(
      CACHE_KEYS.TOURNAMENTS,
      JSON.stringify([tournament, ...cached])
    );
  } catch (error) {
    console.error(`${ERROR_MESSAGES.SAVE_FAIL} tournament`, error);
    throw error;
  }
}

/**
 * Clear all tournaments and cache.
 */
export async function clearTournamentsFromAPI(): Promise<void> {
  try {
    await clearTournaments();
    localStorage.removeItem(CACHE_KEYS.TOURNAMENTS);
  } catch (error) {
    console.error(`${ERROR_MESSAGES.CLEAR_FAIL} tournaments`, error);
    throw error;
  }
}

/**
 * Clear user session and cache.
 */
export async function clearUserSessionFromAPI(): Promise<void> {
  try {
    await clearUserSession();
    localStorage.removeItem(CACHE_KEYS.USER_SESSION);
  } catch (error) {
    console.error(`${ERROR_MESSAGES.CLEAR_FAIL} user session`, error);
    throw error;
  }
}

/**
 * Export tournament data as a JSON file.
 */
export function exportData(tournaments: TournamentResult[]): void {
  try {
    const data = {
      tournaments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tournament-data-${new Date().toISOString()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(ERROR_MESSAGES.EXPORT_FAIL, error);
    throw error;
  }
}

/**
 * Import tournament data and update cache.
 */
export async function importData(file: File): Promise<TournamentResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data.tournaments)) {
          throw new Error(`${ERROR_MESSAGES.VALIDATION_FAIL} missing tournaments array`);
        }
        await importTournaments(data.tournaments);
        
        // Update cache with imported tournaments
        localStorage.setItem(CACHE_KEYS.TOURNAMENTS, JSON.stringify(data.tournaments));
        resolve(data.tournaments);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error(`${ERROR_MESSAGES.IMPORT_FAIL} file`));
    reader.readAsText(file);
  });
} 