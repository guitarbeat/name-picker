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
  if (!Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  const winners: string[] = [];

  for (const match of matches) {
    // Validate match structure
    if (!match || typeof match !== 'object') continue;
    if (typeof match.name1 !== 'string') continue;
    if (match.name2 !== null && typeof match.name2 !== 'string') continue;
    if (match.winner !== null && ![-1, 0, 1, 2].includes(match.winner)) continue;

    if (match.winner === -1) {
      winners.push(match.name1);
    } else if (match.winner === 1 && match.name2) {
      winners.push(match.name2);
    } else if (match.winner === 0) {
      // For "like both", randomly choose one
      winners.push(Math.random() < 0.5 ? match.name1 : (match.name2 ?? match.name1));
    } else if (match.winner === 2 || match.winner === null) {
      // Handle "no opinion" or incomplete matches
      if (match.name2) {
        winners.push(Math.random() < 0.5 ? match.name1 : match.name2);
      } else {
        winners.push(match.name1);
      }
    } else {
      winners.push(match.name1);
    }
  }
  
  if (winners.length <= 1) return [];

  const nextMatches: Match[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < winners.length; i += 2) {
    const name1 = winners[i];
    const name2 = i + 1 < winners.length ? winners[i + 1] : null;

    if (!name1) continue; // Skip if somehow we got an invalid winner

    nextMatches.push({
      id: uuidv4(),
      name1,
      name2,
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
  if (!Array.isArray(matches)) return [];
  if (typeof matchId !== 'string') return matches;
  if (typeof result !== 'number' || ![-1, 0, 1, 2].includes(result)) return matches;

  return matches.map(match => {
    if (!match || typeof match !== 'object') return match;
    return match.id === matchId ? { ...match, winner: result, timestamp: Date.now() } : match;
  });
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
  const namePoints: Record<string, { points: number, wins: number, timestamp: number }> = {};

  // Initialize points for all names that participated
  const allNames = new Set<string>();
  matches.forEach(match => {
    allNames.add(match.name1);
    if (match.name2) {
      allNames.add(match.name2);
    }
  });
  allNames.forEach(name => namePoints[name] = { points: 0, wins: 0, timestamp: 0 });

  // Calculate points from match results
  matches.forEach(match => {
    if (match.winner === -1) {
      namePoints[match.name1].points += 2;
      namePoints[match.name1].wins += 1;
      namePoints[match.name1].timestamp = Math.max(namePoints[match.name1].timestamp, match.timestamp);
    } else if (match.winner === 1 && match.name2) {
      namePoints[match.name2].points += 2;
      namePoints[match.name2].wins += 1;
      namePoints[match.name2].timestamp = Math.max(namePoints[match.name2].timestamp, match.timestamp);
    } else if (match.winner === 0 && match.name2) {
      namePoints[match.name1].points += 1;
      namePoints[match.name2].points += 1;
      namePoints[match.name1].timestamp = Math.max(namePoints[match.name1].timestamp, match.timestamp);
      namePoints[match.name2].timestamp = Math.max(namePoints[match.name2].timestamp, match.timestamp);
    }
    // No points for "no opinion" (2) or byes (name2 is null)
  });

  // Sort names by points (descending), then by wins (descending), then by most recent win (descending)
  return Object.entries(namePoints)
    .sort(([nameA, statsA], [nameB, statsB]) => {
      // First sort by points
      if (statsB.points !== statsA.points) {
        return statsB.points - statsA.points;
      }
      // Then by number of wins
      if (statsB.wins !== statsA.wins) {
        return statsB.wins - statsA.wins;
      }
      // Then by most recent win timestamp
      if (statsB.timestamp !== statsA.timestamp) {
        return statsB.timestamp - statsA.timestamp;
      }
      // Finally, alphabetically as a last resort
      return nameA.localeCompare(nameB);
    })
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
  if (matches.length === 0) return false;
  if (numNames <= 1) return true;

  // Get matches grouped by round (based on creation timestamp)
  const matchesByRound = matches.reduce((acc, match) => {
    const round = acc.find(r => r[0].createdAt === match.createdAt);
    if (round) {
      round.push(match);
    } else {
      acc.push([match]);
    }
    return acc;
  }, [] as Match[][]);

  // Check if we have the correct number of rounds
  const expectedRounds = calculateTotalRounds(numNames);
  if (matchesByRound.length < expectedRounds) return false;

  // Check if all matches in the final round are complete
  const finalRound = matchesByRound[matchesByRound.length - 1];
  if (!finalRound.every(match => match.winner !== null)) return false;

  // Check if we have a clear winner (only one match in final round)
  if (finalRound.length !== 1) return false;

  // Verify that all matches leading to the final round are complete
  for (let i = 0; i < matchesByRound.length - 1; i++) {
    const round = matchesByRound[i];
    if (!round.every(match => match.winner !== null)) return false;

    // Verify that winners advanced correctly
    const nextRound = matchesByRound[i + 1];
    const winners = round.flatMap(match => {
      if (match.winner === -1) return [match.name1];
      if (match.winner === 1 && match.name2) return [match.name2];
      if (match.winner === 0) return [match.name1]; // In case of tie, first name advances
      return [];
    });

    // Check if all winners are present in the next round
    const nextRoundNames = nextRound.flatMap(match => [match.name1, match.name2].filter(Boolean));
    if (!winners.every(winner => nextRoundNames.includes(winner))) return false;
  }

  return true;
}