import type { CardStyle, EntryFormData } from './types';

const STYLES: CardStyle[] = ['polaroid', 'parchment', 'gold', 'sticky', 'modern', 'typewriter'];
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

/** Nettoie et borne les champs d'un témoignage. Retourne null si prénom/nom/message manquent. */
export function cleanEntry(b: any): EntryFormData | null {
  const firstName = clip(b?.firstName, 80), lastName = clip(b?.lastName, 80), message = clip(b?.message, 4000);
  if (!firstName || !lastName || !message) return null;
  return {
    firstName, lastName,
    email: clip(b.email, 200),
    relationship: clip(b.relationship, 80) || 'Autre',
    yearsKnown: clip(b.yearsKnown, 60),
    message,
    anecdote: clip(b.anecdote, 3000),
    wish: clip(b.wish, 1000),
    photos: Array.isArray(b.photos)
      ? b.photos.slice(0, 6).map((p: any) => ({
          id: typeof p?.id === 'string' ? p.id.slice(0, 80) : undefined,
          url: typeof p?.url === 'string' ? p.url : '',
          thumbUrl: typeof p?.thumbUrl === 'string' ? p.thumbUrl : '',
          width: typeof p?.width === 'number' ? p.width : undefined,
          height: typeof p?.height === 'number' ? p.height : undefined,
          caption: clip(p?.caption, 200),
        }))
      : [],
    photoUrl: typeof b.photoUrl === 'string' ? b.photoUrl : '',
    photoCaption: clip(b.photoCaption, 200),
    cardStyle: STYLES.includes(b.cardStyle) ? b.cardStyle : 'polaroid',
  };
}
