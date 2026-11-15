import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { listIndexableProgrammes } from '@/lib/funeral/db';

export const dynamic = 'force-dynamic';

// Accueil + pages de PROGRAMME de deuil dont la famille a autorisé le référencement.
// Les livres d'or (liens privés, /i/…) et les invitations de mariage (/inv/…) ne sont jamais listés.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const home: MetadataRoute.Sitemap = [{ url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
  const pages = await listIndexableProgrammes().catch(() => []);
  return [...home, ...pages.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.6 }))];
}
