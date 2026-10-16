-- Migration 004 — Paramètres du site gérés par l'administrateur (marque, accueil, en-tête, pied de page). Additive et rejouable.
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO site_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
