import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { updateCeremony, deleteCeremony } from '@/lib/ceremonies';

const DENIED = () => NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return DENIED();
  const { id } = await params;
  const ceremony = await updateCeremony(id, await req.json().catch(() => ({})));
  if (!ceremony) return NextResponse.json({ error: 'Cérémonie introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, ceremony });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return DENIED();
  const { id } = await params;
  if (!(await deleteCeremony(id))) return NextResponse.json({ error: 'Cérémonie introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
