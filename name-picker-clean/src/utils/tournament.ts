import type { Match, MatchResult } from '@features/tournament/types';

/**
 * Creates initial matches from a list of names
 */
export function createInitialMatches(names: string[]): Match[] {
  const matches: Match[] = [];
  const shuffledNames = [...names].sort(() => Math.random() - 0.5);
  const now = new Date();

  for (let i = 0; i < shuffledNames.length; i += 2) {
    matches.push({
      id: `${i}-${i + 1}`,
      name1: shuffledNames[i],
      name2: shuffledNames[i + 1] || null,
      winner: null,
      timestamp: now.getTime(),
      createdAt: now.toISOString()
    });
  }

  return matches;
}

/**
 * Calculates total number of rounds needed for a tournament
 */
export function calculateTotalRounds(totalNames: number): number {
  return Math.ceil(Math.log2(totalNames));
}

/**
 * Groups matches by creation timestamp
 */
export function groupMatchesByRound(matches: Match[]): Match[][] {
  const rounds: Match[][] = [];
  const timestamps = [...new Set(matches.map(m => m.createdAt))].sort();

  for (const timestamp of timestamps) {
    rounds.push(matches.filter(m => m.createdAt === timestamp));
  }

  return rounds;
}