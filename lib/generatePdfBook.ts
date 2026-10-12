import type { GuestEntry } from './types';

export interface PdfBookOptions {
  theme: 'royal_navy' | 'burgundy_gold' | 'classic_parchment' | 'emerald_prestige';
  bookTitle: string;
  recipientName: string;
  dedicationSubtitle: string;
  eventDate: string;
  includePhotos: boolean;
  onProgress?: (progress: number, status: string) => void;
  // --- v2 (facultatifs : l'ancien modal fonctionne sans) ---
  imageQuality?: 'screen' | 'print'; // écran : léger ; impression : haute définition (défaut)
  prefaceText?: string;
  closingMessage?: string;
  wishLabel?: string;                // « Vœux pour la retraite », « Vœux de bonheur »…
  coverPhotoUrl?: string;            // photo du concerné pour la couverture
}

/**
 * Génère le livre d'or en PDF. Même signature qu'avant (le modal existant n'a rien à changer), mais le moteur est
 * entièrement nouveau : voir lib/pdf/. Chargé à la demande pour ne pas alourdir le site.
 */
export async function generateGoldenBookPdf(entries: GuestEntry[], options: PdfBookOptions): Promise<Blob> {
  const { generateBook } = await import('./pdf/generate');
  return generateBook(entries, options);
}
