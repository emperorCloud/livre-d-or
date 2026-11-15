import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { listIndexableProgrammes } from '@/lib/funeral/db';
import { SERVICE_PAGES } from '@/lib/homeContent';

export const dynamic = 'force-dynamic';

// Accueil + pages de PROGRAMME de deuil dont la famille a autorisé le référencement.
// Les livres d'or (liens privés, /i/…) et les invitations de mariage (/inv/…) ne sont jamais listés.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const home: MetadataRoute.Sitemap = [{ url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
  const services: MetadataRoute.Sitemap = SERVICE_PAGES.map((s) => ({ url: `${base}/evenements/${s.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 }));
  const pages = await listIndexableProgrammes().catch(() => []);
  return [...home, ...services, ...pages.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.6 }))];
}
