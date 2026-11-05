-- Migration 006 — Mariage : formule (livre d'or / invitation / les deux) et invités avec lien personnel.
-- Additive et rejouable. À exécuter dans Neon AVANT de déployer ce code.

ALTER TABLE ceremonies ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'guestbook';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ceremonies_mode_check') THEN
    ALTER TABLE ceremonies ADD CONSTRAINT ceremonies_mode_check CHECK (mode IN ('guestbook', 'invitation', 'both'));
  END IF;
END $$;

-- Un invité = une invitation personnelle. La liste appartient à la cérémonie (1 mariage = 1 responsable).
CREATE TABLE IF NOT EXISTS invitation_guests (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,                 -- lien personnel /inv/<token> (144 bits)
  ticket_code TEXT UNIQUE NOT NULL,           -- contenu du QR du billet (distinct du jeton)
  greeting TEXT NOT NULL,                     -- ex : « M. et Mme Nom »
  category TEXT NOT NULL DEFAULT '',          -- étiquette libre : famille, amis, collègues…
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  table_number TEXT NOT NULL DEFAULT '',
  max_guests INTEGER NOT NULL DEFAULT 1 CHECK (max_guests BETWEEN 1 AND 10),
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'yes', 'no', 'maybe')),
  rsvp_guests INTEGER NOT NULL DEFAULT 0,
  diet TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  rsvp_at TIMESTAMPTZ,
  attending_events JSONB NOT NULL DEFAULT '{}'::jsonb,   -- réservé : présence par événement (étape 3)
  checked_in_at TIMESTAMPTZ,                              -- réservé : émargement (étape 2)
  checked_in_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_ceremony ON invitation_guests(ceremony_id);
