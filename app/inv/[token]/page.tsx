import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuestState } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import InvitationPage from '@/components/InvitationPage';

export const dynamic = 'force-dynamic';

// Lien personnel : jamais indexé, et le jeton n'est pas transmis aux sites externes (referrer).
// L'aperçu (WhatsApp…) montre la photo et les noms du couple, mais pas le nom de l'invité.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const r = TOKEN_RE.test(token) ? await getGuestState(token).catch(() => null) : null;
  const robots = { index: false, follow: false };
  if (!r) return { title: 'Invitation introuvable', robots };
  const c = r.state.config;
  const title = c.coupleNames || 'Invitation';
  const description = 'Votre invitation personnelle';
  return { title, description, robots, referrer: 'no-referrer', openGraph: { title, description, type: 'website', images: c.heroImageUrl ? [{ url: c.heroImageUrl }] : undefined }, twitter: { card: 'summary_large_image' } };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = TOKEN_RE.test(token) ? await getGuestState(token).catch(() => null) : null;
  if (!r) return notFound();
  return <InvitationPage initial={r.state} token={token} />;
}
