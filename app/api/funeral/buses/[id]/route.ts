import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { deleteBus } from '@/lib/funeral/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  return (await deleteBus(a.ceremony.id, id)) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Bus introuvable.' }, { status: 404 });
}
