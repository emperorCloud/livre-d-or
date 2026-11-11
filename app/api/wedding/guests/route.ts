import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { createGuest } from '@/lib/wedding/db';
import { cleanGuest } from '@/lib/wedding/validate';

export async function POST(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanGuest(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json(await createGuest(a.ceremony.id, v.value), { status: 201 });
}
