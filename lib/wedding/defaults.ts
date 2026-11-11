import type { WeddingConfig } from './types';

/**
 * Configuration de départ d'un mariage, SANS aucun contenu d'exemple : tout vient de la cérémonie (nom, date, lieu)
 * et de la photo à la une ; le reste est vide et se remplit depuis l'onglet « Personnalisation ».
 */
export function defaultWeddingConfig(c: { honoreeName: string; date: string; location: string }, heroImageUrl: string): WeddingConfig {
  const parsed = Date.parse(c.date);
  // Date de la fête : on essaie de lire celle de la cérémonie ; sinon une date provisoire que le responsable remplace.
  const eventDate = Number.isNaN(parsed) ? new Date(Date.now() + 60 * 86400000).toISOString() : new Date(parsed).toISOString();
  return {
    coupleNames: c.honoreeName, eventDate, eventTime: '15:00',
    venueName: '', venueAddress: '', venueCity: c.location, mapsUrl: '',
    heroImageUrl, ticketImageUrl: '', brideImageUrl: '',
    dressCode: '', dressCodeColors: [],
    storyQuote: '', storyTitle: '', storyText: '', storyPhotos: [],
    timelineEvents: [], giftOptions: [], physicalGifts: [], usefulContacts: [], tablesList: [],
    musicTrack: 'ambient_harp', musicTitle: '', customMusicUrl: '',
    contactPhone: '', contactEmail: '',
  };
}
