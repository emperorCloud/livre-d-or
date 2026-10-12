import { NextRequest, NextResponse } from 'next/server';
import { getSession, canManageGroup, isAdminAuthenticated } from '@/lib/auth';
import { updateGroup, deleteGroup } from '@/lib/ceremonies';

// Admin : tous les champs. Responsable : uniquement intro, invite, photos, clôture.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await canManageGroup(id))) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const asManager = (await getSession())?.role === 'manager';
  const group = await updateGroup(id, await req.json().catch(() => ({})), asManager);
  if (!group) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, group });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const { id } = await params;
  if (!(await deleteGroup(id))) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
