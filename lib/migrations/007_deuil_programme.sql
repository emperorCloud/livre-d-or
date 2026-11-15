-- Migration 007 — Deuil & Hommage : formule (livre d'or / programme / les deux) et espace « Programme ».
-- Additive et rejouable. À exécuter dans Neon AVANT de déployer ce code.
-- La colonne ceremonies.mode (guestbook | invitation | both) est réutilisée : pour un deuil,
-- « invitation » signifie « programme seul ». Aucune modification de contrainte n'est nécessaire.

-- Contenu du programme (une ligne par deuil) : identité du défunt, faire-part, programme des cérémonies, rappels.
CREATE TABLE IF NOT EXISTS funeral_config (
  ceremony_id TEXT PRIMARY KEY REFERENCES ceremonies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Convois (bus) : la configuration du bus est dans « data » ; les réservations ont leur propre table.
CREATE TABLE IF NOT EXISTS funeral_buses (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funeral_buses_ceremony ON funeral_buses(ceremony_id, created_at);

-- Une ligne par réservation. UNIQUE (bus_id, order_number) : deux réservations simultanées ne peuvent pas prendre
-- le même numéro, la seconde est rejouée et se heurte alors à la capacité réelle du bus.
CREATE TABLE IF NOT EXISTS funeral_bus_reservations (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  bus_id TEXT NOT NULL REFERENCES funeral_buses(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  proof_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bus_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_funeral_resa_ceremony ON funeral_bus_reservations(ceremony_id, created_at);

-- Dons et cotisations. Un don déclaré par un visiteur reste « pending » jusqu'à vérification par le responsable.
CREATE TABLE IF NOT EXISTS funeral_donations (
  id TEXT PRIMARY KEY,
  ceremony_id TEXT NOT NULL REFERENCES ceremonies(id) ON DELETE CASCADE,
  receipt_seq INTEGER NOT NULL,
  donor_name TEXT NOT NULL,
  donor_phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'autre' CHECK (payment_method IN ('mobile_money', 'cash', 'transfer', 'cheque', 'autre')),
  payment_reference TEXT NOT NULL DEFAULT '',
  donated_on TEXT NOT NULL DEFAULT '',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  purpose TEXT NOT NULL DEFAULT '',
  blessing TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ceremony_id, receipt_seq)
);
CREATE INDEX IF NOT EXISTS idx_funeral_donations_ceremony ON funeral_donations(ceremony_id, created_at DESC);
