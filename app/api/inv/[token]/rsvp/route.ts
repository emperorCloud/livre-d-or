import { NextRequest, NextResponse } from 'next/server';
import { getGuestByToken, saveRsvp } from '@/lib/invitations/db';
import { TOKEN_RE } from '@/lib/invitations/format';
import { cleanRsvp } from '@/lib/invitations/validate';
import { clientIp, rateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`inv-rsvp:${clientIp(req)}`, 40, 600)) || !(await rateLimit(`inv-rsvp-t:${token.slice(0, 12)}`, 30, 3600))) {
    return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  }
  const guest = TOKEN_RE.test(token) ? await getGuestByToken(token) : null;
  if (!guest) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  const v = cleanRsvp(await req.json().catch(() => null), guest.maxGuests);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const invitation = await saveRsvp(token, v.value);
  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, invitation }, { headers: { 'Cache-Control': 'no-store' } });
}
