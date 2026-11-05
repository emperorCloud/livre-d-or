///scripts/test-invitations.mts
import assert from 'node:assert/strict';
import { newGuestToken, newTicketCode, ALPHABET as GEN_ALPHABET } from '../lib/invitations/tokens.ts';
import { formatTicketCode, normalizeTicketCode, TOKEN_RE, ALPHABET } from '../lib/invitations/format.ts';

// Les deux fichiers ont chacun une copie de l'alphabet : elles ne doivent jamais diverger
assert.equal(GEN_ALPHABET, ALPHABET);
import { cleanGuestInput, cleanRsvp } from '../lib/invitations/validate.ts';

// Jetons : format, longueur, unicité sur 5 000 tirages
const toks = new Set<string>(), codes = new Set<string>();
for (let i = 0; i < 5000; i++) {
  const t = newGuestToken(), c = newTicketCode();
  assert.match(t, TOKEN_RE); assert.equal(t.length, 24);
  assert.match(c, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
  toks.add(t); codes.add(c);
}
assert.equal(toks.size, 5000); assert.equal(codes.size, 5000);
assert.ok(!TOKEN_RE.test('court')); assert.ok(!TOKEN_RE.test("a".repeat(24) + "'; DROP"));

// Codes de billet : lecture tolérante, rejet des codes invalides
const code = newTicketCode();
assert.equal(normalizeTicketCode(formatTicketCode(code).toLowerCase()), code);
assert.equal(normalizeTicketCode(` ${code.slice(0, 5)} ${code.slice(5)} `), code);
assert.equal(normalizeTicketCode('ABC'), null); assert.equal(normalizeTicketCode('0000000000'), null); assert.equal(normalizeTicketCode(42), null);

// Invité (responsable)
assert.equal(cleanGuestInput({ greeting: '  ' }).ok, false);
const g = cleanGuestInput({ greeting: 'Invité Test', email: 'a@b.cd', phone: '+237 6 99 00 11 22', maxGuests: 2, category: 'Amis' });
assert.ok(g.ok && g.value.maxGuests === 2 && g.value.greeting === 'Invité Test');
assert.equal(cleanGuestInput({ greeting: 'X', email: 'pas-un-mail' }).ok, false);
assert.equal(cleanGuestInput({ greeting: 'X', phone: '<script>' }).ok, false);
assert.equal(cleanGuestInput({ greeting: 'X', maxGuests: 0 }).ok, false);
assert.equal(cleanGuestInput({ greeting: 'X', maxGuests: 11 }).ok, false);
const p = cleanGuestInput({ category: 'Famille' }, true);        // modification partielle : seuls les champs fournis
assert.ok(p.ok && Object.keys(p.value).join() === 'category');
assert.equal(cleanGuestInput({ greeting: '' }, true).ok, false);

// Réponse de l'invité : jamais plus que prévu, « non » = 0 personne
assert.deepEqual(cleanRsvp({ status: 'no', guests: 5 }, 2), { ok: true, value: { status: 'no', guests: 0, diet: '', allergies: '', note: '' } });
assert.equal(cleanRsvp({ status: 'yes', guests: 3 }, 2).ok, false);
assert.equal(cleanRsvp({ status: 'yes', guests: 2.5 }, 3).ok, false);
assert.equal(cleanRsvp({ status: 'pending' }, 2).ok, false);
assert.equal(cleanRsvp({ status: 'admin' }, 2).ok, false);
const r = cleanRsvp({ status: 'yes', diet: 'x'.repeat(500), note: 'n'.repeat(5000) }, 4);
assert.ok(r.ok && r.value.guests === 1 && r.value.diet.length === 80 && r.value.note.length === 600);

console.log('OK — jetons, billets, validation des invités et des réponses : tous les tests passent');
