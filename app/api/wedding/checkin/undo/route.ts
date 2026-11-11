import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { undoCheckIn } from '@/lib/wedding/db';

export async function POST(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { guestId } = await req.json().catch(() => ({}));
  const guest = typeof guestId === 'string' ? await undoCheckIn(a.ceremony.id, guestId) : null;
  return guest ? NextResponse.json({ success: true, guest }) : NextResponse.json({ error: 'Invité introuvable.' }, { status: 404 });
}
