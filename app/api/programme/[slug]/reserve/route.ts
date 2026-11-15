import { NextRequest, NextResponse } from 'next/server';
import { createReservation, getProgrammeTarget } from '@/lib/funeral/db';
import { publicWriteLimit } from '@/lib/funeral/limits';
import { cleanReservationInput } from '@/lib/funeral/validate';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await publicWriteLimit(req, slug, 'resa'))) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  const t = await getProgrammeTarget(slug);
  if (!t) return NextResponse.json({ error: 'Programme introuvable.' }, { status: 404 });
  const v = cleanReservationInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const r = await createReservation(t.ceremonyId, v.value);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  // Le visiteur ne reçoit que son numéro d'ordre et le statut.
  return NextResponse.json({ orderNumber: r.reservation.orderNumber, status: r.reservation.status }, { status: 201 });
}
