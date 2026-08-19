import { NextRequest, NextResponse } from 'next/server';
import { getAllEntries, getEntriesByToken, createEntry, updateEntryByToken, getEntryByToken } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import type { EntryFormData } from '@/lib/types';

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated();

  if (isAdmin) {
    const entries = await getAllEntries();
    return NextResponse.json(entries, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
  }

  const guestToken = req.nextUrl.searchParams.get('guestToken');
  if (guestToken) {
    const entries = await getEntriesByToken(guestToken);
    return NextResponse.json(entries, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
  }

  // Visiteur public sans token : aucun témoignage visible (comme l'original)
  return NextResponse.json([], { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as EntryFormData & { token?: string | null };

  if (!body.firstName || !body.lastName || !body.message) {
    return NextResponse.json({ error: 'Le prénom, le nom et le message sont requis.' }, { status: 400 });
  }

  if (body.token) {
    const existing = await getEntryByToken(body.token);
    if (existing) {
      const updated = await updateEntryByToken(body.token, body);
      return NextResponse.json({ success: true, entry: updated });
    }
  }

  const entry = await createEntry(body);
  return NextResponse.json({ success: true, entry, token: entry.token }, { status: 201 });
}
