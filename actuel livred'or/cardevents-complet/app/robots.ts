import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Les pages d'invitation (/i/…) ne sont PAS bloquées ici : elles portent un « noindex » (visible des robots)
// et les robots d'aperçu de liens (WhatsApp, Facebook) doivent pouvoir les lire pour afficher la photo.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
