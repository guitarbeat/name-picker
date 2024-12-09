import type { TournamentResult, UserSession } from '../types/tournament';

// Storage keys used for localStorage operations
const STORAGE_KEYS = {
  TOURNAMENTS: 'tournaments',
  USER_SESSION: 'user_session',
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
 * Load tournaments from localStorage.
 * @returns {TournamentResult[]} Array of tournaments.
 */
export function loadTournaments(): TournamentResult[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`${ERROR_MESSAGES.LOAD_FAIL} tournaments`, error);
    return [];
  }
}

/**
 * Load user session from localStorage.
 * @returns {UserSession | null} The user session or null if not found.
 */
export function loadUserSession(): UserSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!stored) return null;

    const session = JSON.parse(stored);
    return session;
  } catch (error) {
    console.error(`${ERROR_MESSAGES.LOAD_FAIL} user session`, error);
    return null;
  }
}

/**
 * Save user session to localStorage.
 * @param {UserSession} session - The session to save.
 */
export function saveUserSession(session: UserSession): void {
  try {
    // Validate required fields
    if (!session.username || !session.createdAt) {
      throw new Error(`${ERROR_MESSAGES.VALIDATION_FAIL} missing required fields`);
    }

    // Update lastLoginAt
    const updatedSession = {
      ...session,
      lastLoginAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(updatedSession));
  } catch (error) {
    console.error(`${ERROR_MESSAGES.SAVE_FAIL} user session`, error);
    throw error; // Re-throw to allow handling by the caller
  }
}

/**
 * Add a new tournament and save it to localStorage.
 * @param {TournamentResult} tournament - Tournament data to add.
 */
export function addTournament(tournament: TournamentResult): void {
  try {
    const tournaments = loadTournaments();
    localStorage.setItem(
      STORAGE_KEYS.TOURNAMENTS,
      JSON.stringify([tournament, ...tournaments])
    );
  } catch (error) {
    console.error(`${ERROR_MESSAGES.SAVE_FAIL} tournament`, error);
    throw error;
  }
}

/**
 * Clear all tournaments from localStorage.
 */
export function clearTournaments(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENTS);
  } catch (error) {
    console.error(`${ERROR_MESSAGES.CLEAR_FAIL} tournaments`, error);
    throw error;
  }
}

/**
 * Clear user session from localStorage.
 */
export function clearUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  } catch (error) {
    console.error(`${ERROR_MESSAGES.CLEAR_FAIL} user session`, error);
    throw error;
  }
}

/**
 * Export tournament data as a JSON file.
 * @param {TournamentResult[]} tournaments - Array of tournament data to export.
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
 * Import tournament data from a JSON file.
 * @param {File} file - File object containing tournament data.
 * @returns {Promise<TournamentResult[]>} Promise resolving with the imported tournaments.
 */
export function importData(file: File): Promise<TournamentResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data.tournaments)) {
          throw new Error(`${ERROR_MESSAGES.VALIDATION_FAIL} missing tournaments array`);
        }
        localStorage.setItem(
          STORAGE_KEYS.TOURNAMENTS,
          JSON.stringify(data.tournaments)
        );
        resolve(data.tournaments);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error(`${ERROR_MESSAGES.IMPORT_FAIL} file`));
    reader.readAsText(file);
  });
}
