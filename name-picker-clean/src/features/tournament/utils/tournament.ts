import type { Match, MatchResult } from '../types/tournament';

export function createInitialMatches(names: string[]): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < names.length; i += 2) {
    const now = new Date();
    matches.push({
      id: `match-${i/2}`,
      name1: names[i],
      name2: names[i + 1] || null,
      winner: null,
      createdAt: now.toISOString(),
      timestamp: now.getTime()
    });
  }
  return matches;
}

export function createNextRound(matches: Match[]): Match[] {
  const winners = matches.map(match => {
    if (match.winner === -1) return match.name1;
    if (match.winner === 1) return match.name2;
    return null;
  }).filter(Boolean) as string[];

  return createInitialMatches(winners);
}

export function isRoundComplete(matches: Match[]): boolean {
  return matches.every(match => match.winner !== null);
}

export function updateMatch(matches: Match[], matchId: string, result: MatchResult): Match[] {
  return matches.map(match => 
    match.id === matchId ? { ...match, winner: result } : match
  );
}

export function getSortedNames(matches: Match[]): string[] {
  const winners = matches.filter(match => match.winner !== null).map(match => {
    if (match.winner === -1) return match.name1;
    if (match.winner === 1) return match.name2;
    return null;
  }).filter(Boolean) as string[];

  return winners;
} 