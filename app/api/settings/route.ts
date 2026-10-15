import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settingsDb';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  return NextResponse.json(await getSettings(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  return NextResponse.json(await saveSettings(await req.json().catch(() => ({}))));
}
