import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Seule la page publique d'accueil est référencée : les livres d'or (liens privés) ne doivent jamais l'être.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl(), lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
}
