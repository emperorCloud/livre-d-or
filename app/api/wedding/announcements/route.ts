import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { addAnnouncement } from '@/lib/wedding/db';
import { cleanAnnouncement } from '@/lib/wedding/validate';

export async function POST(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanAnnouncement(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json(await addAnnouncement(a.ceremony.id, v.value, 'Organisateur'), { status: 201 });
}
