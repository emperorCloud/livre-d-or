-- Migration 003 — Photos : vignettes, dimensions, point focal de la photo à la une. Additive et rejouable.
-- À exécuter dans Neon AVANT de déployer ce code.
ALTER TABLE entry_photos ADD COLUMN IF NOT EXISTS thumb_url TEXT NOT NULL DEFAULT '';
ALTER TABLE entry_photos ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE entry_photos ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE groups ADD COLUMN IF NOT EXISTS featured_focal_x REAL NOT NULL DEFAULT 0.5;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS featured_focal_y REAL NOT NULL DEFAULT 0.4;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS featured_width INTEGER;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS featured_height INTEGER;
