import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { deleteGuest, updateGuest } from '@/lib/wedding/db';
import { cleanGuest } from '@/lib/wedding/validate';

// Toutes les requêtes sont limitées au mariage de la session : un identifiant d'un autre mariage renvoie « introuvable ».
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanGuest(await req.json().catch(() => null), true);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const guest = await updateGuest(id, a.ceremony.id, v.value);
  return guest ? NextResponse.json(guest) : NextResponse.json({ error: 'Invité introuvable.' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  return (await deleteGuest(id, a.ceremony.id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Invité introuvable.' }, { status: 404 });
}
