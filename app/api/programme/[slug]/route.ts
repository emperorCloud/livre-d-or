import { NextRequest, NextResponse } from 'next/server';
import { getPublicProgramme } from '@/lib/funeral/db';

// Données publiques du programme : jamais de nom de passager, de téléphone de chauffeur, de téléphone ou montant de donateur.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicProgramme(slug);
  if (!p) return NextResponse.json({ error: 'Programme introuvable.' }, { status: 404 });
  return NextResponse.json(p, { headers: { 'Cache-Control': 'no-store' } });
}
