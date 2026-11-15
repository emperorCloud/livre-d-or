// Règles de réponse d'une invitation (pures : navigateur et serveur).
// Une invitation « couple » (plusOneAllowed) a DEUX réponses, une par personne ; une invitation individuelle en a une.
import type { Guest, RsvpStatus } from './types';

type Person = Pick<Guest, 'guestRsvp' | 'partnerRsvp' | 'plusOneAllowed'>;

/** Réponse globale de l'invitation : confirmée dès qu'une personne vient, déclinée si toutes déclinent, sinon en attente. */
export function aggregateRsvp(guest: RsvpStatus, partner: RsvpStatus, couple: boolean): RsvpStatus {
  const all = couple ? [guest, partner] : [guest];
  if (all.includes('confirmed')) return 'confirmed';
  if (all.every((s) => s === 'declined')) return 'declined';
  return 'pending';
}

/** Nombre de personnes (adultes) qui viennent : 0, 1 ou 2. */
export const confirmedPersons = (g: Person): number =>
  (g.guestRsvp === 'confirmed' ? 1 : 0) + (g.plusOneAllowed && g.partnerRsvp === 'confirmed' ? 1 : 0);

/** Le billet n'existe que pour ceux qui ont confirmé : au moins une personne présente. */
export const hasTicket = (g: Person): boolean => confirmedPersons(g) > 0;

/** Chaque personne de l'invitation a-t-elle donné sa réponse (présent ou absent) ? */
export const everyoneAnswered = (g: Person): boolean =>
  g.guestRsvp !== 'pending' && (!g.plusOneAllowed || g.partnerRsvp !== 'pending');

export const RSVP_LABEL: Record<RsvpStatus, string> = { confirmed: 'Présent(e)', declined: 'Absent(e)', pending: 'Sans réponse' };
