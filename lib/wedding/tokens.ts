import { randomBytes } from 'node:crypto';

// Jeton du lien personnel : 18 octets aléatoires = 144 bits (24 caractères). Impossible à deviner ou à énumérer.
export function newGuestToken(): string {
  return randomBytes(18).toString('base64url');
}

// Code du billet (contenu du QR) : distinct du jeton du lien, pour qu'une capture d'écran du billet ne révèle jamais le
// lien personnel. 10 caractères sur 32 symboles = 50 bits. (Copie volontaire de l'alphabet de format.ts, qui reste sans
// dépendance Node : un test vérifie que les deux sont identiques.)
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newTicketCode(): string {
  const b = randomBytes(10);
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[b[i] % 32]; // 256 est multiple de 32 : aucun biais
  return s;
}
