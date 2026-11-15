import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { saveConfig } from '@/lib/funeral/db';
import { cleanConfig } from '@/lib/funeral/validate';

export async function PUT(req: NextRequest) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanConfig(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json({ config: await saveConfig(a.ceremony.id, v.value) });
}
