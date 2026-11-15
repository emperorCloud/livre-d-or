import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { deleteReservation, patchReservation } from '@/lib/funeral/db';
import { cleanReservationPatch } from '@/lib/funeral/validate';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanReservationPatch(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const { id } = await params;
  const r = await patchReservation(a.ceremony.id, id, v.value);
  return r ? NextResponse.json({ reservation: r }) : NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  return (await deleteReservation(a.ceremony.id, id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
}
