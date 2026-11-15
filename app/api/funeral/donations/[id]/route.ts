import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { deleteDonation, patchDonation } from '@/lib/funeral/db';
import { cleanDonationPatch } from '@/lib/funeral/validate';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanDonationPatch(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const { id } = await params;
  const r = await patchDonation(a.ceremony.id, id, v.value.status);
  return r ? NextResponse.json({ donation: r }) : NextResponse.json({ error: 'Don introuvable.' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  return (await deleteDonation(a.ceremony.id, id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Don introuvable.' }, { status: 404 });
}
