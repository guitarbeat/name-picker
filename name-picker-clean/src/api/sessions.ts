import { neon } from '@neondatabase/serverless';
import type { UserSession } from '../types/tournament';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to transform database result to UserSession
function transformDbResult(result: any): UserSession {
  return {
    username: result.username,
    createdAt: result.createdAt,
    lastLoginAt: result.lastLoginAt,
    preferences: result.preferences || {
      autoAdvance: true,
      showTimer: true,
      matchesPerPage: 10,
      theme: 'system'
    }
  };
}

export async function getUserSession(): Promise<UserSession | null> {
  const results = await sql`
    SELECT 
      username,
      created_at as "createdAt",
      last_login_at as "lastLoginAt",
      preferences
    FROM user_sessions 
    ORDER BY last_login_at DESC 
    LIMIT 1
  `;
  return results.length > 0 ? transformDbResult(results[0]) : null;
}

export async function saveUserSession(session: Omit<UserSession, 'lastLoginAt'>) {
  const lastLoginAt = new Date().toISOString();

  const result = await sql`
    INSERT INTO user_sessions (
      username,
      created_at,
      last_login_at,
      preferences
    ) VALUES (
      ${session.username},
      ${new Date(session.createdAt)},
      ${new Date(lastLoginAt)},
      ${session.preferences}::jsonb
    )
    ON CONFLICT (username) 
    DO UPDATE SET 
      last_login_at = ${new Date(lastLoginAt)},
      preferences = ${session.preferences}::jsonb
    RETURNING *
  `;
  return transformDbResult(result[0]);
}

export async function clearUserSession() {
  await sql`TRUNCATE TABLE user_sessions`;
} 