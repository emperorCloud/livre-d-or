import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProgramme } from '@/lib/funeral/db';
import { programmeJsonLd, programmeMetadata } from '@/lib/funeral/seo';
import ProgrammePublic from '@/components/funeral/ProgrammePublic';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProgramme(slug).catch(() => null);
  if (!p) return { title: 'Programme introuvable', robots: { index: false, follow: false } };
  return programmeMetadata(p);
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const programme = await getPublicProgramme(slug).catch(() => null);
  if (!programme) return notFound();
  // Contenu du JSON-LD maîtrisé côté serveur ; « < » échappé pour qu'aucun texte saisi ne referme la balise <script>.
  const jsonLd = JSON.stringify(programmeJsonLd(programme)).replace(/</g, '\\u003c');
  return (
    <>
      {programme.config.profile.searchIndexing && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <ProgrammePublic initial={programme} />
    </>
  );
}
