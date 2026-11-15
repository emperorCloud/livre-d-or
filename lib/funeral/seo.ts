import type { Metadata } from 'next';
import { siteUrl, trimDescription } from '../seo';
import type { PublicProgramme } from './types';
import { frDate } from './format';

const displayName = (p: PublicProgramme) => [p.config.profile.titles, p.ceremony.honoreeName].filter(Boolean).join(' ');

export function programmeTitle(p: PublicProgramme): string {
  const first = [...p.config.events].filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  const when = frDate(first?.date || '') || p.ceremony.date;
  return `Obsèques de ${displayName(p)}${when ? ` — ${when}` : ''} : programme, convois et dons`;
}

export function programmeDescription(p: PublicProgramme): string {
  const pr = p.config.profile;
  const where = p.ceremony.location || pr.hometown;
  const base = pr.epitaph || pr.familyMessage || `La famille vous informe du programme des obsèques de ${displayName(p)}${where ? ` à ${where}` : ''} : cérémonies, convois en bus et soutien à la famille.`;
  return trimDescription(base);
}

export function programmeMetadata(p: PublicProgramme): Metadata {
  const url = `${siteUrl()}/p/${p.slug}`;
  const title = programmeTitle(p), description = programmeDescription(p);
  const index = p.config.profile.searchIndexing;
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } }
      : { index: false, follow: false },
    // L'image d'aperçu (WhatsApp, Facebook…) : photo du défunt si elle existe, sinon la carte violette générée (opengraph-image.tsx).
    openGraph: { type: 'article', url, title, description, locale: 'fr_FR', images: p.config.profile.photoUrl ? [{ url: p.config.profile.photoUrl, alt: displayName(p) }] : undefined },
    twitter: { card: 'summary_large_image', title, description },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

/** Données structurées schema.org : la personne et chaque cérémonie du programme (Cameroun : UTC+01:00). */
export function programmeJsonLd(p: PublicProgramme): Record<string, unknown> {
  const url = `${siteUrl()}/p/${p.slug}`, pr = p.config.profile;
  const person: Record<string, unknown> = {
    '@type': 'Person', '@id': `${url}#person`, name: p.ceremony.honoreeName,
    ...(pr.birthDate ? { birthDate: pr.birthDate } : {}), ...(pr.deathDate ? { deathDate: pr.deathDate } : {}),
    ...(pr.hometown ? { homeLocation: { '@type': 'Place', name: pr.hometown } } : {}),
    ...(pr.photoUrl ? { image: pr.photoUrl } : {}),
  };
  const events = p.config.events.filter((e) => e.date).map((e) => ({
    '@type': 'Event', name: `${e.title} — ${p.ceremony.honoreeName}`,
    startDate: e.startTime ? `${e.date}T${e.startTime}:00+01:00` : e.date,
    ...(e.endTime ? { endDate: `${e.date}T${e.endTime}:00+01:00` } : {}),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
    ...(e.description ? { description: trimDescription(e.description, 300) } : {}),
    ...((e.locationName || e.locationAddress) ? { location: { '@type': 'Place', name: e.locationName || e.locationAddress, address: e.locationAddress || e.locationName } } : {}),
    url,
  }));
  return {
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'WebPage', '@id': url, url, name: programmeTitle(p), description: programmeDescription(p), inLanguage: 'fr', about: { '@id': `${url}#person` } }, person, ...events],
  };
}
