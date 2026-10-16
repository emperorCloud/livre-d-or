import { NextRequest, NextResponse } from 'next/server';
import { getPublicInvite } from '@/lib/ceremonies';

// Données publiques d'un lien d'invitation : jamais d'e-mail, de code ni d'identifiant interne.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invite = await getPublicInvite(slug);
  if (!invite) return NextResponse.json({ error: "Lien d'invitation introuvable." }, { status: 404 });
  return NextResponse.json(invite, { headers: { 'Cache-Control': 'no-store' } });
}
