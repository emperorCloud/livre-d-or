-- Migration 002 — Cérémonies, groupes, rôles (v2)
-- 100 % ADDITIVE et rejouable : aucune table ni colonne existante n'est
-- supprimée. À exécuter dans Neon (SQL Editor) AVANT de déployer le nouveau code.
-- Les témoignages existants sont rattachés à une cérémonie/groupe par défaut.

CREATE TABLE IF NOT EXISTS ceremonies (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('deuil','mariage','anniversaire','retraite')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  honoree_name TEXT NOT NULL,
  event_date TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_name TEXT NOT NULL DEFAULT '',
  manager_email TEXT NOT NULL DEFAULT '',
  -- Lien public d'invitation (aléatoire, non devinable) : remplace l'id en clair dans l'URL
  invite_slug TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  -- Connexion responsable : "LOGINID-SECRET". LOGINID en clair (index), SECRET haché (scrypt).
  manager_login_id TEXT UNIQUE,
  manager_secret_hash TEXT,
  custom_intro TEXT NOT NULL DEFAULT '',
  custom_prompt TEXT NOT NULL DEFAULT '',
  theme_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  allow_photos BOOLEAN NOT NULL DEFAULT true,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  featured_photo_url TEXT NOT NULL DEFAULT '',
  featured_photo_aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_groups_ceremony_id ON groups(ceremony_id);

-- Les témoignages existants (table entries) deviennent les "messages" d'un groupe.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_entries_group_id ON entries(group_id);

-- Limiteur de débit (login, création de témoignages, uploads)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0
);

-- Reprise de l'existant (uniquement s'il y a DÉJÀ des témoignages sans groupe ; base neuve = rien n'est créé).
-- Une cérémonie et un groupe génériques les reçoivent ; l'administrateur les renomme ensuite depuis son tableau de bord.
INSERT INTO ceremonies (id, type, title, subtitle, honoree_name, theme)
SELECT 'ceremony-default', 'retraite', 'Livre d''or', '', '', '{}'::jsonb
WHERE EXISTS (SELECT 1 FROM entries WHERE group_id IS NULL) AND NOT EXISTS (SELECT 1 FROM ceremonies);

INSERT INTO groups (id, ceremony_id, name, manager_name)
SELECT 'group-default', c.id, 'Invités', ''
FROM (SELECT id FROM ceremonies ORDER BY created_at ASC LIMIT 1) c
WHERE EXISTS (SELECT 1 FROM entries WHERE group_id IS NULL) AND NOT EXISTS (SELECT 1 FROM groups);

-- Rejouable : rattache tout témoignage orphelin au premier groupe (sans effet s'il n'y en a pas)
UPDATE entries SET group_id = (SELECT id FROM groups ORDER BY created_at ASC LIMIT 1)
WHERE group_id IS NULL AND EXISTS (SELECT 1 FROM groups);
