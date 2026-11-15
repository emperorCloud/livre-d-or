import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { upsertBus } from '@/lib/funeral/db';
import { cleanBus } from '@/lib/funeral/validate';

// Création ou modification d'un bus (l'identifiant est dans le corps).
export async function POST(req: NextRequest) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanBus(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const r = await upsertBus(a.ceremony.id, v.value);
  return 'error' in r ? NextResponse.json({ error: r.error }, { status: 409 }) : NextResponse.json(r);
}
