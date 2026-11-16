import { sql } from '@vercel/postgres';
import { mergeSettings, DEFAULT_SETTINGS, type SiteSettings } from './siteSettings';

const isMissingTable = (e: unknown) => (e as { code?: string })?.code === '42P01';

/** Crée la table des paramètres si la migration 004 n'a pas été jouée (même définition que 004_site_settings.sql). */
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

/** Lit les paramètres ; si la table n'existe pas encore, retombe sur les défauts. */
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
  const write = () => sql`
    INSERT INTO site_settings (id, data) VALUES (1, ${JSON.stringify(next)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  try { await write(); }
  catch (e) {
    if (!isMissingTable(e)) throw e;
    await ensureTable();   // table absente (migration 004 oubliée) : on la crée puis on réenregistre
    await write();
  }
  return next;
}
