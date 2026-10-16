import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Cinzel, Lora, Plus_Jakarta_Sans } from 'next/font/google';
import { getSettings } from '@/lib/settingsDb';
import { BRAND } from '@/lib/brand';
import { siteUrl, trimDescription } from '@/lib/seo';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cinzel', display: 'swap' });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-lora', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const dynamic = 'force-dynamic';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: BRAND.themeColor };

// Titre et description viennent des paramètres du site (gérés par l'administrateur), jamais du code.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.brandName} — ${s.brandTagline}`;
  const description = trimDescription(s.welcomeText);
  return {
    metadataBase: new URL(siteUrl()),
    applicationName: s.brandName,
    title: { default: title, template: `%s — ${s.brandName}` },
    description,
    keywords: [...BRAND.keywords],
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: { type: 'website', siteName: s.brandName, locale: 'fr_FR', title, description },
    twitter: { card: 'summary_large_image', title, description },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${cinzel.variable} ${lora.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-stone-100/60 text-stone-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}
