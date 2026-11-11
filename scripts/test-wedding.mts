import assert from 'node:assert/strict';
import { newGuestToken, newTicketCode, ALPHABET as GEN } from '../lib/wedding/tokens.ts';
import { formatTicketCode, normalizeTicketCode, TOKEN_RE, ALPHABET } from '../lib/wedding/format.ts';
import { cleanGuest, cleanGuestRsvp, cleanConfig, cleanUrl, cleanRepresentativeRequest, cleanAnnouncement, cleanMessage, cleanPledge } from '../lib/wedding/validate.ts';
import { defaultWeddingConfig } from '../lib/wedding/defaults.ts';

assert.equal(GEN, ALPHABET); // les deux copies de l'alphabet ne doivent jamais diverger

// Jetons et billets
const T = new Set<string>(), C = new Set<string>();
for (let i = 0; i < 5000; i++) { const t = newGuestToken(), c = newTicketCode(); assert.match(t, TOKEN_RE); assert.equal(t.length, 24); assert.match(c, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/); T.add(t); C.add(c); }
assert.equal(T.size, 5000); assert.equal(C.size, 5000);
const code = newTicketCode();
assert.equal(normalizeTicketCode(formatTicketCode(code).toLowerCase()), code);
assert.equal(normalizeTicketCode('0000000000'), null); assert.equal(normalizeTicketCode(42), null);

// Liens : seuls http(s) passent
assert.equal(cleanUrl('javascript:alert(1)'), ''); assert.equal(cleanUrl('data:text/html,x'), ''); assert.equal(cleanUrl('https://maps.example.com/x'), 'https://maps.example.com/x'); assert.equal(cleanUrl('pas un lien'), '');

// Invité (responsable)
assert.equal(cleanGuest({}).ok, false);
const g = cleanGuest({ firstName: 'A', phone: '+237 6 99', email: 'a@b.cd', category: 'Amis', childrenCount: 99, dietaryPreference: 'inconnu', attendingEvents: { e1: true, '<x>': true, e2: 'oui' }, isAdmin: true, token: 'x' });
assert.ok(g.ok); if (g.ok) { assert.equal(g.value.childrenCount, 0); assert.equal(g.value.dietaryPreference, 'classic'); assert.deepEqual(g.value.attendingEvents, { e1: true }); assert.ok(!('isAdmin' in g.value) && !('token' in g.value)); }
assert.equal(cleanGuest({ firstName: 'A', email: 'nope' }).ok, false);
const part = cleanGuest({ tableNumber: '7' }, true); assert.ok(part.ok && Object.keys(part.value).join() === 'tableNumber');

// Réponse de l'invité : accompagnant seulement si autorisé, « non » remet tout à zéro, aucune élévation de droits
const r1 = cleanGuestRsvp({ rsvpStatus: 'confirmed', plusOneConfirmed: true, plusOneName: 'X', childrenCount: 2, attendingEvents: { e1: true }, checkedIn: true, tableNumber: '1' }, false);
assert.ok(r1.ok && r1.value.plusOneConfirmed === false && r1.value.plusOneName === '' && !('tableNumber' in r1.value));
const r2 = cleanGuestRsvp({ rsvpStatus: 'declined', childrenCount: 4, plusOneConfirmed: true }, true);
assert.ok(r2.ok && r2.value.childrenCount === 0 && r2.value.plusOneConfirmed === false);
assert.equal(cleanGuestRsvp({ rsvpStatus: 'pending' }, true).ok, false); assert.equal(cleanGuestRsvp({ rsvpStatus: 'checked_in' }, true).ok, false);
assert.equal(cleanRepresentativeRequest({ name: '' }).ok, false);

// Annonces, messages, réservations
assert.equal(cleanAnnouncement({ title: 'a' }).ok, false);
const an = cleanAnnouncement({ title: 'T', message: 'M', priority: 'xx', target: 'confirmed_only' }); assert.ok(an.ok && an.value.priority === 'info' && an.value.target === 'confirmed_only');
const m = cleanMessage({ content: 'salut', channelId: 'pirate', senderRole: 'Organisateur' }); assert.ok(m.ok && m.value.channelId === 'general' && !('senderRole' in m.value));
assert.equal(cleanMessage({ content: '  ' }).ok, false);
const pl = cleanPledge({ guestName: 'N', quantity: 500 }); assert.ok(pl.ok && pl.value.quantity === 1);

// Configuration : liste blanche, bornes, images limitées à notre stockage, aucune donnée serveur injectable
const base = defaultWeddingConfig({ honoreeName: 'Les mariés', date: '2027-03-12', location: 'Ville' }, '');
assert.ok(base.eventDate.startsWith('2027-03-12'));
const own = (u: string) => u.startsWith('https://abc.public.blob.vercel-storage.com/');
const cfg = cleanConfig({
  coupleNames: 'X'.repeat(500), heroImageUrl: 'https://evil.example/pixel.png', brideImageUrl: 'https://abc.public.blob.vercel-storage.com/a.jpg', mapsUrl: 'javascript:x',
  eventTime: '25:99', guestAccentColor: 'rouge', musicTrack: 'hack', __proto__: { polluted: 1 }, isAdmin: true,
  giftOptions: [{ id: 'g', type: 'paypal', numberOrLink: 'javascript:alert(1)' }, { type: 'zzz', numberOrLink: '+237 6 00 00 00 00' }, { numberOrLink: 'https://pay.example/x' }],
  physicalGifts: [{ id: 'p', title: 'T', desiredQuantity: 5, reservedQuantity: 999, pledges: [{ guestName: 'fake' }] }],
  timelineEvents: Array.from({ length: 50 }, (_, i) => ({ id: `e${i}`, title: 'E', time: '10:30', mapsUrl: 'ftp://x' })),
}, base, { isOwnedUrl: own });
assert.equal(cfg.coupleNames.length, 120); assert.equal(cfg.heroImageUrl, ''); assert.equal(cfg.brideImageUrl, 'https://abc.public.blob.vercel-storage.com/a.jpg');
assert.equal(cfg.mapsUrl, ''); assert.equal(cfg.eventTime, '15:00'); assert.equal(cfg.guestAccentColor, undefined); assert.equal(cfg.musicTrack, 'ambient_harp');
assert.equal(cfg.giftOptions![0]?.numberOrLink, ''); assert.equal(cfg.giftOptions![1].numberOrLink, '+237 6 00 00 00 00'); assert.equal(cfg.giftOptions![1].type, 'registry'); assert.equal(cfg.giftOptions![2].numberOrLink, 'https://pay.example/x');
assert.equal(cfg.physicalGifts![0].reservedQuantity, 0); assert.ok(!('pledges' in cfg.physicalGifts![0]));
assert.equal(cfg.timelineEvents.length, 20); assert.equal(cfg.timelineEvents[0].mapsUrl, ''); assert.ok(!('isAdmin' in cfg) && !(cfg as any).polluted);
assert.equal(cleanConfig({}, base, { isOwnedUrl: own }).coupleNames, base.coupleNames); // modification vide = rien ne change

console.log('OK — gestionnaire d’invitations : jetons, validation des invités, réponses, annonces, réservations et configuration');
