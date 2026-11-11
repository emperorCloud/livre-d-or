import { NextRequest, NextResponse } from 'next/server';
import { getGuestByToken, getGuestState, setGuestRepresentative } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import { cleanRepresentativeRequest } from '@/lib/wedding/validate';
import { guestWriteLimit } from '@/lib/wedding/limits';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await guestWriteLimit(req, token))) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  if (!TOKEN_RE.test(token) || !(await getGuestByToken(token))) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  const v = cleanRepresentativeRequest(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await setGuestRepresentative(token, v.value);
  const r = await getGuestState(token);
  return NextResponse.json({ success: true, guest: r!.state.guests[0] });
}
