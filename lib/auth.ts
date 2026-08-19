import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Avant (server.ts d'origine) : le "token" de session admin était une
// CONSTANTE en dur ('admin-authenticated-session-2026') visible dans le code
// source -> n'importe qui pouvait forger l'en-tête Authorization sans même
// connaître le mot de passe. Ici, la session est un vrai JWT signé avec un
// secret connu uniquement du serveur (SESSION_SECRET), stocké dans un cookie
// httpOnly (inaccessible en JS côté client).

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = '12h';

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET n'est pas définie. Ajoutez-la dans les variables d'environnement Vercel (une longue chaîne aléatoire, ex: générée avec `openssl rand -base64 32`)."
    );
  }
  return new TextEncoder().encode(secret);
}

export function checkAdminPasscode(passcode: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    throw new Error(
      "ADMIN_PASSCODE n'est pas définie. Ajoutez-la dans les variables d'environnement Vercel."
    );
  }
  return passcode === expected;
}

export async function createAdminSessionCookie() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h, doit correspondre à SESSION_DURATION
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
