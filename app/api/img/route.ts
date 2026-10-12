import { NextRequest, NextResponse } from 'next/server';
import { isOwnedStorageUrl } from '@/lib/storage';

// Relais de secours pour la génération du PDF si le navigateur ne peut pas lire une photo
// directement (CORS). Limité à NOTRE stockage : ce n'est pas un proxy ouvert.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '';
  if (!isOwnedStorageUrl(u)) return NextResponse.json({ error: 'URL non autorisée.' }, { status: 400 });
  const upstream = await fetch(u);
  const type = upstream.headers.get('content-type') || '';
  if (!upstream.ok || !type.startsWith('image/')) return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
  return new Response(upstream.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' } });
}
