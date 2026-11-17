import { NextRequest, NextResponse } from 'next/server';
import { reorderEntries } from '@/lib/db';
import { canManageGroup } from '@/lib/auth';

// Ordre des messages d'un groupe : l'admin pour tous les groupes, le responsable pour le sien uniquement.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const groupId = typeof body?.groupId === 'string' ? body.groupId : '';
  const ids: unknown = body?.ids;
  if (!groupId || !Array.isArray(ids) || ids.length > 5000 || ids.some((i) => typeof i !== 'string')) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (!(await canManageGroup(groupId))) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  return NextResponse.json({ success: true, order: await reorderEntries(groupId, ids as string[]) });
}
