import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Cinzel, Lora, Plus_Jakarta_Sans } from 'next/font/google';
import { getSettings } from '@/lib/settingsDb';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cinzel', display: 'swap' });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-lora', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const dynamic = 'force-dynamic';

// Titre et description viennent des paramètres du site (gérés par l'administrateur), jamais du code.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.brandName, template: `%s — ${s.brandName}` },
    description: s.brandTagline,
    openGraph: { title: s.brandName, description: s.brandTagline, type: 'website' },
    twitter: { card: 'summary_large_image' },
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
