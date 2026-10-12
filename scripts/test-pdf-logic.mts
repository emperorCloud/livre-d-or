import assert from 'node:assert/strict';
import { rowSizes, justifyRows, targetPixels } from '../lib/pdf/layout.ts';
import { cleanText, paragraphs } from '../lib/pdf/text.ts';

// Répartition : aucune photo perdue, jamais plus de 3 par rangée, pas de photo orpheline
for (let n = 0; n <= 30; n++) {
  const rows = rowSizes(n);
  assert.equal(rows.reduce((a, b) => a + b, 0), n, `n=${n} : somme des rangées`);
  assert.ok(rows.every((r) => r >= 1 && r <= 3), `n=${n} : taille de rangée`);
  if (n >= 2) assert.ok(rows[rows.length - 1] >= 2, `n=${n} : dernière rangée non orpheline`);
}

// Justification : toutes les photos placées, ratio conservé, jamais plus large que le contenu
const W = 511, GAP = 7, MAXH = 240;
const cases: number[][] = [[1.5], [0.75], [1.5, 0.75], [1.33, 1.78, 0.56], [1, 1, 1, 1], [0.75, 0.75, 0.75, 1.5, 1.5], [1.5, 1.5, 0.5, 0.5, 2, 1]];
for (const aspects of cases) {
  const rows = justifyRows(aspects, W, { gap: GAP, maxRowHeight: MAXH });
  const placed = rows.flatMap((r) => r.photos);
  assert.equal(placed.length, aspects.length, 'toutes les photos sont placées');
  assert.deepEqual(placed.map((p) => p.index), aspects.map((_, i) => i), 'ordre conservé');
  for (const r of rows) {
    assert.ok(r.height <= MAXH + 1e-9);
    const used = r.photos.reduce((s, p) => s + p.width, 0) + GAP * (r.photos.length - 1);
    assert.ok(used <= W + 1e-6, `rangée trop large : ${used}`);
    for (const p of r.photos) assert.ok(Math.abs(p.width / p.height - Math.min(3, Math.max(0.45, aspects[p.index]))) < 1e-9, 'ratio conservé');
  }
}
// Une rangée de 3 portraits remplit exactement la largeur
const full = justifyRows([0.75, 0.75, 0.75], W, { gap: GAP, maxRowHeight: 999 })[0];
assert.ok(Math.abs(full.photos.reduce((s, p) => s + p.width, 0) + 2 * GAP - W) < 1e-6);
// Données invalides : repli sur 4/3, pas de NaN
const bad = justifyRows([NaN, 0, -1], W, { gap: GAP, maxRowHeight: MAXH })[0];
assert.ok(bad.photos.every((p) => Number.isFinite(p.width) && p.width > 0));

assert.equal(targetPixels(511, 150), 1065);

// Texte : emoji conservés ou retirés proprement, jamais de caractères parasites
const raw = 'Bonne retraite 🙏🏾 chef ❤️\u200B !\r\n\r\n\r\n\r\nÀ bientôt 😂';
assert.ok(cleanText(raw, true).includes('🙏🏾'));
const stripped = cleanText(raw, false);
assert.ok(!/[\u{1F300}-\u{1FAFF}\u2764\uFE0F\u200D]/u.test(stripped), 'plus aucun emoji');
assert.equal(stripped, 'Bonne retraite chef !\n\nÀ bientôt');
assert.equal(cleanText(undefined, true), '');
assert.deepEqual(paragraphs('a\n\nb\n  \nc'), ['a', 'b', 'c']);

console.log('OK — mise en page et nettoyage de texte : tous les tests passent');
