import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import type { InvitationGuest, PublicInvitation, RsvpStatus } from '../types';
import { buildTheme } from '../themePresets';
import { newGuestToken, newTicketCode } from './tokens';
import type { GuestInput, RsvpInput } from './validate';

const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

function rowToGuest(r: any): InvitationGuest {
  return {
    id: r.id, ceremonyId: r.ceremony_id, token: r.token, ticketCode: r.ticket_code, greeting: r.greeting, category: r.category,
    email: r.email, phone: r.phone, tableNumber: r.table_number, maxGuests: r.max_guests,
    rsvpStatus: r.rsvp_status as RsvpStatus, rsvpGuests: r.rsvp_guests, diet: r.diet, allergies: r.allergies, note: r.note,
    rsvpAt: iso(r.rsvp_at), checkedInAt: iso(r.checked_in_at), checkedInCount: r.checked_in_count, createdAt: iso(r.created_at)!,
  };
}

// ---------- Responsable / admin ----------
export async function listGuests(ceremonyId: string): Promise<InvitationGuest[]> {
  const { rows } = await sql`SELECT * FROM invitation_guests WHERE ceremony_id = ${ceremonyId} ORDER BY created_at ASC`;
  return rows.map(rowToGuest);
}

export async function getGuestById(id: string): Promise<InvitationGuest | null> {
  const { rows } = await sql`SELECT * FROM invitation_guests WHERE id = ${id}`;
  return rows[0] ? rowToGuest(rows[0]) : null;
}

export async function createGuest(ceremonyId: string, i: GuestInput): Promise<InvitationGuest> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { rows } = await sql`
        INSERT INTO invitation_guests (id, ceremony_id, token, ticket_code, greeting, category, email, phone, table_number, max_guests)
        VALUES (${'guest-' + randomUUID()}, ${ceremonyId}, ${newGuestToken()}, ${newTicketCode()}, ${i.greeting}, ${i.category},
                ${i.email}, ${i.phone}, ${i.tableNumber}, ${i.maxGuests})
        RETURNING *`;
      return rowToGuest(rows[0]);
    } catch (e: any) {
      if (e?.code !== '23505') throw e; // collision de jeton (quasi impossible) : on retente avec de nouveaux jetons
    }
  }
  throw new Error('Création impossible, veuillez réessayer.');
}

export async function updateGuest(id: string, p: Partial<GuestInput>): Promise<InvitationGuest | null> {
  const cur = await getGuestById(id);
  if (!cur) return null;
  const { rows } = await sql`
    UPDATE invitation_guests SET
      greeting = ${p.greeting ?? cur.greeting}, category = ${p.category ?? cur.category}, email = ${p.email ?? cur.email},
      phone = ${p.phone ?? cur.phone}, table_number = ${p.tableNumber ?? cur.tableNumber}, max_guests = ${p.maxGuests ?? cur.maxGuests},
      rsvp_guests = LEAST(rsvp_guests, ${p.maxGuests ?? cur.maxGuests})
    WHERE id = ${id} RETURNING *`;
  return rowToGuest(rows[0]);
}

export async function deleteGuest(id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM invitation_guests WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Invité (accès par jeton) ----------
export async function getGuestByToken(token: string): Promise<InvitationGuest | null> {
  const { rows } = await sql`SELECT * FROM invitation_guests WHERE token = ${token}`;
  return rows[0] ? rowToGuest(rows[0]) : null;
}

/** Ce que voit l'invité : sa fiche + les informations publiques du mariage. Jamais d'autre invité, d'e-mail ni de jeton. */
export async function getPublicInvitation(token: string): Promise<PublicInvitation | null> {
  const { rows } = await sql`
    SELECT g.*, c.type AS c_type, c.mode AS c_mode, c.title AS c_title, c.subtitle AS c_subtitle, c.honoree_name AS c_honoree,
           c.event_date AS c_date, c.location AS c_location, c.theme AS c_theme
    FROM invitation_guests g JOIN ceremonies c ON c.id = g.ceremony_id WHERE g.token = ${token}`;
  const r = rows[0];
  if (!r || r.c_mode === 'guestbook') return null; // la formule a été changée : les anciens liens cessent de fonctionner
  const { rows: gr } = await sql`
    SELECT featured_photo_url, featured_photo_aspect_ratio, featured_focal_x, featured_focal_y, theme_overrides
    FROM groups WHERE ceremony_id = ${r.ceremony_id} ORDER BY created_at ASC LIMIT 1`;
  const grp = gr[0];
  const theme = buildTheme(r.c_type, { ...(r.c_theme || {}), ...(grp?.theme_overrides || {}) });
  return {
    greeting: r.greeting, maxGuests: r.max_guests, tableNumber: r.table_number,
    rsvp: { status: r.rsvp_status, guests: r.rsvp_guests, diet: r.diet, allergies: r.allergies, note: r.note, at: iso(r.rsvp_at) },
    ticketCode: r.rsvp_status === 'yes' ? r.ticket_code : null,
    ceremony: { type: r.c_type, title: r.c_title, subtitle: r.c_subtitle, honoreeName: r.c_honoree, date: r.c_date, location: r.c_location },
    theme,
    photo: {
      url: grp?.featured_photo_url || theme.coverImage || '', aspectRatio: grp?.featured_photo_aspect_ratio || '16:9',
      focalX: grp?.featured_focal_x ?? 0.5, focalY: grp?.featured_focal_y ?? 0.4,
    },
  };
}

export async function saveRsvp(token: string, v: RsvpInput): Promise<PublicInvitation | null> {
  const { rowCount } = await sql`
    UPDATE invitation_guests SET rsvp_status = ${v.status}, rsvp_guests = ${v.guests}, diet = ${v.diet}, allergies = ${v.allergies},
      note = ${v.note}, rsvp_at = now() WHERE token = ${token}`;
  return (rowCount ?? 0) > 0 ? getPublicInvitation(token) : null;
}
