import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Trois rôles : invité (pas de session, jeton propre à son témoignage),
// responsable de groupe (JWT { role:'manager', groupId }) et administrateur.
// Variables d'environnement inchangées : SESSION_SECRET et ADMIN_PASSCODE.

const COOKIE_NAME = 'session';
const LEGACY_COOKIE = 'admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

export type Session = { role: 'admin' } | { role: 'manager'; groupId: string };

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET n'est pas définie (variables d'environnement Vercel).");
  return new TextEncoder().encode(secret);
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminPasscode(passcode: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) throw new Error("ADMIN_PASSCODE n'est pas définie (variables d'environnement Vercel).");
  return safeEqual(passcode, expected);
}

// ---- Codes d'accès des responsables : "LOGINID-SECRET" ----
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symboles, sans 0/O/1/I
function randomChars(n: number): string {
  const bytes = randomBytes(n);
  let out = '';
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % 32];
  return out;
}

export function generateAccessCode(): { loginId: string; secret: string; code: string; hash: string } {
  const loginId = randomChars(6);
  const secret = randomChars(10);
  return { loginId, secret, code: `${loginId}-${secret}`, hash: hashSecret(secret) };
}

export function parseAccessCode(raw: string): { loginId: string; secret: string } | null {
  const m = raw.trim().toUpperCase().match(/^([A-Z0-9]{6})-([A-Z0-9]{10})$/);
  return m ? { loginId: m[1], secret: m[2] } : null;
}

function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(secret, salt, 32);
  return `s1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifySecret(secret: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [v, saltHex, hashHex] = stored.split('$');
  if (v !== 's1' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(secret, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// ---- Session ----
export async function createSessionCookie(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getSecret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(LEGACY_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role === 'admin') return { role: 'admin' };
    if (payload.role === 'manager' && typeof payload.groupId === 'string') {
      return { role: 'manager', groupId: payload.groupId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getSession())?.role === 'admin';
}

/** Admin, ou responsable du groupe demandé. */
export async function canManageGroup(groupId: string | null | undefined): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  return s.role === 'admin' || (!!groupId && s.groupId === groupId);
}

// Compat. anciens noms
export const createAdminSessionCookie = () => createSessionCookie({ role: 'admin' });
export const clearAdminSessionCookie = clearSessionCookie;
