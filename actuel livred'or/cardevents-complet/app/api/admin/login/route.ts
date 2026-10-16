import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPasscode, createSessionCookie } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`admin-login:${clientIp(req)}`, 8, 900))) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
  }
  const { passcode } = await req.json().catch(() => ({ passcode: '' }));

  let valid: boolean;
  try {
    valid = checkAdminPasscode(typeof passcode === 'string' ? passcode : '');
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Configuration serveur incomplète (ADMIN_PASSCODE manquant).' }, { status: 500 });
  }
  if (!valid) return NextResponse.json({ error: 'Mot de passe administrateur incorrect.' }, { status: 401 });

  await createSessionCookie({ role: 'admin' });
  return NextResponse.json({ success: true });
}
