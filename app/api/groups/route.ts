import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createGroup } from '@/lib/ceremonies';

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  const result = await createGroup(await req.json().catch(() => null));
  if (!result) return NextResponse.json({ error: 'Cérémonie valide et nom du groupe requis.' }, { status: 400 });
  // accessCode n'est renvoyé qu'ici, une seule fois : seul son hash est conservé.
  return NextResponse.json({ success: true, group: result.group, accessCode: result.accessCode }, { status: 201 });
}
