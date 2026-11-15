import { NextRequest, NextResponse } from 'next/server';
import { addMessage, getGuestByToken, isWitness } from '@/lib/wedding/db';
import { TOKEN_RE } from '@/lib/wedding/format';
import { cleanMessage } from '@/lib/wedding/validate';
import { guestWriteLimit } from '@/lib/wedding/limits';

// Discussion entre invités : le nom et le rôle viennent de la fiche de l'invité, jamais du client (pas d'usurpation).
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await guestWriteLimit(req, token))) return NextResponse.json({ error: 'Trop de messages, réessayez dans quelques minutes.' }, { status: 429 });
  const row = TOKEN_RE.test(token) ? await getGuestByToken(token) : null;
  if (!row) return NextResponse.json({ error: 'Invitation introuvable.' }, { status: 404 });
  const v = cleanMessage(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  if (v.value.channelId === 'temoins' && !isWitness(row.category)) return NextResponse.json({ error: 'Ce salon est réservé aux témoins.' }, { status: 403 });
  const name = `${row.first_name} ${row.last_name}`.trim() || row.greeting_title || 'Invité';
  const role = isWitness(row.category) ? 'Temoin' : 'Invite';
  return NextResponse.json(await addMessage(row.ceremony_id, v.value, { name, role }), { status: 201 });
}
