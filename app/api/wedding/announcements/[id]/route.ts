import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { deleteAnnouncement, updateAnnouncement } from '@/lib/wedding/db';
import { cleanAnnouncement } from '@/lib/wedding/validate';

// Modifier ou supprimer une annonce : limité au mariage de la session (un identifiant d'un autre mariage renvoie « introuvable »).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanAnnouncement(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const ann = await updateAnnouncement(a.ceremony.id, id, v.value);
  return ann ? NextResponse.json(ann) : NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  return (await deleteAnnouncement(a.ceremony.id, id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
}
