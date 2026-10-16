import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGroup, getCeremonyById } from '@/lib/ceremonies';

// Le responsable connecté récupère SON groupe et SA cérémonie (jamais ceux des autres).
export async function GET() {
  const s = await getSession();
  if (s?.role !== 'manager') return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const group = await getGroup(s.groupId);
  const ceremony = group ? await getCeremonyById(group.ceremonyId) : null;
  if (!group || !ceremony) return NextResponse.json({ error: 'Groupe introuvable.' }, { status: 404 });
  return NextResponse.json({ group, ceremony }, { headers: { 'Cache-Control': 'no-store' } });
}
