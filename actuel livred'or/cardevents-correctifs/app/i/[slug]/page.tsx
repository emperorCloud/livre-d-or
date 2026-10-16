import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicInvite } from '@/lib/ceremonies';
import { getSettings } from '@/lib/settingsDb';
import GuestSignView from '@/components/GuestSignView';

export const dynamic = 'force-dynamic';

// L'aperçu du lien (WhatsApp, Facebook, SMS…) reprend la photo du concerné et le titre de la cérémonie.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getPublicInvite(slug).catch(() => null);
  if (!invite) return { title: "Livre d'or introuvable", robots: { index: false, follow: false } };
  const title = invite.ceremony.title;
  const description = invite.customIntro || `Laissez un message pour ${invite.ceremony.honoreeName}.`;
  return {
    title, description,
    robots: { index: false, follow: false }, // lien privé : jamais dans Google
    openGraph: { title, description, type: 'website', images: invite.featuredPhotoUrl ? [{ url: invite.featuredPhotoUrl }] : undefined },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [invite, settings] = await Promise.all([getPublicInvite(slug).catch(() => null), getSettings()]);
  if (!invite) return notFound();
  return <GuestSignView invite={invite} settings={settings} />;
}
