import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import { getCeremonyById } from '../ceremonies';
import { isOwnedStorageUrl } from '../storage';
import type { Announcement, ChatMessage, Guest, PhysicalGiftItem, WeddingConfig, WeddingStoreState } from './types';
import { defaultWeddingConfig } from './defaults';
import { newGuestToken, newTicketCode } from './tokens';
import { cleanConfig, type GuestFields, type Representative } from './validate';

const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : undefined);

// ---------- Invités ----------
function rowToGuest(r: any, forManager: boolean): Guest {
  const g: Guest = {
    id: r.id, qrCodeToken: r.ticket_code, greetingTitle: r.greeting_title, firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone, tableNumber: r.table_number, category: r.category, rsvpStatus: r.rsvp_status,
    plusOneAllowed: r.plus_one_allowed, plusOneConfirmed: r.plus_one_confirmed, plusOneName: r.plus_one_name, childrenCount: r.children_count,
    dietaryPreference: r.dietary_preference, allergies: r.allergies, personalNote: r.personal_note, partnerNote: r.partner_note,
    attendingEvents: r.attending_events || {}, representativeRequest: r.representative || undefined,
    isCheckedIn: !!r.checked_in_at, checkedInAt: iso(r.checked_in_at), checkedInBy: r.checked_in_by || undefined,
    lastUpdated: iso(r.updated_at)!,
  };
  if (forManager) { g.inviteToken = r.invite_token; g.notes = r.notes; } // jeton du lien et notes privées : jamais côté invité
  return g;
}

export async function listGuests(ceremonyId: string): Promise<Guest[]> {
  const { rows } = await sql`SELECT * FROM wedding_guests WHERE ceremony_id = ${ceremonyId} ORDER BY created_at DESC`;
  return rows.map((r) => rowToGuest(r, true));
}
export async function getGuestRow(id: string, ceremonyId: string) {
  const { rows } = await sql`SELECT * FROM wedding_guests WHERE id = ${id} AND ceremony_id = ${ceremonyId}`;
  return rows[0] || null;
}
export async function getGuestByToken(token: string) {
  const { rows } = await sql`SELECT * FROM wedding_guests WHERE invite_token = ${token}`;
  return rows[0] || null;
}

export async function createGuest(ceremonyId: string, f: Partial<GuestFields>): Promise<Guest> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { rows } = await sql`
        INSERT INTO wedding_guests (id, ceremony_id, invite_token, ticket_code, greeting_title, first_name, last_name, email, phone, table_number, category,
          plus_one_allowed, children_count, dietary_preference, allergies, notes)
        VALUES (${'guest-' + randomUUID()}, ${ceremonyId}, ${newGuestToken()}, ${newTicketCode()}, ${f.greetingTitle ?? ''}, ${f.firstName ?? ''}, ${f.lastName ?? ''},
          ${f.email ?? ''}, ${f.phone ?? ''}, ${f.tableNumber ?? ''}, ${f.category ?? ''}, ${f.plusOneAllowed ?? false}, ${f.childrenCount ?? 0},
          ${f.dietaryPreference ?? 'classic'}, ${f.allergies ?? ''}, ${f.notes ?? ''})
        RETURNING *`;
      return rowToGuest(rows[0], true);
    } catch (e: any) { if (e?.code !== '23505') throw e; } // collision de jeton (quasi impossible) : on retente
  }
  throw new Error('Création impossible, veuillez réessayer.');
}

/** Modification par le responsable : on fusionne les champs fournis sur la fiche actuelle. */
export async function updateGuest(id: string, ceremonyId: string, p: Partial<GuestFields>): Promise<Guest | null> {
  const cur = await getGuestRow(id, ceremonyId);
  if (!cur) return null;
  const rep = 'representative' in p ? p.representative : cur.representative;
  const { rows } = await sql`
    UPDATE wedding_guests SET
      greeting_title = ${p.greetingTitle ?? cur.greeting_title}, first_name = ${p.firstName ?? cur.first_name}, last_name = ${p.lastName ?? cur.last_name},
      email = ${p.email ?? cur.email}, phone = ${p.phone ?? cur.phone}, table_number = ${p.tableNumber ?? cur.table_number}, category = ${p.category ?? cur.category},
      rsvp_status = ${p.rsvpStatus ?? cur.rsvp_status}, plus_one_allowed = ${p.plusOneAllowed ?? cur.plus_one_allowed},
      plus_one_confirmed = ${p.plusOneConfirmed ?? cur.plus_one_confirmed}, plus_one_name = ${p.plusOneName ?? cur.plus_one_name},
      children_count = ${p.childrenCount ?? cur.children_count}, dietary_preference = ${p.dietaryPreference ?? cur.dietary_preference},
      allergies = ${p.allergies ?? cur.allergies}, personal_note = ${p.personalNote ?? cur.personal_note}, partner_note = ${p.partnerNote ?? cur.partner_note},
      notes = ${p.notes ?? cur.notes}, attending_events = ${JSON.stringify(p.attendingEvents ?? cur.attending_events ?? {})}::jsonb,
      representative = ${rep ? JSON.stringify(rep) : null}::jsonb, updated_at = now()
    WHERE id = ${id} AND ceremony_id = ${ceremonyId} RETURNING *`;
  return rows[0] ? rowToGuest(rows[0], true) : null;
}

export async function deleteGuest(id: string, ceremonyId: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM wedding_guests WHERE id = ${id} AND ceremony_id = ${ceremonyId}`;
  return (rowCount ?? 0) > 0;
}

/** Réponse de l'invité : seules les colonnes de réponse sont modifiées (jamais table, catégorie, droits, émargement). */
export async function applyGuestRsvp(token: string, f: Partial<GuestFields>): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE wedding_guests SET rsvp_status = ${f.rsvpStatus!}, plus_one_confirmed = ${f.plusOneConfirmed ?? false}, plus_one_name = ${f.plusOneName ?? ''},
      children_count = ${f.childrenCount ?? 0}, dietary_preference = ${f.dietaryPreference ?? 'classic'}, allergies = ${f.allergies ?? ''},
      personal_note = ${f.personalNote ?? ''}, partner_note = ${f.partnerNote ?? ''}, attending_events = ${JSON.stringify(f.attendingEvents ?? {})}::jsonb,
      updated_at = now()
    WHERE invite_token = ${token}`;
  return (rowCount ?? 0) > 0;
}
export async function setGuestRepresentative(token: string, rep: Representative): Promise<boolean> {
  const { rowCount } = await sql`UPDATE wedding_guests SET representative = ${JSON.stringify(rep)}::jsonb, updated_at = now() WHERE invite_token = ${token}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Émargement (atomique : deux scanners ne peuvent pas valider le même billet deux fois) ----------
export type CheckInOutcome =
  | { success: true; status: 'checked_in'; message: string; guest: Guest }
  | { success: false; status: 'already_checked_in'; message: string; guest: Guest }
  | { success: false; status: 'not_found'; message: string };

export async function checkIn(ceremonyId: string, by: { ticketCode?: string; guestId?: string }, checkedInBy: string): Promise<CheckInOutcome> {
  const { rows: found } = by.ticketCode
    ? await sql`SELECT id FROM wedding_guests WHERE ceremony_id = ${ceremonyId} AND ticket_code = ${by.ticketCode}`
    : await sql`SELECT id FROM wedding_guests WHERE ceremony_id = ${ceremonyId} AND id = ${by.guestId ?? ''}`;
  if (!found[0]) return { success: false, status: 'not_found', message: "Billet / QR Code introuvable. Veuillez vérifier auprès de l'accueil." };
  const { rows } = await sql`
    UPDATE wedding_guests SET checked_in_at = now(), checked_in_by = ${checkedInBy}, updated_at = now()
    WHERE id = ${found[0].id} AND checked_in_at IS NULL RETURNING *`;
  if (rows[0]) {
    const g = rowToGuest(rows[0], true);
    return { success: true, status: 'checked_in', message: `Émargement validé ! Bienvenue ${g.firstName} ${g.lastName}.`.replace(/\s+!/, ' !'), guest: g };
  }
  const g = rowToGuest((await getGuestRow(found[0].id, ceremonyId))!, true);
  const at = g.checkedInAt ? new Date(g.checkedInAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  return { success: false, status: 'already_checked_in', message: `Cet invité a déjà été émargé${at ? ` à ${at}` : ''}.`, guest: g };
}
export async function undoCheckIn(ceremonyId: string, guestId: string): Promise<Guest | null> {
  const { rows } = await sql`UPDATE wedding_guests SET checked_in_at = NULL, checked_in_by = '', updated_at = now() WHERE id = ${guestId} AND ceremony_id = ${ceremonyId} RETURNING *`;
  return rows[0] ? rowToGuest(rows[0], true) : null;
}

// ---------- Annonces et discussions ----------
const rowToAnnouncement = (r: any): Announcement => ({ id: r.id, title: r.title, message: r.message, priority: r.priority, createdAt: iso(r.created_at)!, author: r.author, target: r.target });
const rowToMessage = (r: any): ChatMessage => ({ id: r.id, channelId: r.channel_id, senderName: r.sender_name, senderRole: r.sender_role, content: r.content, createdAt: iso(r.created_at)! });

export async function listAnnouncements(ceremonyId: string): Promise<Announcement[]> {
  const { rows } = await sql`SELECT * FROM wedding_announcements WHERE ceremony_id = ${ceremonyId} ORDER BY created_at DESC LIMIT 200`;
  return rows.map(rowToAnnouncement);
}
export async function addAnnouncement(ceremonyId: string, v: { title: string; message: string; priority: string; target: string }, author: string): Promise<Announcement> {
  const { rows } = await sql`INSERT INTO wedding_announcements (id, ceremony_id, title, message, priority, target, author) VALUES (${'ann-' + randomUUID()}, ${ceremonyId}, ${v.title}, ${v.message}, ${v.priority}, ${v.target}, ${author}) RETURNING *`;
  return rowToAnnouncement(rows[0]);
}
export async function listMessages(ceremonyId: string): Promise<ChatMessage[]> {
  const { rows } = await sql`SELECT * FROM (SELECT * FROM wedding_messages WHERE ceremony_id = ${ceremonyId} ORDER BY created_at DESC LIMIT 400) m ORDER BY created_at ASC`;
  return rows.map(rowToMessage);
}
export async function addMessage(ceremonyId: string, v: { channelId: string; content: string }, sender: { name: string; role: ChatMessage['senderRole'] }): Promise<ChatMessage> {
  const { rows } = await sql`INSERT INTO wedding_messages (id, ceremony_id, channel_id, sender_name, sender_role, content) VALUES (${'msg-' + randomUUID()}, ${ceremonyId}, ${v.channelId}, ${sender.name}, ${sender.role}, ${v.content}) RETURNING *`;
  return rowToMessage(rows[0]);
}

// ---------- Configuration (contenu de l'invitation) ----------
async function pledgesByGift(ceremonyId: string) {
  const { rows } = await sql`SELECT * FROM wedding_gift_pledges WHERE ceremony_id = ${ceremonyId} ORDER BY created_at ASC`;
  const m = new Map<string, any[]>();
  for (const r of rows) (m.get(r.gift_id) ?? m.set(r.gift_id, []).get(r.gift_id)!).push(r);
  return m;
}

/** Configuration effective : valeurs de départ (cérémonie + photo à la une) puis contenu enregistré, puis réservations calculées. */
export async function getWeddingConfig(ceremonyId: string, opts: { pledgeDetails: boolean }): Promise<WeddingConfig> {
  const ceremony = await getCeremonyById(ceremonyId);
  if (!ceremony) throw new Error('Cérémonie introuvable.');
  const [{ rows: cfg }, { rows: grp }, pledges] = await Promise.all([
    sql`SELECT data FROM wedding_config WHERE ceremony_id = ${ceremonyId}`,
    sql`SELECT featured_photo_url FROM groups WHERE ceremony_id = ${ceremonyId} ORDER BY created_at ASC LIMIT 1`,
    pledgesByGift(ceremonyId),
  ]);
  const base = defaultWeddingConfig(ceremony, grp[0]?.featured_photo_url || ceremony.theme.coverImage || '');
  const config: WeddingConfig = { ...base, ...(cfg[0]?.data || {}) };
  config.physicalGifts = (config.physicalGifts || []).map((g: PhysicalGiftItem) => {
    const list = pledges.get(g.id) || [];
    const item: PhysicalGiftItem = { ...g, reservedQuantity: list.reduce((n, p) => n + p.quantity, 0) };
    if (opts.pledgeDetails) item.pledges = list.map((p) => ({ id: p.id, guestName: p.guest_name, guestContact: p.guest_contact, quantity: p.quantity, message: p.message, createdAt: iso(p.created_at)! }));
    return item;
  });
  return config;
}

export async function updateWeddingConfig(ceremonyId: string, body: unknown): Promise<WeddingConfig> {
  const current = await getWeddingConfig(ceremonyId, { pledgeDetails: false });
  const next = cleanConfig(body, current, { isOwnedUrl: isOwnedStorageUrl });
  await sql`
    INSERT INTO wedding_config (ceremony_id, data) VALUES (${ceremonyId}, ${JSON.stringify(next)}::jsonb)
    ON CONFLICT (ceremony_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  return getWeddingConfig(ceremonyId, { pledgeDetails: true });
}

/** Réservation d'un cadeau : refusée si la quantité restante est insuffisante (contrôle dans la même requête SQL). */
export async function addPledge(ceremonyId: string, giftId: string, v: { guestName: string; guestContact: string; quantity: number; message: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await getWeddingConfig(ceremonyId, { pledgeDetails: false });
  const gift = (config.physicalGifts || []).find((g) => g.id === giftId);
  if (!gift) return { ok: false, error: 'Cadeau introuvable.' };
  const { rowCount } = await sql`
    INSERT INTO wedding_gift_pledges (id, ceremony_id, gift_id, guest_name, guest_contact, quantity, message)
    SELECT ${'pl-' + randomUUID()}, ${ceremonyId}, ${giftId}, ${v.guestName}, ${v.guestContact}, ${v.quantity}, ${v.message}
    WHERE (SELECT COALESCE(SUM(quantity), 0) FROM wedding_gift_pledges WHERE ceremony_id = ${ceremonyId} AND gift_id = ${giftId}) + ${v.quantity} <= ${gift.desiredQuantity}`;
  return (rowCount ?? 0) > 0 ? { ok: true } : { ok: false, error: 'Quantité indisponible : ce cadeau est déjà réservé.' };
}

// ---------- États complets ----------
export async function getManagerState(ceremonyId: string): Promise<WeddingStoreState> {
  const [config, guests, announcements, messages] = await Promise.all([
    getWeddingConfig(ceremonyId, { pledgeDetails: true }), listGuests(ceremonyId), listAnnouncements(ceremonyId), listMessages(ceremonyId),
  ]);
  return { config, guests, announcements, messages };
}

/** Ce que reçoit un invité : le contenu public, SA fiche, les annonces qui le concernent et les discussions. Jamais les autres invités. */
export async function getGuestState(token: string): Promise<{ state: WeddingStoreState; ceremonyId: string } | null> {
  const row = await getGuestByToken(token);
  if (!row) return null;
  const ceremony = await getCeremonyById(row.ceremony_id);
  if (!ceremony || ceremony.mode === 'guestbook') return null; // formule changée : les liens personnels cessent de fonctionner
  const guest = rowToGuest(row, false);
  const [config, announcements, messages] = await Promise.all([
    getWeddingConfig(row.ceremony_id, { pledgeDetails: false }), listAnnouncements(row.ceremony_id), listMessages(row.ceremony_id),
  ]);
  return {
    ceremonyId: row.ceremony_id,
    state: { config, guests: [guest], announcements: announcements.filter((a) => a.target === 'all' || guest.rsvpStatus === 'confirmed'), messages },
  };
}
