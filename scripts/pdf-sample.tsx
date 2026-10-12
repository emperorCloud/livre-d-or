// PDF d'exemple pour juger la mise en page SANS base ni navigateur :   npm run pdf:sample   ->  sample-livre-dor.pdf
// Jeu de test volontairement difficile : messages d'une ligne et très longs, emoji, 1 à 6 photos, portraits/paysages/panoramas.
import React from 'react';
import { renderToFile, Font } from '@react-pdf/renderer';
import { deflateSync } from 'node:zlib';
import { BookDocument, type BookData, type BookEntry } from '../lib/pdf/BookDocument';
import { PALETTES, CONTENT_W, ROW_GAP, MAX_ROW_H } from '../lib/pdf/geometry';
import { justifyRows } from '../lib/pdf/layout';
import { registerEmoji } from '../lib/pdf/fonts';

// --- mini encodeur PNG : rectangle à damier + cadre, pour voir tout rognage ou déformation à l'œil ---
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(w: number, h: number, [r, g, b]: number[]): string {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3, edge = x < 8 || y < 8 || x >= w - 8 || y >= h - 8, dark = ((x >> 5) + (y >> 5)) & 1;
    const k = edge ? 0.35 : dark ? 0.85 : 1; raw[o] = r * k; raw[o + 1] = g * k; raw[o + 2] = b * k;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const buf = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  return 'data:image/png;base64,' + buf.toString('base64');
}

const SHAPES: [number, number][] = [[1200, 800], [800, 1200], [1200, 900], [1600, 600], [900, 900], [700, 1000]]; // paysage, portrait, 4:3, panorama, carré, portrait
const COLORS = [[200, 120, 90], [90, 140, 200], [120, 180, 110], [190, 160, 70], [150, 110, 190], [100, 170, 170]];
const LOREM = 'Merci pour toutes ces années de collaboration, de partage et de fous rires. Ton calme, ta simplicité et ton travail acharné resteront des exemples pour toute l’équipe. ';
const rows = (n: number, start = 0): BookEntry['rows'] => {
  const items = Array.from({ length: n }, (_, i) => SHAPES[(start + i) % SHAPES.length]);
  return justifyRows(items.map(([w, h]) => w / h), CONTENT_W, { gap: ROW_GAP, maxRowHeight: MAX_ROW_H })
    .map((r) => r.photos.map((p) => ({ src: png(items[p.index][0] / 4, items[p.index][1] / 4, COLORS[(start + p.index) % 6]), width: p.width, height: p.height, caption: p.index === 0 ? 'Légende de la photo' : '' })));
};
const E = (i: number, name: string, message: string, extra: Partial<BookEntry> = {}): BookEntry =>
  ({ id: `e${i}`, name, relation: 'Collègue', date: '19 août 2026', message, anecdote: '', wish: '', rows: [], photoCount: 0, ...extra });

const entries: BookEntry[] = [
  E(0, 'Awa Mballa', 'Bonne retraite !'),
  E(1, 'Paul Ekoto', LOREM.repeat(2) + 'À très vite 🙏🏾😂❤️', { anecdote: 'Le fameux déjeuner à Edéa 😄 qui a duré trois heures.', wish: 'Santé de fer et beaux voyages ✈️' }),
  E(2, 'Léa Tchoumi', LOREM, { rows: rows(4), photoCount: 4, wish: 'Repos mérité.' }),
  E(3, 'Samuel Nkoa', (LOREM + '\n\n').repeat(14) + 'Merci encore.', { relation: 'Ancien supérieur', anecdote: LOREM.repeat(3) }),
  E(4, 'Inès Biyong', LOREM, { rows: rows(6, 1), photoCount: 6 }),
  E(5, 'Marc Fotso', 'Un seul portrait.', { rows: rows(1, 1), photoCount: 1 }),
  E(6, 'Carine Ndjock', LOREM, { rows: rows(2, 3), photoCount: 2, anecdote: 'Un panorama et un carré.' }),
  E(7, 'Joël Mbarga', LOREM.repeat(3), { rows: rows(5, 2), photoCount: 5, wish: 'Que la retraite soit douce.' }),
  E(8, 'Élodie Kamga', 'Message court.', { rows: [[{ src: null, width: 160, height: 110, caption: '' }]], photoCount: 1 }), // photo indisponible
];

const data = (draft: boolean, known: Map<string, number>, written: Map<string, number>): BookData => ({
  title: "LIVRE D'OR DU DÉPART À LA RETRAITE", recipient: 'Monsieur Jean-Michel Edimo', subtitle: 'Recueil officiel des témoignages et vœux d’amitié',
  eventDate: 'Août 2026', preface: 'Une carrière remarquable se mesure aux liens profonds et aux rires partagés.', closing: 'Que cette nouvelle vie vous apporte santé et sérénité.',
  wishLabel: 'Vœux pour la retraite', palette: PALETTES.royal_navy, entries, cover: null, draft, keepEmoji: true, known, written,
  fonts: { reg: { fontFamily: 'Times-Roman' }, ital: { fontFamily: 'Times-Italic' }, bold: { fontFamily: 'Times-Bold' }, head: { fontFamily: 'Times-Bold' }, embedded: false },
});

Font.registerHyphenationCallback((w: string) => [w]);
try { registerEmoji(Font); } catch { /* hors ligne : emoji ignorés */ }
const written = new Map<string, number>();
await renderToFile(<BookDocument data={data(true, new Map(), written)} />, '/tmp/pass1.pdf');
await renderToFile(<BookDocument data={data(false, new Map(written), new Map())} />, 'sample-livre-dor.pdf');
console.log('Écrit : sample-livre-dor.pdf — pages mesurées pour le sommaire :', Object.fromEntries(written));
