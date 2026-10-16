import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { activeDriver } from '@/lib/storage';
import { r2Missing, r2Probe } from '@/lib/storage/r2';

// Diagnostic du stockage des photos (admin) : quel fournisseur est actif, et la connexion R2 est-elle bonne ?
export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const missing = r2Missing();
  let status: 'ok' | 'refused' | 'unreachable' | undefined;
  if (missing.length === 0) {
    try { const code = await r2Probe(); status = code === 200 || code === 404 ? 'ok' : 'refused'; } catch { status = 'unreachable'; }
  }
  return NextResponse.json(
    { driver: activeDriver(), blob: { configured: !!process.env.BLOB_READ_WRITE_TOKEN }, r2: { configured: missing.length === 0, missing, status } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
