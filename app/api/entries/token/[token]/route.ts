import { NextRequest, NextResponse } from 'next/server';
import { getEntryByToken, updateEntryByToken, deleteEntryByToken } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const entry = await getEntryByToken(token);
  if (!entry) {
    return NextResponse.json({ error: "Aucun témoignage trouvé avec ce jeton d'accès." }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const updated = await updateEntryByToken(token, body);
  if (!updated) {
    return NextResponse.json({ error: 'Témoignage introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, entry: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deleted = await deleteEntryByToken(token);
  if (!deleted) {
    return NextResponse.json({ error: 'Témoignage introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Témoignage supprimé avec succès.' });
}
