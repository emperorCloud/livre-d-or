// Géométrie A4 en points (1 pt = 1/72 pouce). Partagée par la mise en page et le rendu.
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN_X = 46;
export const CONTENT_W = PAGE_W - MARGIN_X * 2;
export const ROW_GAP = 6;
export const MAX_ROW_H = 230; // une rangée de photos ne dépasse jamais ~1/4 de page

export interface Palette {
  coverBg: string; gold: string; accent: string; coverText: string;
  ink: string; muted: string; paper: string; boxBg: string; wishBg: string; wishBorder: string;
}

const base = { ink: '#2A2118', muted: '#7A6C5A', paper: '#FCFBF9', boxBg: '#FBF6E9', wishBg: '#F0F8F3', wishBorder: '#8FCBA6' };

export const PALETTES: Record<string, Palette> = {
  royal_navy: { ...base, coverBg: '#0A1931', gold: '#DAA520', accent: '#8A5A14', coverText: '#FFEBAF' },
  burgundy_gold: { ...base, coverBg: '#420516', gold: '#DAA520', accent: '#8A5A14', coverText: '#FFEBAF' },
  emerald_prestige: { ...base, coverBg: '#063323', gold: '#DAA520', accent: '#8A5A14', coverText: '#D2F5E1' },
  classic_parchment: { ...base, coverBg: '#F8F4E8', gold: '#A0641E', accent: '#A0641E', coverText: '#1E1914' },
};
