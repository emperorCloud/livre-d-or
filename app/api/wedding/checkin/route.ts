import { NextRequest, NextResponse } from 'next/server';
import { authorizeWedding } from '@/lib/wedding/access';
import { checkIn } from '@/lib/wedding/db';
import { normalizeTicketCode } from '@/lib/wedding/format';

// Émargement : par code de billet (QR scanné ou saisi) ou par identifiant d'invité (clic dans la liste).
export async function POST(req: NextRequest) {
  const a = await authorizeWedding(req.nextUrl.searchParams.get('ceremonyId'));
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const b = await req.json().catch(() => ({}));
  const by = typeof b?.checkedInBy === 'string' && b.checkedInBy.trim() ? b.checkedInBy.trim().slice(0, 80) : a.role === 'admin' ? 'Administrateur' : 'Responsable';
  let outcome;
  if (typeof b?.token === 'string' && b.token) {
    const code = normalizeTicketCode(b.token);
    outcome = code ? await checkIn(a.ceremony.id, { ticketCode: code }, by) : { success: false as const, status: 'not_found' as const, message: "Billet / QR Code introuvable. Veuillez vérifier auprès de l'accueil." };
  } else if (typeof b?.guestId === 'string') outcome = await checkIn(a.ceremony.id, { guestId: b.guestId }, by);
  else return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  return NextResponse.json(outcome, { status: outcome.status === 'not_found' ? 404 : 200 });
}
