import { NextRequest, NextResponse } from 'next/server';
import { parseAccessCode, verifySecret, createSessionCookie } from '@/lib/auth';
import { getGroupRowByLoginId } from '@/lib/ceremonies';
import { rateLimit, clientIp } from '@/lib/ratelimit';

const INVALID = { error: "Code d'accès responsable invalide." };

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`mgr-login-ip:${clientIp(req)}`, 10, 900))) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
  }
  const { code } = await req.json().catch(() => ({ code: '' }));
  const parsed = typeof code === 'string' ? parseAccessCode(code) : null;
  if (!parsed) return NextResponse.json(INVALID, { status: 401 });

  // Limite aussi par identifiant : bloque une attaque distribuée sur un même groupe.
  if (!(await rateLimit(`mgr-login-id:${parsed.loginId}`, 10, 900))) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
  }
  const row = await getGroupRowByLoginId(parsed.loginId);
  if (!row || !verifySecret(parsed.secret, row.manager_secret_hash)) {
    return NextResponse.json(INVALID, { status: 401 });
  }
  await createSessionCookie({ role: 'manager', groupId: row.id });
  return NextResponse.json({ success: true, groupId: row.id, managerName: row.manager_name });
}
