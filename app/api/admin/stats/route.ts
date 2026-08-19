import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  // NOTE : dans le server.ts d'origine, cette route ne vérifiait AUCUNE
  // authentification (n'importe qui pouvait lire les statistiques). Corrigé
  // ici pour exiger une session admin, comme les autres routes /api/admin/*.
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }
  const stats = await getStats();
  return NextResponse.json(stats);
}
