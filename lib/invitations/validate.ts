// Validation pure (aucune dépendance) des données saisies par le responsable et par l'invité.

export type RsvpStatus = 'pending' | 'yes' | 'no' | 'maybe';
export interface GuestInput { greeting: string; category: string; email: string; phone: string; tableNumber: string; maxGuests: number }
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\-.\s]{0,30}$/;

/** Création : « greeting » obligatoire. Modification (partial) : seuls les champs fournis sont contrôlés et renvoyés. */
export function cleanGuestInput(b: any, partial = false): Result<Partial<GuestInput>> {
  const out: Partial<GuestInput> = {};
  const has = (k: string) => !partial || (b && Object.prototype.hasOwnProperty.call(b, k));
  if (has('greeting')) {
    const g = clip(b?.greeting, 120);
    if (!g) return { ok: false, error: "Le nom d'invitation est requis (ex : « Prénom Nom », « M. et Mme Nom »)." };
    out.greeting = g;
  }
  if (has('category')) out.category = clip(b?.category, 60);
  if (has('email')) {
    const e = clip(b?.email, 200);
    if (e && !EMAIL.test(e)) return { ok: false, error: 'Adresse e-mail invalide.' };
    out.email = e;
  }
  if (has('phone')) {
    const p = clip(b?.phone, 30);
    if (!PHONE.test(p)) return { ok: false, error: 'Numéro de téléphone invalide.' };
    out.phone = p;
  }
  if (has('tableNumber')) out.tableNumber = clip(b?.tableNumber, 20);
  if (has('maxGuests')) {
    const n = Number(b?.maxGuests ?? 1);
    if (!Number.isInteger(n) || n < 1 || n > 10) return { ok: false, error: 'Le nombre de personnes doit être entre 1 et 10.' };
    out.maxGuests = n;
  }
  return { ok: true, value: out };
}

export interface RsvpInput { status: Exclude<RsvpStatus, 'pending'>; guests: number; diet: string; allergies: string; note: string }

/** Réponse de l'invité. Le nombre de personnes ne peut jamais dépasser ce que le responsable a prévu pour lui. */
export function cleanRsvp(b: any, maxGuests: number): Result<RsvpInput> {
  const status = b?.status;
  if (status !== 'yes' && status !== 'no' && status !== 'maybe') return { ok: false, error: 'Choisissez une réponse.' };
  let guests = 0;
  if (status !== 'no') {
    guests = Number(b?.guests ?? 1);
    if (!Number.isInteger(guests) || guests < 1) return { ok: false, error: 'Indiquez le nombre de personnes présentes.' };
    if (guests > maxGuests) return { ok: false, error: `Votre invitation est prévue pour ${maxGuests} personne${maxGuests > 1 ? 's' : ''} au maximum.` };
  }
  return { ok: true, value: { status, guests, diet: clip(b?.diet, 80), allergies: clip(b?.allergies, 200), note: clip(b?.note, 600) } };
}
