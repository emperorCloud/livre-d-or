import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPasscode, createAdminSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { passcode } = await req.json().catch(() => ({ passcode: '' }));

  let valid: boolean;
  try {
    valid = checkAdminPasscode(passcode || '');
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Configuration serveur incomplète (ADMIN_PASSCODE manquant)." },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: 'Mot de passe administrateur incorrect.' }, { status: 401 });
  }

  await createAdminSessionCookie();
  return NextResponse.json({ success: true });
}
