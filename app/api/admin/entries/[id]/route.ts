import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateEntry, adminDeleteEntry, getEntryById } from '@/lib/db';
import type { GuestEntry } from '@/lib/types';
import { getSession, canManageGroup } from '@/lib/auth';

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : undefined);

// L'admin peut corriger le contenu ; le responsable de groupe ne peut que modérer.
async function authorize(id: string) {
  const entry = await getEntryById(id);
  if (!entry) return { error: NextResponse.json({ error: 'Témoignage non trouvé.' }, { status: 404 }), session: null };
  if (!(await canManageGroup(entry.groupId))) {
    return { error: NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 }), session: null };
  }
  return { error: null, session: await getSession() };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.isPinned === 'boolean') patch.isPinned = body.isPinned;
  if (typeof body.isApproved === 'boolean') patch.isApproved = body.isApproved;
  if (auth.session?.role === 'admin') {
    for (const [k, n] of [['firstName', 80], ['lastName', 80], ['email', 200], ['relationship', 80], ['yearsKnown', 60],
                          ['message', 4000], ['anecdote', 3000], ['wish', 1000]] as const) {
      const v = clip(body[k], n);
      if (v !== undefined && !((k === 'firstName' || k === 'lastName' || k === 'message') && v === '')) patch[k] = v;
    }
  }
  const updated = await adminUpdateEntry(id, patch as Partial<GuestEntry>);
  return NextResponse.json({ success: true, entry: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;
  await adminDeleteEntry(id);
  return NextResponse.json({ success: true, message: 'Témoignage supprimé.' });
}
