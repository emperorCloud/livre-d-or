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

-- Reprise de l'existant : cérémonie + groupe par défaut pour Jean-Michel Edimo.
-- Le responsable de ce groupe n'a pas de code tant que l'admin n'en génère pas un
-- (bouton "Réinitialiser le code" ou POST /api/groups/{id}/reset-code).
INSERT INTO ceremonies (id, type, title, subtitle, honoree_name, theme)
VALUES (
  'ceremony-legacy-jean-michel', 'retraite',
  'Hommage à Jean-Michel Edimo', 'Livre d''or de départ à la retraite',
  'Jean-Michel Edimo', '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO groups (id, ceremony_id, name, manager_name)
VALUES ('group-legacy-jean-michel', 'ceremony-legacy-jean-michel', 'Tous les invités', 'Administrateur')
ON CONFLICT (id) DO NOTHING;

-- Rejouable : rattache tout témoignage orphelin (ex. posté pendant le déploiement)
UPDATE entries SET group_id = 'group-legacy-jean-michel' WHERE group_id IS NULL;
