import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { addMessage } from '@/lib/wedding/db';
import { cleanMessage } from '@/lib/wedding/validate';

// Message du responsable : le rôle est fixé par le serveur (« Organisateur »), jamais choisi par le client.
export async function POST(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanMessage(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json(await addMessage(a.ceremony.id, v.value, { name: v.value.senderName || 'Organisateur', role: 'Organisateur' }), { status: 201 });
}
