import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { resetGroupCode } from '@/lib/ceremonies';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const { id } = await params;
  const accessCode = await resetGroupCode(id);
  if (!accessCode) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, accessCode });
}
