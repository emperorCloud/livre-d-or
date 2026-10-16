import type { CeremonyType, FontStyle, PaperTexture, CeremonySymbol } from '@/lib/types';

export const CEREMONY_TYPES: { type: CeremonyType; label: string; mood: string }[] = [
  { type: 'deuil', label: 'Deuil & Hommage', mood: 'Sérénité, respect et recueillement.' },
  { type: 'mariage', label: 'Mariage & Union', mood: 'Lumineux, romantique et poétique.' },
  { type: 'anniversaire', label: 'Anniversaire & Jubilé', mood: 'Festif, chaleureux et joyeux.' },
  { type: 'retraite', label: 'Retraite & Carrière', mood: 'Honneur, reconnaissance et transmission.' },
];

export const FONTS: { value: FontStyle; label: string }[] = [
  { value: 'cormorant', label: 'Cormorant Garamond (poétique)' },
  { value: 'cinzel', label: 'Cinzel (solennel)' },
  { value: 'lora', label: 'Lora (classique)' },
];
export const PAPERS: { value: PaperTexture; label: string }[] = [
  { value: 'ivory', label: 'Ivoire chaud' }, { value: 'parchment', label: 'Parchemin doux' },
  { value: 'alabaster', label: 'Albâtre minéral' }, { value: 'linen', label: 'Lin écru' }, { value: 'noir', label: 'Noir impérial' },
];
export const SYMBOLS: { value: CeremonySymbol; label: string }[] = [
  { value: 'candle', label: 'Bougie' }, { value: 'lily', label: 'Lys blanc' }, { value: 'ring', label: 'Alliances' },
  { value: 'heart', label: 'Cœur' }, { value: 'champagne', label: 'Coupe' }, { value: 'pen', label: 'Plume d’honneur' },
  { value: 'quill', label: 'Calame' }, { value: 'star', label: 'Étoile d’or' },
];

// Textes proposés par type pour le livre PDF (valeurs de départ ; le responsable/admin peut les changer).
export const PDF_DEFAULTS: Record<CeremonyType, { wishLabel: string; preface: string; closing: string; signature: string }> = {
  deuil: { wishLabel: 'Pensée', preface: 'Ce recueil rassemble les mots, les souvenirs et les pensées de tous ceux qui ont aimé et accompagné celui ou celle que nous honorons.', closing: 'Merci pour vos pensées, vos mots et vos souvenirs.', signature: '— De la part de tous ses proches' },
  mariage: { wishLabel: 'Vœux de bonheur', preface: 'Ce livre rassemble les messages, les souvenirs et les vœux de tous ceux qui entourent les mariés.', closing: 'Merci pour votre présence et pour tous ces mots de tendresse.', signature: '— De la part de tous vos proches' },
  anniversaire: { wishLabel: "Vœux d'anniversaire", preface: 'Ce livre rassemble les messages, les anecdotes et les vœux de tous ceux qui comptent.', closing: 'Merci à toutes et à tous pour ces beaux messages.', signature: '— De la part de tous vos amis' },
  retraite: { wishLabel: 'Vœux pour la retraite', preface: 'Une carrière se mesure aussi aux liens construits et à ce qu’on transmet. Ce recueil rassemble les mots, les anecdotes et les vœux de tous ceux qui ont partagé ce chemin.', closing: 'Que cette nouvelle étape vous apporte santé, sérénité et mille bonheurs.', signature: '— De la part de tous vos collègues et amis' },
};

export function fontClass(font: FontStyle): string {
  return font === 'cinzel' ? 'font-serif-cinzel' : font === 'lora' ? 'font-serif-lora' : 'font-serif-cormorant';
}

export function paperStyle(p: PaperTexture): { bg: string; border: string; text: string } {
  switch (p) {
    case 'parchment': return { bg: '#FBF7F0', border: '#E6DEC8', text: '#1c1917' };
    case 'ivory': return { bg: '#FDFAF5', border: '#ECE3D4', text: '#1c1917' };
    case 'alabaster': return { bg: '#F8F9FA', border: '#E9ECEF', text: '#1c1917' };
    case 'linen': return { bg: '#F5F2EB', border: '#DFD7C7', text: '#1c1917' };
    case 'noir': return { bg: '#18181B', border: '#27272A', text: '#f5f5f4' };
  }
}

export function typeBadge(type: CeremonyType) {
  switch (type) {
    case 'deuil': return { label: 'Deuil & Hommage', cls: 'bg-stone-900 text-stone-100' };
    case 'mariage': return { label: 'Mariage & Union', cls: 'bg-amber-900/90 text-amber-50' };
    case 'anniversaire': return { label: 'Anniversaire & Jubilé', cls: 'bg-orange-800 text-orange-50' };
    case 'retraite': return { label: 'Retraite & Carrière', cls: 'bg-slate-900 text-slate-100' };
  }
}
