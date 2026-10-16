import { NextResponse } from 'next/server';
import { getAllEntries } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }
  const entries = await getAllEntries();
  return NextResponse.json(entries);
}
