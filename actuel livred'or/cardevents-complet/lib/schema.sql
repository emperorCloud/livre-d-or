-- Schéma de la base de données du Livre d'Or
-- À exécuter une fois sur la base Vercel Postgres (onglet "Query" du dashboard
-- Vercel, ou via `psql "$POSTGRES_URL" -f lib/schema.sql`)

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  relationship TEXT NOT NULL DEFAULT 'Collègue',
  years_known TEXT DEFAULT '',
  message TEXT NOT NULL,
  anecdote TEXT DEFAULT '',
  wish TEXT DEFAULT '',
  card_style TEXT NOT NULL DEFAULT 'polaroid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  reactions JSONB NOT NULL DEFAULT '{"❤️":0,"🥂":0,"👏":0,"🎉":0,"🌟":0}'
);

-- Une entrée peut avoir plusieurs photos (stockées sur Vercel Blob, on ne
-- garde que l'URL + la légende ici)
CREATE TABLE IF NOT EXISTS entry_photos (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_entry_photos_entry_id ON entry_photos(entry_id);
CREATE INDEX IF NOT EXISTS idx_entries_token ON entries(token);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
