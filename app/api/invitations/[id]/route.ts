import { NextRequest, NextResponse } from 'next/server';
import { authorizeInvitations } from '@/lib/invitations/access';
import { deleteGuest, getGuestById, updateGuest } from '@/lib/invitations/db';
import { cleanGuestInput } from '@/lib/invitations/validate';

// Un responsable ne peut toucher QUE les invités de son mariage : on compare la cérémonie de l'invité à celle de la session.
async function load(id: string, req: NextRequest) {
  const guest = await getGuestById(id);
  if (!guest) return { error: NextResponse.json({ error: 'Invité introuvable.' }, { status: 404 }) };
  const a = await authorizeInvitations(guest.ceremonyId);
  if (!a.ok) return { error: NextResponse.json({ error: a.error }, { status: a.status }) };
  if (a.ceremony.id !== guest.ceremonyId) return { error: NextResponse.json({ error: 'Invité introuvable.' }, { status: 404 }) };
  return { guest };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await load(id, req);
  if (l.error) return l.error;
  const v = cleanGuestInput(await req.json().catch(() => null), true);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json({ success: true, guest: await updateGuest(id, v.value) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await load(id, req);
  if (l.error) return l.error;
  await deleteGuest(id);
  return NextResponse.json({ success: true });
}
