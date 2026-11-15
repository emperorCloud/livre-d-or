import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { getFuneralState } from '@/lib/funeral/db';

export async function GET(req: NextRequest) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  return NextResponse.json(await getFuneralState(a.ceremony.id), { headers: { 'Cache-Control': 'no-store' } });
}
