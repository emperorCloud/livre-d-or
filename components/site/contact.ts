import type { SiteSettings } from '@/lib/siteSettings';

/** Lien de contact de l'agence : WhatsApp en priorité, sinon e-mail, sinon rien (le bouton est alors masqué). */
export function contactLink(s: SiteSettings, subject = "Organisation d'un événement"): { href: string; label: string } | null {
  if (s.contactWhatsapp) return { href: `https://wa.me/${s.contactWhatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite vous parler de mon événement : ${subject}.`)}`, label: 'Nous écrire sur WhatsApp' };
  if (s.contactEmail) return { href: `mailto:${s.contactEmail}?subject=${encodeURIComponent(subject)}`, label: 'Nous écrire par e-mail' };
  return null;
}
