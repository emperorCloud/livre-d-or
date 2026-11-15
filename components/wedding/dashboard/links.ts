import type { Guest, WeddingConfig } from '@/lib/wedding/types';

const origin = () => (typeof window === 'undefined' ? '' : window.location.origin);
/** Lien personnel de l'invité : il ouvre la page d'invitation (la réponse y est mise en avant), jamais directement le billet. */
export const guestUrl = (g: Guest) => `${origin()}/inv/${g.inviteToken ?? ''}`;
export const displayName = (g: Guest) => g.greetingTitle || `${g.firstName} ${g.lastName}`.trim() || 'Invité';

const dateFr = (c: WeddingConfig) => {
  const d = new Date(c.eventDate);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export function inviteMessage(g: Guest, c: WeddingConfig): string {
  const when = [dateFr(c) && `le ${dateFr(c)}`, c.venueCity && `à ${c.venueCity}`].filter(Boolean).join(' ');
  return `Bonjour ${displayName(g)} !\n\n${c.coupleNames} ont la joie de vous inviter à leur mariage${when ? ` ${when}` : ''}.\n\nOuvrez votre invitation personnelle, découvrez le programme et confirmez votre présence${g.plusOneAllowed ? ' (chacun de vous deux répond)' : ''} :\n👉 ${guestUrl(g)}\n\nVotre billet d'accès (QR code) vous sera remis dès que vous aurez répondu.`;
}
export function reminderMessage(g: Guest, c: WeddingConfig): string {
  return `Bonjour ${displayName(g)},\n\nPetit rappel : ${c.coupleNames} attendent votre réponse pour leur mariage${dateFr(c) ? ` du ${dateFr(c)}` : ''}.\nCela ne prend qu'une minute :\n👉 ${guestUrl(g)}\n\nMerci !`;
}
export function whatsappHref(phone: string | undefined, text: string): string {
  const p = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
