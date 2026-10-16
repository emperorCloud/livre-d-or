import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    background_color: BRAND.themeColor,
    theme_color: BRAND.themeColor,
    icons: [{ src: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  };
}
