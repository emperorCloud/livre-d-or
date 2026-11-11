import { NextRequest, NextResponse } from 'next/server';
import { getGuestState } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import { clientIp, rateLimit } from '@/lib/ratelimit';

// Réponse identique (404) pour un jeton mal formé ou inconnu : on ne révèle rien sur les jetons existants.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`inv-view:${clientIp(req)}`, 240, 600))) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  const r = TOKEN_RE.test(token) ? await getGuestState(token) : null;
  if (!r) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  return NextResponse.json(r.state, { headers: { 'Cache-Control': 'no-store' } });
}
