-- Migration 006 — Mariage : formule (livre d'or / invitation / les deux) et gestionnaire d'invitations.
-- Additive et rejouable. À exécuter dans Neon AVANT de déployer ce code.
-- (Si une version précédente de cette migration a créé la table « invitation_guests », elle n'est plus utilisée :
--  vous pouvez la supprimer avec  DROP TABLE IF EXISTS invitation_guests;  une fois les données de test écartées.)

ALTER TABLE ceremonies ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'guestbook';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ceremonies_mode_check') THEN
    ALTER TABLE ceremonies ADD CONSTRAINT ceremonies_mode_check CHECK (mode IN ('guestbook', 'invitation', 'both'));
  END IF;
END $$;

-- Contenu de l'invitation (une ligne par mariage) : couple, lieu, programme, histoire, cadeaux, dress code, contacts, tables, apparence.
CREATE TABLE IF NOT EXISTS wedding_config (
  ceremony_id TEXT PRIMARY KEY REFERENCES ceremonies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invités : une invitation personnelle chacun. La liste appartient au mariage (1 mariage = 1 responsable).
CREATE TABLE IF NOT EXISTS wedding_guests (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,          -- lien personnel /inv/<jeton> (144 bits)
  ticket_code TEXT UNIQUE NOT NULL,           -- contenu du QR du billet (distinct du jeton du lien)
  greeting_title TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  table_number TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  plus_one_allowed BOOLEAN NOT NULL DEFAULT false,
  plus_one_confirmed BOOLEAN NOT NULL DEFAULT false,
  plus_one_name TEXT NOT NULL DEFAULT '',
  children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count BETWEEN 0 AND 20),
  dietary_preference TEXT NOT NULL DEFAULT 'classic',
  allergies TEXT NOT NULL DEFAULT '',
  personal_note TEXT NOT NULL DEFAULT '',
  partner_note TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',             -- notes privées du responsable (jamais envoyées à l'invité)
  attending_events JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { idÉvénement: true/false }
  representative JSONB,                       -- demande de représentant
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_ceremony ON wedding_guests(ceremony_id);

CREATE TABLE IF NOT EXISTS wedding_announcements (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'important', 'urgent')),
  target TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'confirmed_only')),
  author TEXT NOT NULL DEFAULT 'Organisateur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wedding_announcements_ceremony ON wedding_announcements(ceremony_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wedding_messages (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wedding_messages_ceremony ON wedding_messages(ceremony_id, created_at);

-- Réservations de la liste de cadeaux (une ligne par réservation : pas de conflit si deux invités réservent en même temps).
CREATE TABLE IF NOT EXISTS wedding_gift_pledges (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  gift_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_contact TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wedding_pledges_gift ON wedding_gift_pledges(ceremony_id, gift_id);
