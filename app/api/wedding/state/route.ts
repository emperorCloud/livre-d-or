import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { getManagerState } from '@/lib/wedding/db';

// État complet du mariage, réservé au responsable de CE mariage (ou à l'admin).
export async function GET(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  return NextResponse.json(await getManagerState(a.ceremony.id), { headers: { 'Cache-Control': 'no-store' } });
}
