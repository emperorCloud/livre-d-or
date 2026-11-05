import { NextRequest, NextResponse } from 'next/server';
import { getPublicInvitation } from '@/lib/invitations/db';
import { TOKEN_RE } from '@/lib/invitations/format';
import { clientIp, rateLimit } from '@/lib/ratelimit';

// Réponse identique (404) pour un jeton mal formé ou inconnu : on ne révèle rien sur les jetons existants.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`inv-view:${clientIp(req)}`, 120, 600))) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  const invitation = TOKEN_RE.test(token) ? await getPublicInvitation(token) : null;
  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  return NextResponse.json(invitation, { headers: { 'Cache-Control': 'no-store' } });
}
