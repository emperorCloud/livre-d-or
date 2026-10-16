import { NextRequest, NextResponse } from 'next/server';
import { getEntryByToken, updateEntryByToken, deleteEntryByToken } from '@/lib/db';
import { cleanEntry } from '@/lib/validate';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const entry = await getEntryByToken(token);
  if (!entry) return NextResponse.json({ error: "Aucun témoignage trouvé avec ce jeton d'accès." }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = cleanEntry(await req.json().catch(() => null));
  if (!data) return NextResponse.json({ error: 'Le prénom, le nom et le message sont requis.' }, { status: 400 });
  const updated = await updateEntryByToken(token, data);
  if (!updated) return NextResponse.json({ error: 'Témoignage introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, entry: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deleted = await deleteEntryByToken(token);
  if (!deleted) return NextResponse.json({ error: 'Témoignage introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'Témoignage supprimé avec succès.' });
}
