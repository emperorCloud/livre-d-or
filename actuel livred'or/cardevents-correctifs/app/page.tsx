import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/settingsDb';
import { getSession } from '@/lib/auth';
import { siteUrl } from '@/lib/seo';
import { faq } from '@/lib/homeContent';
import type { SessionInfo } from '@/lib/types';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function Home({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  if (invite) redirect(`/i/${encodeURIComponent(invite)}`); // anciens liens ?invite=…

  const [settings, s] = await Promise.all([getSettings(), getSession().catch(() => null)]);
  // Session lue côté serveur : le HTML envoyé aux moteurs de recherche contient déjà la page d'accueil.
  const initialSession: SessionInfo = { role: s?.role ?? 'none', groupId: s?.role === 'manager' ? s.groupId : undefined, isAdmin: s?.role === 'admin' };

  const base = siteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${base}/#organization`, name: settings.brandName, url: base, logo: `${base}/apple-icon` },
      { '@type': 'WebSite', '@id': `${base}/#website`, url: base, name: settings.brandName, description: settings.welcomeText, inLanguage: 'fr', publisher: { '@id': `${base}/#organization` } },
      { '@type': 'FAQPage', mainEntity: faq(settings.brandName).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <AppShell initialSettings={settings} initialSession={initialSession} />
    </>
  );
}
