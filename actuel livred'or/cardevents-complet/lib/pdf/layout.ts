// Mise en page des photos : fonctions PURES (sans dépendance), testées dans scripts/test-pdf-logic.mts.
// Unité arbitraire (le moteur PDF travaille en points). Chaque rangée est « justifiée » : sa hauteur est
// calculée pour que les photos, à leur ratio d'origine, remplissent exactement la largeur → ni rognage ni
// déformation, et aucune photo n'est omise (aucun plafond).

export interface PlacedPhoto { index: number; width: number; height: number }
export interface PhotoRow { photos: PlacedPhoto[]; height: number }

/** Découpe n photos en rangées de 3 au plus, sans jamais laisser une photo seule en dernière rangée si évitable. */
export function rowSizes(n: number): number[] {
  const rows: number[] = [];
  let left = n;
  while (left > 0) {
    if (left === 4) { rows.push(2, 2); break; }
    const k = Math.min(3, left);
    rows.push(k);
    left -= k;
  }
  return rows;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function justifyRows(
  aspects: number[],
  contentWidth: number,
  opts: { gap: number; maxRowHeight: number }
): PhotoRow[] {
  const safe = aspects.map((a) => (Number.isFinite(a) && a > 0 ? clamp(a, 0.45, 3) : 4 / 3));
  const rows: PhotoRow[] = [];
  let idx = 0;
  for (const size of rowSizes(safe.length)) {
    const group = safe.slice(idx, idx + size);
    const sum = group.reduce((s, a) => s + a, 0);
    const h = Math.min((contentWidth - opts.gap * (size - 1)) / sum, opts.maxRowHeight);
    rows.push({ photos: group.map((a, i) => ({ index: idx + i, width: a * h, height: h })), height: h });
    idx += size;
  }
  return rows;
}

/** Pixels nécessaires pour une dimension imprimée (en points) à une définition donnée. */
export function targetPixels(points: number, dpi: number): number {
  return Math.max(1, Math.round((points / 72) * dpi));
}
