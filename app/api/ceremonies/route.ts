import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { listCeremonies, createCeremony } from '@/lib/ceremonies';

const DENIED = () => NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });

export async function GET() {
  if (!(await isAdminAuthenticated())) return DENIED();
  return NextResponse.json(await listCeremonies(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return DENIED();
  const ceremony = await createCeremony(await req.json().catch(() => null));
  if (!ceremony) return NextResponse.json({ error: 'Type, titre et nom du/des concerné(s) requis.' }, { status: 400 });
  return NextResponse.json({ success: true, ceremony }, { status: 201 });
}
