import React from 'react';
import { getEntryPhotos, type GuestEntry } from '../types';
import type { PdfBookOptions } from '../generatePdfBook';
import { CONTENT_W, MAX_ROW_H, PALETTES, ROW_GAP } from './geometry';
import { justifyRows, targetPixels } from './layout';
import { formatDateFr } from './text';
import { fetchImageBlob, measureBlob, renderJpegDataUrl, mapPool } from './images';
import { setupFonts, registerEmoji } from './fonts';
import type { BookData, BookEntry, BookPhoto } from './BookDocument';

const DEFAULT_PREFACE =
  'Une carrière remarquable ne se mesure pas seulement aux projets et succès accomplis, mais aux liens profonds, aux rires partagés et à l’inspiration transmise au quotidien. Ce recueil rassemble les mots sincères, anecdotes complices et vœux chaleureux de tous ceux qui ont eu l’immense privilège de partager ce chemin à vos côtés.';
const DEFAULT_CLOSING = 'Que cette nouvelle vie vous apporte santé, sérénité, voyages et mille bonheurs entouré de vos proches.';

export async function generateBook(entries: GuestEntry[], options: PdfBookOptions): Promise<Blob> {
  const {
    theme = 'royal_navy', bookTitle, recipientName, dedicationSubtitle, eventDate, includePhotos = true,
    imageQuality = 'print', prefaceText = DEFAULT_PREFACE, closingMessage = DEFAULT_CLOSING,
    wishLabel = 'Vœux pour la retraite', coverPhotoUrl, onProgress,
  } = options;
  const say = (p: number, s: string) => onProgress?.(p, s);
  const dpi = imageQuality === 'screen' ? 130 : 200;
  const jpegQ = imageQuality === 'screen' ? 0.78 : 0.86;

  say(3, 'Chargement du moteur de composition…');
  const { pdf, Font } = await import('@react-pdf/renderer');
  const { BookDocument } = await import('./BookDocument');
  const fonts = await setupFonts(Font);

  // 1. Témoignages approuvés : épinglés d'abord, puis par date.
  const approved = entries
    .filter((e) => e.isApproved !== false)
    .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned) || new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // 2. Dimensions de chaque photo (connues en base ; sinon mesurées une seule fois).
  say(8, 'Analyse des photos…');
  const photosOf = approved.map((e) => (includePhotos ? getEntryPhotos(e) : []));
  const legacy = new Map<string, Blob>(); // photos sans dimensions : on garde le blob mesuré pour ne pas le retélécharger
  const flat = photosOf.flatMap((list, ei) => list.map((ph, pi) => ({ ei, pi, ph })));
  const dims: ({ w: number; h: number } | null)[] = await mapPool(flat, 4, async ({ ph }) => {
    if (ph.width && ph.height) return { w: ph.width, h: ph.height };
    try { const b = await fetchImageBlob(ph.url); legacy.set(ph.url, b); return await measureBlob(b); } catch { return null; }
  });

  // 3. Mise en page : TOUTES les photos, rangées justifiées (ratio conservé), aucun plafond.
  const layouts = photosOf.map((list, ei) => {
    const aspects = list.map((_, pi) => { const d = dims[flat.findIndex((f) => f.ei === ei && f.pi === pi)]; return d ? d.w / d.h : NaN; });
    return justifyRows(aspects, CONTENT_W, { gap: ROW_GAP, maxRowHeight: MAX_ROW_H });
  });

  // 4. Préparation des images à la définition utile (en parallèle limité, avec progression).
  const jobs = layouts.flatMap((rows, ei) => rows.flatMap((r) => r.photos.map((pp) => ({ ei, pp }))));
  let done = 0, failed = 0;
  const prepared = await mapPool(jobs, 3, async ({ ei, pp }) => {
    const ph = photosOf[ei][pp.index];
    try {
      const blob = legacy.get(ph.url) ?? (await fetchImageBlob(ph.url));
      return await renderJpegDataUrl(blob, targetPixels(pp.width, dpi), jpegQ);
    } catch (err) {
      failed++; console.warn('Photo introuvable pour le PDF :', ph.url, err); return null;
    } finally {
      done++; say(10 + Math.round((done / Math.max(1, jobs.length)) * 60), `Préparation des photos (${done}/${jobs.length})…`);
    }
  });
  let cursor = 0;
  const bookEntries: BookEntry[] = approved.map((e, ei) => ({
    id: `entry-${ei}-${e.id}`.replace(/[^A-Za-z0-9_-]/g, '_'),
    name: `${e.firstName} ${e.lastName}`.trim(),
    relation: e.relationship && e.relationship !== 'Autre' ? String(e.relationship) : '',
    date: formatDateFr(e.createdAt),
    message: e.message || '', anecdote: e.anecdote || '', wish: e.wish || '',
    photoCount: photosOf[ei].length,
    rows: layouts[ei].map((row): BookPhoto[] => row.photos.map((pp) => ({
      src: prepared[cursor++], width: pp.width, height: pp.height, caption: photosOf[ei][pp.index].caption || '',
    }))),
  }));

  let cover: BookData['cover'] = null;
  if (coverPhotoUrl) {
    try {
      const b = await fetchImageBlob(coverPhotoUrl);
      const d = await measureBlob(b);
      cover = { src: await renderJpegDataUrl(b, 900, 0.85), width: d.w, height: d.h };
    } catch { /* la couverture reste sans photo */ }
  }

  // 5. Deux passes : la 1re (sans images, rapide) mesure la page de chaque témoignage pour le sommaire.
  const base = {
    title: bookTitle, recipient: recipientName, subtitle: dedicationSubtitle, eventDate, preface: prefaceText,
    closing: closingMessage, wishLabel, palette: PALETTES[theme] ?? PALETTES.royal_navy, fonts, entries: bookEntries, cover,
  };
  const render = async (data: BookData) => pdf(React.createElement(BookDocument, { data }) as any).toBlob();

  say(75, 'Mise en page du livre…');
  let keepEmoji = true;
  try { registerEmoji(Font); } catch { keepEmoji = false; }
  const pass = async (draft: boolean, known: Map<string, number>) => {
    const written = new Map<string, number>();
    const attempt = (emoji: boolean) => render({ ...base, draft, keepEmoji: emoji, known, written });
    try { return { blob: await attempt(keepEmoji), written }; }
    catch (err) {
      if (!keepEmoji) throw err;
      console.warn('Emoji indisponibles (hors ligne ?) : composition sans emoji.', err);
      keepEmoji = false;
      return { blob: await attempt(false), written };
    }
  };

  const first = await pass(true, new Map());
  const known = first.written.size === bookEntries.length ? first.written : new Map<string, number>();
  say(85, 'Assemblage du PDF final…');
  const final = await pass(false, known);

  say(100, failed > 0
    ? `Livre généré. ${failed} photo(s) n'ont pas pu être chargées (marquées « Photo indisponible » dans le PDF).`
    : 'Livre généré.');
  return final.blob;
}
