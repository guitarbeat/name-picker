
import type { Match, MatchResult } from '../types/tournament';
import { v4 as uuidv4 } from 'uuid';

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * 
 * @param array The array to shuffle.
 * @returns The shuffled array (for convenience, as it shuffles in place).
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Creates initial matches from a list of names.
 * Handles cases where the number of names is not a power of 2.
 * 
 * @param names The list of names to create matches from.
 * @returns An array of Match objects representing the initial round.
 */
export function createInitialMatches(names: string[]): Match[] {
  // Use Fisher-Yates shuffle for better randomness
  const shuffledNames = shuffleArray([...names]); 
  const matches: Match[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < shuffledNames.length; i += 2) {
    matches.push({
      id: uuidv4(),
      name1: shuffledNames[i],
      name2: i + 1 < shuffledNames.length ? shuffledNames[i + 1] : null, // Handle odd number of names with a bye
      winner: null,
      timestamp: Date.now(),
      createdAt: now,
    });
  }

  return matches;
}

/**
 * Creates the next round of matches from the winners of the current round.
 * Handles byes correctly, advancing them to the next round.
 * 
 * @param matches The matches from the previous round.
 * @returns An array of Match objects representing the next round.
 */
export function createNextRound(matches: Match[]): Match[] {
  const winners: (string | null)[] = [];

  for (const match of matches) {
    if (match.winner === -1) {
      winners.push(match.name1);
    } else if (match.winner === 1 && match.name2) {
      winners.push(match.name2);
    } else if (match.winner === 0) {
      // For "like both", randomly choose one
      winners.push(Math.random() < 0.5 ? match.name1 : (match.name2 || match.name1));
    } else if (match.winner === 2 || match.winner === null) {
        // Handle "no opinion" or incomplete matches:
        if (match.name2) {
          // If there's a competitor, randomly choose one
          winners.push(Math.random() < 0.5 ? match.name1 : match.name2);
        } else {
          // If it's a bye, advance the single name
          winners.push(match.name1);
        }
    } else {
      // Invalid winner value, default to first name
      winners.push(match.name1);
    }
  }
  
  if (winners.length <= 1) return [];

  const nextMatches: Match[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < winners.length; i += 2) {
    nextMatches.push({
      id: uuidv4(),
      name1: winners[i]!, // We know winners[i] will be a string if there's a match
      name2: i + 1 < winners.length ? winners[i + 1]! : null, // Handle odd number of winners with a bye
      winner: null,
      timestamp: Date.now(),
      createdAt: now,
    });
  }

  return nextMatches;
}

/**
 * Calculates the total number of rounds needed for a tournament.
 * 
 * @param numNames The number of participants in the tournament.
 * @returns The total number of rounds.
 */
export function calculateTotalRounds(numNames: number): number {
  return Math.ceil(Math.log2(numNames));
}

/**
 * Updates a match with a winner.
 * 
 * @param matches The current array of matches.
 * @param matchId The ID of the match to update.
 * @param result The result of the match (-1 for name1, 1 for name2, 0 for tie, 2 for no opinion).
 * @returns A new array of matches with the updated match.
 */
export function updateMatch(matches: Match[], matchId: string, result: MatchResult): Match[] {
  return matches.map(match =>
    match.id === matchId ? { ...match, winner: result, timestamp: Date.now() } : match
  );
}

/**
 * Checks if all matches in the current round are complete.
 * 
 * @param matches The matches in the current round.
 * @returns True if all matches are complete, false otherwise.
 */
export function isRoundComplete(matches: Match[]): boolean {
  return matches.every(match => match.winner !== null);
}

/**
 * Gets the final sorted list of names based on match results, using a point system.
 * 
 * @param matches All matches played in the tournament.
 * @returns A sorted array of names, ranked from highest points to lowest.
 */
export function getSortedNames(matches: Match[]): string[] {
  const namePoints: Record<string, number> = {};

  // Initialize points for all names that participated
  const allNames = new Set<string>();
  matches.forEach(match => {
    allNames.add(match.name1);
    if (match.name2) {
      allNames.add(match.name2);
    }
  });
  allNames.forEach(name => namePoints[name] = 0);

  // Calculate points from match results
  matches.forEach(match => {
    if (match.winner === -1) {
      namePoints[match.name1] += 2;
    } else if (match.winner === 1 && match.name2) {
      namePoints[match.name2] += 2;
    } else if (match.winner === 0 && match.name2) {
      namePoints[match.name1] += 1;
      namePoints[match.name2] += 1;
    }
    // No points for "no opinion" (2) or byes (name2 is null)
  });

  // Sort names by points (descending)
  return Object.entries(namePoints)
    .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
    .map(([name]) => name);
}

/**
 * Checks if the tournament is complete.
 *
 * @param matches All matches in the tournament
 * @param numNames The initial number of names
 * @returns True if the tournament is complete, false otherwise.
 */
export function isTournamentComplete(matches: Match[], numNames: number): boolean {
  const totalRounds = calculateTotalRounds(numNames);
  // Count the number of rounds that have been played by checking the depth of matches
  const roundsPlayed = matches.reduce((maxRound, match) => {
    let round = 1;
    let currentMatchId = match.id;
    while (matches.some(m => m.name1 === currentMatchId || m.name2 === currentMatchId)) {
      round++;
      const nextMatch = matches.find(m => m.name1 === currentMatchId || m.name2 === currentMatchId);
      if (!nextMatch) break;
      currentMatchId = nextMatch.id;
    }
    return Math.max(maxRound, round);
  }, 0);

  return roundsPlayed >= totalRounds && isRoundComplete(matches.filter(m => m.winner !== null));
}