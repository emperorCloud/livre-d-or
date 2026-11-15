-- Migration 008 — Mariage : réponse individuelle de chaque personne d'une invitation « couple ».
-- Additive et rejouable. À exécuter dans Neon AVANT de déployer ce code.
--
-- rsvp_status  = réponse de l'INVITATION (agrégat : confirmé si au moins une personne vient, décliné si toutes déclinent, sinon en attente).
--                Tout le code existant (stats, émargement, exports) continue donc de fonctionner.
-- guest_rsvp   = réponse de la première personne.
-- partner_rsvp = réponse de la seconde personne (uniquement pour une invitation couple : plus_one_allowed = true).
ALTER TABLE wedding_guests ADD COLUMN IF NOT EXISTS guest_rsvp TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE wedding_guests ADD COLUMN IF NOT EXISTS partner_rsvp TEXT NOT NULL DEFAULT 'pending';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_guests_guest_rsvp_check') THEN
    ALTER TABLE wedding_guests ADD CONSTRAINT wedding_guests_guest_rsvp_check CHECK (guest_rsvp IN ('pending', 'confirmed', 'declined'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wedding_guests_partner_rsvp_check') THEN
    ALTER TABLE wedding_guests ADD CONSTRAINT wedding_guests_partner_rsvp_check CHECK (partner_rsvp IN ('pending', 'confirmed', 'declined'));
  END IF;
END $$;

-- Reprise des réponses déjà données (à ne faire qu'une fois : seulement là où les nouvelles colonnes n'ont pas encore été renseignées).
UPDATE wedding_guests SET
  guest_rsvp = rsvp_status,
  partner_rsvp = CASE
    WHEN NOT plus_one_allowed THEN 'pending'
    WHEN rsvp_status = 'declined' THEN 'declined'
    WHEN rsvp_status = 'confirmed' AND plus_one_confirmed THEN 'confirmed'
    WHEN rsvp_status = 'confirmed' THEN 'declined'
    ELSE 'pending' END
WHERE guest_rsvp = 'pending' AND partner_rsvp = 'pending' AND rsvp_status <> 'pending';
