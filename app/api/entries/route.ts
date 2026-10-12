import { NextRequest, NextResponse } from 'next/server';
import { getAllEntries, getEntriesByGroup, getEntriesByToken, createEntry, updateEntryByToken, getEntryByToken } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getGroupIdBySlug, getLegacyGroupAccess } from '@/lib/ceremonies';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { cleanEntry } from '@/lib/validate';

const NO_CACHE = { 'Cache-Control': 'no-cache, no-store, must-revalidate' };
// TRANSITION (voir api/upload) : à supprimer avec la nouvelle interface.

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (session?.role === 'admin') {
    const groupId = req.nextUrl.searchParams.get('groupId');
    const entries = groupId ? await getEntriesByGroup(groupId) : await getAllEntries();
    return NextResponse.json(entries, { headers: NO_CACHE });
  }
  // Un responsable ne voit QUE les témoignages de son groupe (modération incluse).
  if (session?.role === 'manager') {
    return NextResponse.json(await getEntriesByGroup(session.groupId), { headers: NO_CACHE });
  }

  const guestToken = req.nextUrl.searchParams.get('guestToken');
  if (guestToken) return NextResponse.json(await getEntriesByToken(guestToken), { headers: NO_CACHE });

  return NextResponse.json([], { headers: NO_CACHE });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const data = cleanEntry(body);
  if (!data) return NextResponse.json({ error: 'Le prénom, le nom et le message sont requis.' }, { status: 400 });

  if (typeof body.token === 'string' && body.token) {
    const existing = await getEntryByToken(body.token);
    if (existing) {
      const updated = await updateEntryByToken(body.token, data);
      return NextResponse.json({ success: true, entry: updated });
    }
  }

  if (!(await rateLimit(`entry:${clientIp(req)}`, 10, 3600))) {
    return NextResponse.json({ error: 'Trop de messages envoyés, réessayez plus tard.' }, { status: 429 });
  }

  let group = typeof body.inviteSlug === 'string' && body.inviteSlug ? await getGroupIdBySlug(body.inviteSlug) : null;
  if (!group && !body.inviteSlug) {
    group = await getLegacyGroupAccess(); // TRANSITION
  }
  if (!group) return NextResponse.json({ error: "Lien d'invitation invalide." }, { status: 400 });
  if (group.isClosed) return NextResponse.json({ error: "Ce livre d'or est clos : il n'accepte plus de messages." }, { status: 403 });
  if (!group.allowPhotos) { data.photos = []; data.photoUrl = ''; }

  const entry = await createEntry(data, group.id);
  return NextResponse.json({ success: true, entry, token: entry.token }, { status: 201 });
}
