// Validation PURE (aucune dépendance) de tout ce qui entre dans le gestionnaire d'invitations.
// Principe : on reconstruit les objets champ par champ à partir d'une liste blanche ; tout champ inconnu est ignoré,
// toutes les longueurs sont bornées, les liens sont limités à http(s) et les images à notre stockage.
import type { DietaryOption, RsvpStatus, WeddingConfig } from './types';
import { aggregateRsvp } from './rsvp';

type R<T> = { ok: true; value: T } | { ok: false; error: string };
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const bool = (v: unknown, d = false) => (typeof v === 'boolean' ? v : d);
const int = (v: unknown, min: number, max: number, d: number) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : d; };
const has = (b: any, k: string) => isObj(b) && Object.prototype.hasOwnProperty.call(b, k);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\-.\s]{0,30}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const KEY = /^[A-Za-z0-9_-]{1,40}$/;
const RSVPS: RsvpStatus[] = ['pending', 'confirmed', 'declined'];
export const DIETS: DietaryOption[] = ['classic', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'other'];

/** Lien http(s) uniquement (jamais javascript:, data:…). Retourne '' si invalide. */
export function cleanUrl(v: unknown): string {
  const s = clip(v, 500);
  if (!s) return '';
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''; } catch { return ''; }
}

// ---------- Invité ----------
export interface Representative { hasRequested: boolean; name: string; contact: string; reason: string; status: 'pending' | 'approved' | 'rejected' }
export interface GuestFields {
  greetingTitle: string; firstName: string; lastName: string; email: string; phone: string; tableNumber: string; category: string;
  rsvpStatus: RsvpStatus; guestRsvp: RsvpStatus; partnerRsvp: RsvpStatus; plusOneAllowed: boolean; plusOneConfirmed: boolean; plusOneName: string; childrenCount: number;
  dietaryPreference: DietaryOption; allergies: string; personalNote: string; partnerNote: string; notes: string;
  attendingEvents: Record<string, boolean>; representative: Representative | null;
}

export function cleanAttendingEvents(v: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!isObj(v)) return out;
  for (const [k, val] of Object.entries(v).slice(0, 30)) if (KEY.test(k) && typeof val === 'boolean') out[k] = val;
  return out;
}

export function cleanRepresentative(v: unknown): Representative | null {
  if (!isObj(v) || !v.hasRequested) return null;
  const status = v.status === 'approved' || v.status === 'rejected' ? v.status : 'pending';
  return { hasRequested: true, name: clip(v.name, 120), contact: clip(v.contact, 120), reason: clip(v.reason, 300), status };
}

/** Création / modification par le responsable. En modification (partial), seuls les champs fournis sont contrôlés et renvoyés. */
export function cleanGuest(b: any, partial = false): R<Partial<GuestFields>> {
  const o: Partial<GuestFields> = {};
  const w = (k: string) => !partial || has(b, k);
  if (w('greetingTitle')) o.greetingTitle = clip(b?.greetingTitle, 120);
  if (w('firstName')) o.firstName = clip(b?.firstName, 80);
  if (w('lastName')) o.lastName = clip(b?.lastName, 80);
  if (w('email')) { const e = clip(b?.email, 200); if (e && !EMAIL.test(e)) return { ok: false, error: 'Adresse e-mail invalide.' }; o.email = e; }
  if (w('phone')) { const p = clip(b?.phone, 30); if (!PHONE.test(p)) return { ok: false, error: 'Numéro de téléphone invalide.' }; o.phone = p; }
  if (w('tableNumber')) o.tableNumber = clip(b?.tableNumber, 20);
  if (w('category')) o.category = clip(b?.category, 60);
  if (w('rsvpStatus')) o.rsvpStatus = b?.rsvpStatus === 'confirmed' || b?.rsvpStatus === 'declined' ? b.rsvpStatus : 'pending';
  if (w('guestRsvp')) o.guestRsvp = RSVPS.includes(b?.guestRsvp) ? b.guestRsvp : 'pending';
  if (w('partnerRsvp')) o.partnerRsvp = RSVPS.includes(b?.partnerRsvp) ? b.partnerRsvp : 'pending';
  if (w('plusOneAllowed')) o.plusOneAllowed = bool(b?.plusOneAllowed);
  if (w('plusOneConfirmed')) o.plusOneConfirmed = bool(b?.plusOneConfirmed);
  if (w('plusOneName')) o.plusOneName = clip(b?.plusOneName, 80);
  if (w('childrenCount')) o.childrenCount = int(b?.childrenCount, 0, 20, 0);
  if (w('dietaryPreference')) o.dietaryPreference = DIETS.includes(b?.dietaryPreference) ? b.dietaryPreference : 'classic';
  if (w('allergies')) o.allergies = clip(b?.allergies, 200);
  if (w('personalNote')) o.personalNote = clip(b?.personalNote, 600);
  if (w('partnerNote')) o.partnerNote = clip(b?.partnerNote, 600);
  if (w('notes')) o.notes = clip(b?.notes, 600);
  if (w('attendingEvents')) o.attendingEvents = cleanAttendingEvents(b?.attendingEvents);
  if (w('representativeRequest')) o.representative = cleanRepresentative(b?.representativeRequest);
  if (!partial && !(o.greetingTitle || o.firstName || o.lastName)) return { ok: false, error: "Indiquez au moins un nom ou un nom d'invitation." };
  if (partial && ('greetingTitle' in o || 'firstName' in o || 'lastName' in o) === false) return { ok: true, value: o };
  return { ok: true, value: o };
}

/**
 * Réponse de l'invité lui-même (via son lien). Invitation couple : CHAQUE personne doit répondre (présent ou absent) dans le même formulaire.
 * `guestRsvp` / `partnerRsvp` donnent la réponse de chacun ; `rsvpStatus` (ancien champ) reste accepté pour une invitation individuelle.
 */
export function cleanGuestRsvp(b: any, couple: boolean): R<Partial<GuestFields>> {
  const answer = (x: unknown) => (x === 'confirmed' || x === 'declined' ? (x as RsvpStatus) : null);
  const guest = answer(b?.guestRsvp ?? b?.rsvpStatus);
  const partner = couple ? answer(b?.partnerRsvp) : null;
  if (!guest) return { ok: false, error: couple ? 'Indiquez votre réponse.' : 'Choisissez une réponse.' };
  if (couple && !partner) return { ok: false, error: 'Chaque personne de l\'invitation doit répondre (présent ou absent).' };
  const nobody = guest === 'declined' && (!couple || partner === 'declined');
  return { ok: true, value: {
    guestRsvp: guest, partnerRsvp: couple ? partner! : 'pending', rsvpStatus: aggregateRsvp(guest, couple ? partner! : 'pending', couple),
    plusOneConfirmed: couple && partner === 'confirmed',
    plusOneName: couple ? clip(b.plusOneName, 80) : '',
    childrenCount: nobody ? 0 : int(b.childrenCount, 0, 20, 0),
    dietaryPreference: DIETS.includes(b.dietaryPreference) ? b.dietaryPreference : 'classic',
    allergies: clip(b.allergies, 200), personalNote: clip(b.personalNote, 600), partnerNote: couple ? clip(b.partnerNote, 600) : '',
    attendingEvents: nobody ? {} : cleanAttendingEvents(b.attendingEvents),
  } };
}

export function cleanRepresentativeRequest(b: any): R<Representative> {
  const name = clip(b?.name, 120);
  if (!name) return { ok: false, error: 'Indiquez le nom de la personne qui vous représentera.' };
  return { ok: true, value: { hasRequested: true, name, contact: clip(b?.contact, 120), reason: clip(b?.reason, 300), status: 'pending' } };
}

// ---------- Annonces, messages, réservations ----------
export function cleanAnnouncement(b: any): R<{ title: string; message: string; priority: 'info' | 'important' | 'urgent'; target: 'all' | 'confirmed_only'; author: string }> {
  const title = clip(b?.title, 120), message = clip(b?.message, 1000);
  if (!title || !message) return { ok: false, error: 'Le titre et le message sont requis.' };
  return { ok: true, value: { title, message, priority: b?.priority === 'urgent' || b?.priority === 'important' ? b.priority : 'info', target: b?.target === 'confirmed_only' ? 'confirmed_only' : 'all', author: clip(b?.author, 80) } };
}
export const CHANNELS = ['general', 'covoiturage', 'logement', 'temoins'] as const;
export function cleanMessage(b: any): R<{ channelId: (typeof CHANNELS)[number]; content: string; senderName: string }> {
  const content = clip(b?.content, 1000);
  if (!content) return { ok: false, error: 'Le message est vide.' };
  return { ok: true, value: { channelId: CHANNELS.includes(b?.channelId) ? b.channelId : 'general', content, senderName: clip(b?.senderName, 80) } };
}
export function cleanPledge(b: any): R<{ guestName: string; guestContact: string; quantity: number; message: string }> {
  const guestName = clip(b?.guestName, 120);
  if (!guestName) return { ok: false, error: 'Indiquez votre nom.' };
  return { ok: true, value: { guestName, guestContact: clip(b?.guestContact, 60), quantity: int(b?.quantity, 1, 20, 1), message: clip(b?.message, 300) } };
}

// ---------- Contenu de l'invitation ----------
export const MUSIC_TRACKS = ['canon', 'celeste', 'valse', 'ambient_harp', 'custom', 'uploaded'] as const;
const GIFT_TYPES = ['orange_money', 'momo', 'sumup', 'paypal', 'rib', 'registry'] as const;
const OVERLAYS = ['soft', 'dark', 'transparent'] as const;

/** Numéro ou lien de paiement : lien http(s) valide, ou texte simple (jamais javascript:/data:). */
function cleanNumberOrLink(v: unknown): string {
  const s = clip(v, 200);
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return /^https?:\/\//i.test(s) ? cleanUrl(s) : '';
  return s;
}
const arr = (v: unknown, max: number): any[] => (Array.isArray(v) ? v.slice(0, max).filter(isObj) : []);
const id = (v: unknown, fallback: string) => (typeof v === 'string' && KEY.test(v) ? v : fallback);

/**
 * Fusionne une modification de configuration sur la configuration actuelle. Les champs fournis sont validés ;
 * les autres restent inchangés. `isOwnedUrl` : n'accepte pour les images que NOTRE stockage.
 */
export function cleanConfig(b: any, cur: WeddingConfig, deps: { isOwnedUrl: (u: string) => boolean }): WeddingConfig {
  const c: WeddingConfig = { ...cur };
  const img = (v: unknown) => { const s = clip(v, 500); return s && deps.isOwnedUrl(s) ? s : ''; };
  const set = <K extends keyof WeddingConfig>(k: K, fn: () => WeddingConfig[K]) => { if (has(b, k as string)) c[k] = fn(); };

  set('coupleNames', () => clip(b.coupleNames, 120));
  set('eventDate', () => (Number.isNaN(Date.parse(clip(b.eventDate, 40))) ? cur.eventDate : clip(b.eventDate, 40)));
  set('eventTime', () => (TIME.test(clip(b.eventTime, 5)) ? clip(b.eventTime, 5) : cur.eventTime));
  set('venueName', () => clip(b.venueName, 160)); set('venueAddress', () => clip(b.venueAddress, 200)); set('venueCity', () => clip(b.venueCity, 120));
  set('mapsUrl', () => cleanUrl(b.mapsUrl));
  set('heroImageUrl', () => img(b.heroImageUrl)); set('heroImageOnly', () => bool(b.heroImageOnly)); set('ticketImageUrl', () => img(b.ticketImageUrl)); set('brideImageUrl', () => img(b.brideImageUrl));
  set('dressCode', () => clip(b.dressCode, 300));
  set('dressCodeColors', () => arr(b.dressCodeColors, 12).map((x, i) => ({ id: id(x.id, `c${i}`), name: clip(x.name, 40), hex: HEX.test(clip(x.hex, 7)) ? clip(x.hex, 7) : '#cccccc' })));
  set('storyQuote', () => clip(b.storyQuote, 300)); set('storyTitle', () => clip(b.storyTitle, 120)); set('storyText', () => clip(b.storyText, 3000));
  set('storyPhotos', () => arr(b.storyPhotos, 24).map((x, i) => ({ id: id(x.id, `s${i}`), title: clip(x.title, 120), description: clip(x.description, 500), imageUrl: img(x.imageUrl) })));
  set('timelineEvents', () => arr(b.timelineEvents, 20).map((x, i) => ({
    id: id(x.id, `e${i}`), order: clip(x.order, 4), title: clip(x.title, 120), dateStr: clip(x.dateStr, 60), time: TIME.test(clip(x.time, 5)) ? clip(x.time, 5) : '',
    locationName: clip(x.locationName, 160), locationDetails: clip(x.locationDetails, 300), city: clip(x.city, 120), mapsUrl: cleanUrl(x.mapsUrl) })));
  set('giftOptions', () => arr(b.giftOptions, 20).map((x, i) => ({
    id: id(x.id, `g${i}`), type: (GIFT_TYPES as readonly string[]).includes(x.type) ? x.type : 'registry', beneficiaryName: clip(x.beneficiaryName, 120),
    numberOrLink: cleanNumberOrLink(x.numberOrLink), badgeText: clip(x.badgeText, 40), note: clip(x.note, 300), suggestedAmount: clip(x.suggestedAmount, 40) })));
  set('physicalGifts', () => arr(b.physicalGifts, 60).map((x, i) => ({
    id: id(x.id, `p${i}`), title: clip(x.title, 160), name: clip(x.name, 160), description: clip(x.description, 500), category: clip(x.category, 60) || 'Autre',
    brandReference: clip(x.brandReference, 120), colorOrFinish: clip(x.colorOrFinish, 120), whereToFind: clip(x.whereToFind, 200), externalUrl: cleanUrl(x.externalUrl),
    estimatedPrice: clip(x.estimatedPrice, 40), imageUrl: img(x.imageUrl), desiredQuantity: int(x.desiredQuantity, 1, 999, 1), reservedQuantity: 0 })));
  set('usefulContacts', () => arr(b.usefulContacts, 20).map((x, i) => ({ id: id(x.id, `u${i}`), role: clip(x.role, 80), name: clip(x.name, 120), phone: PHONE.test(clip(x.phone, 30)) ? clip(x.phone, 30) : '' })));
  set('tablesList', () => arr(b.tablesList, 100).map((x, i) => ({ id: id(x.id, `t${i}`), name: clip(x.name, 60), capacity: int(x.capacity, 0, 100, 0), description: clip(x.description, 200) })));
  set('musicTrack', () => ((MUSIC_TRACKS as readonly string[]).includes(b.musicTrack) ? b.musicTrack : cur.musicTrack));
  set('musicTitle', () => clip(b.musicTitle, 120)); set('customMusicUrl', () => cleanUrl(b.customMusicUrl));
  set('contactPhone', () => (PHONE.test(clip(b.contactPhone, 30)) ? clip(b.contactPhone, 30) : cur.contactPhone));
  set('contactEmail', () => (EMAIL.test(clip(b.contactEmail, 200)) ? clip(b.contactEmail, 200) : ''));
  set('guestHeaderBgColor', () => (HEX.test(clip(b.guestHeaderBgColor, 7)) ? clip(b.guestHeaderBgColor, 7) : undefined));
  set('guestAccentColor', () => (HEX.test(clip(b.guestAccentColor, 7)) ? clip(b.guestAccentColor, 7) : undefined));
  set('responsableThemeColor', () => (HEX.test(clip(b.responsableThemeColor, 7)) ? clip(b.responsableThemeColor, 7) : undefined));
  set('guestHeroOverlayStyle', () => ((OVERLAYS as readonly string[]).includes(b.guestHeroOverlayStyle) ? b.guestHeroOverlayStyle : 'soft'));
  set('loadingScreenTitle', () => clip(b.loadingScreenTitle, 120)); set('loadingScreenSubtitle', () => clip(b.loadingScreenSubtitle, 200));
  return c;
}
