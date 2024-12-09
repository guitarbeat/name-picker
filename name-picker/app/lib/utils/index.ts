import { type BaseEntity, type ID } from "../types";

/**
 * Generates a unique identifier
 */
export const generateId = (): ID => crypto.randomUUID();

/**
 * Gets the current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => new Date().toISOString();

/**
 * Creates a new entity with ID and timestamp
 */
export function createEntity<T>(data: T): T & BaseEntity {
  return {
    ...data,
    id: generateId(),
    createdAt: getCurrentTimestamp(),
  };
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Chunks an array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  return array.reduce((chunks, item, index) => {
    const chunkIndex = Math.floor(index / size);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(item);
    return chunks;
  }, [] as T[][]);
}

/**
 * Formats a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Debounces a function
 */
export function debounce<Args extends unknown[], R>(
  func: (...args: Args) => R,
  wait: number,
): (...args: Args) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 */
export function throttle<Args extends unknown[], R>(
  func: (...args: Args) => R,
  limit: number,
): (...args: Args) => void {
  let inThrottle = false;

  return function executedFunction(...args: Args): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates tournament brackets from a list of names
 */
export function generateTournamentBrackets(names: string[]): {
  rounds: number;
  matches: Array<[string, string]>;
} {
  const totalPlayers = names.length;
  const rounds = Math.ceil(Math.log2(totalPlayers));
  const totalSlots = Math.pow(2, rounds);
  const byes = totalSlots - totalPlayers;

  // Pad the names array with byes
  const paddedNames = [...names];
  for (let i = 0; i < byes; i++) {
    paddedNames.push("BYE");
  }

  // Generate matches
  const matches: Array<[string, string]> = [];
  for (let i = 0; i < paddedNames.length; i += 2) {
    matches.push([paddedNames[i], paddedNames[i + 1]]);
  }

  return {
    rounds,
    matches,
  };
} 