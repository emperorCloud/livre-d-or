import { NextRequest, NextResponse } from 'next/server';
import { authorizeInvitations } from '@/lib/invitations/access';
import { createGuest, listGuests } from '@/lib/invitations/db';
import { cleanGuestInput, type GuestInput } from '@/lib/invitations/validate';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const a = await authorizeInvitations(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  return NextResponse.json(await listGuests(a.ceremony.id), { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const a = await authorizeInvitations(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanGuestInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const guest = await createGuest(a.ceremony.id, { category: '', email: '', phone: '', tableNumber: '', maxGuests: 1, ...v.value } as GuestInput);
  return NextResponse.json({ success: true, guest }, { status: 201 });
}
