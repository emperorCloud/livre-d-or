import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateEntry, adminDeleteEntry } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updated = await adminUpdateEntry(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Témoignage non trouvé.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, entry: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await adminDeleteEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Témoignage non trouvé.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: "Témoignage supprimé par l'administrateur." });
}
