import { NextRequest, NextResponse } from 'next/server';
import { authorizeFuneral } from '@/lib/funeral/access';
import { createDonation } from '@/lib/funeral/db';
import { cleanDonationInput } from '@/lib/funeral/validate';

// Saisie d'un don reçu par le responsable (espèces, chèque…) : enregistré directement comme confirmé.
export async function POST(req: NextRequest) {
  const a = await authorizeFuneral(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const v = cleanDonationInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  return NextResponse.json({ donation: await createDonation(a.ceremony.id, v.value, 'confirmed') }, { status: 201 });
}
