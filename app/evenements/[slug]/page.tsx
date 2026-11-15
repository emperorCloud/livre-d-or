import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSettings } from '@/lib/settingsDb';
import { siteUrl, trimDescription } from '@/lib/seo';
import { SERVICE_PAGES, serviceBySlug } from '@/lib/homeContent';
import ServicePageView from '@/components/site/ServicePageView';

export const dynamic = 'force-dynamic';
export const dynamicParams = false;
export const generateStaticParams = () => SERVICE_PAGES.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = serviceBySlug(slug);
  if (!page) return {};
  const url = `${siteUrl()}/evenements/${page.slug}`;
  const brand = (await getSettings()).brandName;
  const title = `${page.metaTitle} | ${brand}`;
  return {
    title: { absolute: title }, description: trimDescription(page.metaDescription), alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description: trimDescription(page.metaDescription), locale: 'fr_FR' },
    twitter: { card: 'summary_large_image', title, description: trimDescription(page.metaDescription) },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = serviceBySlug(slug);
  if (!page) return notFound();
  const settings = await getSettings();
  const base = siteUrl(), url = `${base}/evenements/${page.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: base },
        { '@type': 'ListItem', position: 2, name: 'Événements', item: `${base}/#evenements` },
        { '@type': 'ListItem', position: 3, name: page.name, item: url } ] },
      { '@type': 'Service', '@id': `${url}#service`, name: page.metaTitle, serviceType: `Organisation : ${page.name}`, description: page.metaDescription, url,
        provider: { '@id': `${base}/#organization` }, ...(settings.serviceArea ? { areaServed: settings.serviceArea } : {}), inLanguage: 'fr' },
      { '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ServicePageView page={page} settings={settings} />
    </>
  );
}
