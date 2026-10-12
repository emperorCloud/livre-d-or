import { sql } from '@vercel/postgres';

/**
 * Limiteur de débit à fenêtre fixe, stocké en base (les fonctions serverless
 * n'ont pas de mémoire partagée). Retourne true si la requête est autorisée.
 */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const { rows } = await sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}::float8)
                   THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}::float8)
                          THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `;
  return (rows[0]?.count ?? 1) <= max;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || 'unknown';
}
