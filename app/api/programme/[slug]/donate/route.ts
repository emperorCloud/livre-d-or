import { NextRequest, NextResponse } from 'next/server';
import { createDonation, getConfig, getProgrammeTarget } from '@/lib/funeral/db';
import { publicWriteLimit } from '@/lib/funeral/limits';
import { cleanDonationInput } from '@/lib/funeral/validate';

// Un don déclaré par un visiteur est « en attente » : il ne compte dans le total public qu'une fois vérifié par le responsable.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await publicWriteLimit(req, slug, 'don'))) return NextResponse.json({ error: 'Trop de tentatives, réessayez dans quelques minutes.' }, { status: 429 });
  const t = await getProgrammeTarget(slug);
  if (!t) return NextResponse.json({ error: 'Programme introuvable.' }, { status: 404 });
  if (!(await getConfig(t.ceremonyId)).profile.donationsOpen) return NextResponse.json({ error: 'Les dons sont clos.' }, { status: 409 });
  const v = cleanDonationInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const d = await createDonation(t.ceremonyId, v.value, 'pending');
  return NextResponse.json({ receiptNumber: d.receiptNumber, status: d.status }, { status: 201 });
}
