import { sql } from '@vercel/postgres';
import { mergeSettings, DEFAULT_SETTINGS, type SiteSettings } from './siteSettings';

/** Lit les paramètres ; si la table n'existe pas encore (migration 004 non jouée), retombe sur les défauts. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const { rows } = await sql`SELECT data FROM site_settings WHERE id = 1`;
    return mergeSettings(rows[0]?.data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: unknown): Promise<SiteSettings> {
  const current = await getSettings();
  const next = mergeSettings({ ...current, ...(patch && typeof patch === 'object' ? patch : {}) });
  await sql`
    INSERT INTO site_settings (id, data) VALUES (1, ${JSON.stringify(next)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  return next;
}
