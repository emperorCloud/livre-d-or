import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import type { Bus, Donation, DonationMethod, FuneralConfig, FuneralState, PublicBus, PublicProgramme, Reservation, Status } from './types';
import { receiptLabel } from './types';
import { cleanBus, cleanConfig, emptyConfig, type DonationInput, type ReservationInput } from './validate';

const MAX_BUSES = 20;
const iso = (v: unknown) => new Date(v as string).toISOString();
const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === '23505';

// ---------- Configuration (identité, faire-part, programme, rappels) ----------
export async function getConfig(ceremonyId: string): Promise<FuneralConfig> {
  const { rows } = await sql`SELECT data FROM funeral_config WHERE ceremony_id = ${ceremonyId}`;
  if (!rows[0]) return emptyConfig();
  const r = cleanConfig(rows[0].data);
  return r.ok ? r.value : emptyConfig();
}

export async function saveConfig(ceremonyId: string, config: FuneralConfig): Promise<FuneralConfig> {
  await sql`
    INSERT INTO funeral_config (ceremony_id, data, updated_at) VALUES (${ceremonyId}, ${JSON.stringify(config)}::jsonb, now())
    ON CONFLICT (ceremony_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  return config;
}

// ---------- Bus ----------
function rowToBus(r: any): Bus | null {
  const c = cleanBus({ ...(r.data || {}), id: r.id });
  return c.ok ? c.value : null;
}

export async function listBuses(ceremonyId: string): Promise<(Bus & { taken: number })[]> {
  const { rows } = await sql`
    SELECT b.id, b.data, COALESCE(COUNT(r.id) FILTER (WHERE r.status <> 'rejected'), 0)::int AS taken
    FROM funeral_buses b LEFT JOIN funeral_bus_reservations r ON r.bus_id = b.id
    WHERE b.ceremony_id = ${ceremonyId} GROUP BY b.id ORDER BY b.created_at ASC
  `;
  return rows.flatMap((r) => { const b = rowToBus(r); return b ? [{ ...b, taken: r.taken as number }] : []; });
}

/** Crée ou modifie un bus. Renvoie null si l'identifiant appartient à une autre cérémonie ou si la limite est atteinte. */
export async function upsertBus(ceremonyId: string, bus: Bus): Promise<{ bus: Bus } | { error: string }> {
  const { rows: cur } = await sql`SELECT id FROM funeral_buses WHERE ceremony_id = ${ceremonyId}`;
  const exists = cur.some((r) => r.id === bus.id);
  if (!exists && cur.length >= MAX_BUSES) return { error: `Limite de ${MAX_BUSES} bus atteinte.` };
  if (exists) {
    const { rows: n } = await sql`SELECT COUNT(*)::int AS n FROM funeral_bus_reservations WHERE bus_id = ${bus.id} AND status <> 'rejected'`;
    if (bus.capacity < (n[0]?.n ?? 0)) return { error: `Impossible : ${n[0].n} places sont déjà réservées.` };
  }
  const { rowCount } = await sql`
    INSERT INTO funeral_buses (id, ceremony_id, data) VALUES (${bus.id}, ${ceremonyId}, ${JSON.stringify(bus)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data WHERE funeral_buses.ceremony_id = EXCLUDED.ceremony_id
  `;
  return (rowCount ?? 0) > 0 ? { bus } : { error: 'Bus introuvable.' };
}

export async function deleteBus(ceremonyId: string, id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM funeral_buses WHERE id = ${id} AND ceremony_id = ${ceremonyId}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Réservations ----------
function rowToReservation(r: any): Reservation {
  return {
    id: r.id, busId: r.bus_id, orderNumber: r.order_number, passengerName: r.passenger_name, passengerPhone: r.passenger_phone,
    category: r.category, paymentMethod: r.payment_method, proofUrl: r.proof_url, status: r.status, notes: r.notes, createdAt: iso(r.created_at),
  };
}

export async function listReservations(ceremonyId: string): Promise<Reservation[]> {
  const { rows } = await sql`SELECT * FROM funeral_bus_reservations WHERE ceremony_id = ${ceremonyId} ORDER BY bus_id, order_number`;
  return rows.map(rowToReservation);
}

/**
 * Réserve une place. La capacité est vérifiée dans la même requête que l'insertion ; si deux personnes prennent la
 * dernière place en même temps, la contrainte UNIQUE (bus_id, order_number) fait échouer la seconde, qui est rejouée
 * et trouve alors le bus complet.
 */
export async function createReservation(ceremonyId: string, d: ReservationInput): Promise<{ reservation: Reservation } | { error: string; status: number }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { rows } = await sql`
        INSERT INTO funeral_bus_reservations (id, ceremony_id, bus_id, order_number, passenger_name, passenger_phone, category, payment_method, proof_url)
        SELECT ${'resa-' + randomUUID()}, ${ceremonyId}, b.id,
               COALESCE((SELECT MAX(order_number) FROM funeral_bus_reservations WHERE bus_id = b.id), 0) + 1,
               ${d.passengerName}, ${d.passengerPhone}, ${d.category}, ${d.paymentMethod}, ${d.proofUrl}
        FROM funeral_buses b
        WHERE b.id = ${d.busId} AND b.ceremony_id = ${ceremonyId}
          AND (b.data->>'reservationsOpen')::boolean IS NOT FALSE
          AND (SELECT COUNT(*) FROM funeral_bus_reservations r WHERE r.bus_id = b.id AND r.status <> 'rejected') < (b.data->>'capacity')::int
        RETURNING *
      `;
      if (rows[0]) return { reservation: rowToReservation(rows[0]) };
      const { rows: b } = await sql`SELECT data FROM funeral_buses WHERE id = ${d.busId} AND ceremony_id = ${ceremonyId}`;
      if (!b[0]) return { error: 'Bus introuvable.', status: 404 };
      return b[0].data?.reservationsOpen === false
        ? { error: 'Les réservations de ce bus sont closes.', status: 409 }
        : { error: 'Ce bus est complet.', status: 409 };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  return { error: 'Beaucoup de réservations en même temps, réessayez dans un instant.', status: 503 };
}

export async function patchReservation(ceremonyId: string, id: string, p: { status?: Status; notes?: string }): Promise<Reservation | null> {
  const { rows } = await sql`
    UPDATE funeral_bus_reservations SET status = COALESCE(${p.status ?? null}, status), notes = COALESCE(${p.notes ?? null}, notes)
    WHERE id = ${id} AND ceremony_id = ${ceremonyId} RETURNING *
  `;
  return rows[0] ? rowToReservation(rows[0]) : null;
}

export async function deleteReservation(ceremonyId: string, id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM funeral_bus_reservations WHERE id = ${id} AND ceremony_id = ${ceremonyId}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Dons ----------
function rowToDonation(r: any): Donation {
  return {
    id: r.id, receiptNumber: receiptLabel(r.receipt_seq), donorName: r.donor_name, donorPhone: r.donor_phone, category: r.category,
    amount: Number(r.amount), paymentMethod: r.payment_method as DonationMethod, paymentReference: r.payment_reference, date: r.donated_on,
    isAnonymous: r.is_anonymous, purpose: r.purpose, blessing: r.blessing, status: r.status, createdAt: iso(r.created_at),
  };
}

export async function listDonations(ceremonyId: string): Promise<Donation[]> {
  const { rows } = await sql`SELECT * FROM funeral_donations WHERE ceremony_id = ${ceremonyId} ORDER BY receipt_seq DESC`;
  return rows.map(rowToDonation);
}

/** `status` = « pending » pour un don déclaré par un visiteur, « confirmed » pour une saisie du responsable. */
export async function createDonation(ceremonyId: string, d: DonationInput, status: Status): Promise<Donation> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { rows } = await sql`
        INSERT INTO funeral_donations (id, ceremony_id, receipt_seq, donor_name, donor_phone, category, amount, payment_method, payment_reference,
                                       donated_on, is_anonymous, purpose, blessing, status)
        VALUES (${'don-' + randomUUID()}, ${ceremonyId}, (SELECT COALESCE(MAX(receipt_seq), 0) + 1 FROM funeral_donations WHERE ceremony_id = ${ceremonyId}),
                ${d.donorName}, ${d.donorPhone}, ${d.category}, ${d.amount}, ${d.paymentMethod}, ${d.paymentReference},
                ${d.date}, ${d.isAnonymous}, ${d.purpose}, ${d.blessing}, ${status})
        RETURNING *
      `;
      return rowToDonation(rows[0]);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw new Error('Beaucoup de dons en même temps, réessayez dans un instant.');
}

export async function patchDonation(ceremonyId: string, id: string, status: Status): Promise<Donation | null> {
  const { rows } = await sql`UPDATE funeral_donations SET status = ${status} WHERE id = ${id} AND ceremony_id = ${ceremonyId} RETURNING *`;
  return rows[0] ? rowToDonation(rows[0]) : null;
}

export async function deleteDonation(ceremonyId: string, id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM funeral_donations WHERE id = ${id} AND ceremony_id = ${ceremonyId}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Vues ----------
export async function getFuneralState(ceremonyId: string): Promise<FuneralState> {
  const [config, buses, reservations, donations] = await Promise.all([
    getConfig(ceremonyId), listBuses(ceremonyId), listReservations(ceremonyId), listDonations(ceremonyId),
  ]);
  return { config, buses: buses.map(({ taken: _t, ...b }) => b), reservations, donations };
}

/** Le deuil est-il ouvert au public via ce lien ? (type deuil, formule « programme » ou « les deux »). */
export async function getProgrammeTarget(slug: string): Promise<{ ceremonyId: string; hasBook: boolean } | null> {
  const { rows } = await sql`
    SELECT c.id, c.mode FROM groups g JOIN ceremonies c ON c.id = g.ceremony_id
    WHERE g.invite_slug = ${slug} AND c.type = 'deuil' AND c.mode <> 'guestbook'
  `;
  return rows[0] ? { ceremonyId: rows[0].id, hasBook: rows[0].mode === 'both' } : null;
}

export async function getPublicProgramme(slug: string): Promise<PublicProgramme | null> {
  const { rows } = await sql`
    SELECT g.invite_slug, c.id, c.mode, c.title, c.subtitle, c.honoree_name, c.event_date, c.location
    FROM groups g JOIN ceremonies c ON c.id = g.ceremony_id
    WHERE g.invite_slug = ${slug} AND c.type = 'deuil' AND c.mode <> 'guestbook'
  `;
  const c = rows[0];
  if (!c) return null;
  const [config, buses, stats, donors] = await Promise.all([
    getConfig(c.id), listBuses(c.id),
    sql`SELECT COALESCE(SUM(amount), 0)::text AS total, COUNT(*)::int AS n FROM funeral_donations WHERE ceremony_id = ${c.id} AND status = 'confirmed'`,
    sql`SELECT donor_name FROM funeral_donations WHERE ceremony_id = ${c.id} AND status = 'confirmed' AND is_anonymous = false ORDER BY created_at DESC LIMIT 200`,
  ]);
  const publicBuses: PublicBus[] = buses.map(({ driverPhone: _p, ...b }) => b);
  return {
    slug: c.invite_slug, hasBook: c.mode === 'both',
    ceremony: { title: c.title, subtitle: c.subtitle, honoreeName: c.honoree_name, date: c.event_date, location: c.location },
    // Seuls les rappels actifs sont publics.
    config: { ...config, notices: config.notices.filter((n) => n.active) },
    buses: publicBuses,
    donations: { total: Number(stats.rows[0]?.total ?? 0), count: stats.rows[0]?.n ?? 0, donors: [...new Set(donors.rows.map((r) => r.donor_name as string))] },
  };
}

/** Pages de programme à référencer (sitemap) : une par deuil, seulement si la famille n'a pas désactivé l'indexation. */
export async function listIndexableProgrammes(): Promise<{ slug: string; updatedAt: string }[]> {
  const { rows } = await sql`
    SELECT DISTINCT ON (c.id) g.invite_slug AS slug, f.updated_at
    FROM ceremonies c JOIN groups g ON g.ceremony_id = c.id JOIN funeral_config f ON f.ceremony_id = c.id
    WHERE c.type = 'deuil' AND c.mode <> 'guestbook' AND COALESCE(f.data->'profile'->>'searchIndexing', 'true') <> 'false'
    ORDER BY c.id, g.created_at ASC
  `;
  return rows.map((r) => ({ slug: r.slug as string, updatedAt: iso(r.updated_at) }));
}
