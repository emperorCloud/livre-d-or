import type { CeremonyType, ThemeConfig } from './types';
import { isOwnedStorageUrl } from './storage';

// Préréglages par type de cérémonie (valeurs de départ, tout est modifiable
// ensuite par l'admin et stocké en base — rien de ceci n'est du contenu figé).
export const THEME_PRESETS: Record<CeremonyType, ThemeConfig> = {
  deuil: {
    fontStyle: 'cormorant', paperTexture: 'parchment', primaryColor: '#1C1917', accentColor: '#57534E',
    bgGradient: 'from-stone-100 via-stone-50 to-neutral-200/50', coverImage: '',
    coverQuote: 'Le souvenir est le parfum de l’âme qui ne s’éteint jamais.', coverQuoteAuthor: 'George Sand',
    symbol: 'candle', borderStyle: 'classic',
  },
  mariage: {
    fontStyle: 'cormorant', paperTexture: 'ivory', primaryColor: '#854D0E', accentColor: '#CA8A04',
    bgGradient: 'from-amber-50/70 via-stone-50 to-stone-100', coverImage: '',
    coverQuote: 'Aimer, c’est trouver sa propre richesse dans le cœur de l’autre.', coverQuoteAuthor: 'Romain Rolland',
    symbol: 'ring', borderStyle: 'ornate',
  },
  anniversaire: {
    fontStyle: 'lora', paperTexture: 'alabaster', primaryColor: '#78350F', accentColor: '#D97706',
    bgGradient: 'from-amber-100/50 via-stone-50 to-orange-50/30', coverImage: '',
    coverQuote: 'Chaque année est un nouveau chapitre riche de souvenirs inoubliables.', coverQuoteAuthor: '',
    symbol: 'champagne', borderStyle: 'modern',
  },
  retraite: {
    fontStyle: 'cinzel', paperTexture: 'linen', primaryColor: '#1E3A8A', accentColor: '#B45309',
    bgGradient: 'from-sky-50/60 via-stone-50 to-amber-50/40', coverImage: '',
    coverQuote: 'Le secret du changement est de construire l’avenir plutôt que de lutter contre le passé.', coverQuoteAuthor: 'Socrate',
    symbol: 'pen', borderStyle: 'minimal',
  },
};

const FONTS = ['cormorant', 'cinzel', 'lora'];
const PAPERS = ['ivory', 'parchment', 'alabaster', 'linen', 'noir'];
const SYMBOLS = ['candle', 'lily', 'ring', 'heart', 'champagne', 'pen', 'quill', 'star'];
const BORDERS = ['classic', 'minimal', 'ornate', 'modern'];
const COLOR = /^#[0-9a-fA-F]{6}$/;
const GRADIENT = /^[a-z0-9\/\-\s.:\[\]%]{0,120}$/; // classes Tailwind uniquement

/** Fusionne un thème partiel sur le préréglage, en n'acceptant que des valeurs valides. */
export function buildTheme(type: CeremonyType, patch: Partial<ThemeConfig> = {}): ThemeConfig {
  const t: ThemeConfig = { ...THEME_PRESETS[type] };
  if (FONTS.includes(patch.fontStyle as string)) t.fontStyle = patch.fontStyle!;
  if (PAPERS.includes(patch.paperTexture as string)) t.paperTexture = patch.paperTexture!;
  if (SYMBOLS.includes(patch.symbol as string)) t.symbol = patch.symbol!;
  if (BORDERS.includes(patch.borderStyle as string)) t.borderStyle = patch.borderStyle!;
  if (patch.primaryColor && COLOR.test(patch.primaryColor)) t.primaryColor = patch.primaryColor;
  if (patch.accentColor && COLOR.test(patch.accentColor)) t.accentColor = patch.accentColor;
  if (typeof patch.bgGradient === 'string' && GRADIENT.test(patch.bgGradient)) t.bgGradient = patch.bgGradient;
  if (typeof patch.coverImage === 'string') t.coverImage = sanitizeBlobUrl(patch.coverImage);
  if (typeof patch.coverQuote === 'string') t.coverQuote = patch.coverQuote.slice(0, 400);
  if (typeof patch.coverQuoteAuthor === 'string') t.coverQuoteAuthor = patch.coverQuoteAuthor.slice(0, 120);
  if (typeof patch.footerText === 'string') t.footerText = patch.footerText.slice(0, 200);
  return t;
}

/** N'accepte que des URL de NOTRE stockage (Vercel Blob ou R2) : bloque pixels espions et URL arbitraires. */
export function sanitizeBlobUrl(url: string): string {
  return typeof url === 'string' && isOwnedStorageUrl(url) ? new URL(url).toString() : '';
}
