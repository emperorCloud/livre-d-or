import { NextRequest, NextResponse } from 'next/server';
import { applyGuestRsvp, getGuestByToken, getGuestState } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import { cleanGuestRsvp } from '@/lib/wedding/validate';
import { guestWriteLimit } from '@/lib/wedding/limits';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await guestWriteLimit(req, token))) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  const row = TOKEN_RE.test(token) ? await getGuestByToken(token) : null;
  if (!row) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  const v = cleanGuestRsvp(await req.json().catch(() => null), row.plus_one_allowed);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await applyGuestRsvp(token, v.value);
  const r = await getGuestState(token);
  return r ? NextResponse.json({ success: true, guest: r.state.guests[0] }, { headers: { 'Cache-Control': 'no-store' } }) : NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
}
