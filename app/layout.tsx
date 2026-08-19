import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Livre d'Or - Jean-Michel Edimo",
  description:
    "Livre d'or et espace d'hommage numérique pour le départ en retraite de M. Jean-Michel Edimo.",
  openGraph: {
    title: "Livre d'Or - Jean-Michel Edimo",
    description:
      "Livre d'or et espace d'hommage numérique pour le départ en retraite de M. Jean-Michel Edimo.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
