import { NextRequest, NextResponse } from 'next/server';
import { addPledge, getGuestByToken } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import { cleanPledge } from '@/lib/wedding/validate';
import { guestWriteLimit } from '@/lib/wedding/limits';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string; giftId: string }> }) {
  const { token, giftId } = await params;
  if (!(await guestWriteLimit(req, token))) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  const row = TOKEN_RE.test(token) ? await getGuestByToken(token) : null;
  if (!row) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  const v = cleanPledge(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const r = await addPledge(row.ceremony_id, giftId, v.value);
  return r.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: r.error }, { status: 409 });
}
