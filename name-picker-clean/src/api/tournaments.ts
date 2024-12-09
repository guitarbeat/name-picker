import { neon } from '@neondatabase/serverless';
import type { TournamentResult } from '../types/tournament';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to transform database result to TournamentResult
function transformDbResult(result: any): TournamentResult {
  return {
    id: result.id,
    names: result.names,
    winner: result.winner,
    matches: result.matches,
    createdAt: result.createdAt,
    points: result.points || {},
  };
}

export async function getTournaments(): Promise<TournamentResult[]> {
  const results = await sql`
    SELECT 
      id,
      names,
      winner,
      matches,
      created_at as "createdAt",
      points
    FROM tournaments 
    ORDER BY created_at DESC
  `;
  return results.map(transformDbResult);
}

export async function addTournament(tournament: Omit<TournamentResult, 'id' | 'createdAt'>) {
  const result = await sql`
    INSERT INTO tournaments (
      names,
      winner,
      matches,
      points,
      created_at
    ) VALUES (
      ${tournament.names},
      ${tournament.winner},
      ${tournament.matches}::jsonb,
      ${tournament.points}::jsonb,
      NOW()
    ) RETURNING *
  `;
  return transformDbResult(result[0]);
}

export async function clearTournaments() {
  await sql`TRUNCATE TABLE tournaments`;
}

export async function importTournaments(tournaments: TournamentResult[]) {
  await sql`TRUNCATE TABLE tournaments`;
  
  for (const tournament of tournaments) {
    await sql`
      INSERT INTO tournaments (
        names,
        winner,
        matches,
        points,
        created_at
      ) VALUES (
        ${tournament.names},
        ${tournament.winner},
        ${tournament.matches}::jsonb,
        ${tournament.points}::jsonb,
        ${new Date(tournament.createdAt)}
      )
    `;
  }
} 