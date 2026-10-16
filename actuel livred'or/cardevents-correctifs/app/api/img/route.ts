import { NextRequest, NextResponse } from 'next/server';
import { isOwnedStorageUrl } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/ratelimit';

// Relais de secours pour la génération du PDF si le navigateur ne peut pas lire une photo
// directement (CORS). Limité à NOTRE stockage : ce n'est pas un proxy ouvert.
export async function GET(req: NextRequest) {
  if (!(await rateLimit(`img:${clientIp(req)}`, 300, 600))) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  const u = req.nextUrl.searchParams.get('u') || '';
  if (!isOwnedStorageUrl(u)) return NextResponse.json({ error: 'URL non autorisée.' }, { status: 400 });
  const upstream = await fetch(u, { redirect: 'error' });
  const type = upstream.headers.get('content-type') || '';
  if (!upstream.ok || !type.startsWith('image/')) return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
  if (Number(upstream.headers.get('content-length') || 0) > 10_000_000) return NextResponse.json({ error: 'Image trop volumineuse.' }, { status: 413 });
  return new Response(upstream.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' } });
}
