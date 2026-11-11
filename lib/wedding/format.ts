// Fonctions pures (aucune dépendance Node) : utilisables côté navigateur comme côté serveur.
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symboles sans ambiguïté (pas de 0/O/1/I)
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,40}$/;

export const formatTicketCode = (c: string) => `${c.slice(0, 5)}-${c.slice(5)}`;

/** Lit un code saisi ou scanné (« abcde-fghjk », espaces, minuscules…). Retourne null s'il est invalide. */
export function normalizeTicketCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 10 && [...c].every((ch) => ALPHABET.includes(ch)) ? c : null;
}
