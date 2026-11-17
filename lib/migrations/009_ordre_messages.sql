-- Migration 009 — Ordre manuel des messages du livre d'or. Additive et rejouable.
-- sort_order : position choisie par le responsable (1 = premier du livre). NULL = message non classé : il vient
-- après les messages classés, par date d'arrivée. Le livre PDF, son sommaire et sa pagination suivent cet ordre.
ALTER TABLE entries ADD COLUMN IF NOT EXISTS sort_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_entries_group_order ON entries (group_id, sort_order);

-- Reprise de l'existant : les messages « épinglés » (qui passaient en tête du livre) reçoivent les premières positions,
-- dans l'ordre où le livre les affichait (par date). Une seule fois : seulement tant qu'aucun ordre n'a été défini.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY created_at ASC) AS rn
  FROM entries WHERE is_pinned = true
)
UPDATE entries e SET sort_order = ranked.rn FROM ranked
WHERE e.id = ranked.id AND e.sort_order IS NULL
  AND NOT EXISTS (SELECT 1 FROM entries x WHERE x.group_id = e.group_id AND x.sort_order IS NOT NULL);
