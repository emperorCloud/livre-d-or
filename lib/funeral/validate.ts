import { randomUUID } from 'crypto';
import { isOwnedStorageUrl } from '../storage';
import { EVENT_CATEGORIES, type Bus, type DonationMethod, type EventCategory, type FuneralConfig, type PayMethod, type Status } from './types';

// Toute donnée entrante est filtrée ici : longueurs bornées, listes blanches, liens http(s), images de NOTRE stockage uniquement.

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, n) : '');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DT_RE = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const ID_RE = /^[A-Za-z0-9_-]{1,48}$/;
const PHONE_RE = /^[+0-9 ()\-.]{6,24}$/;
const CATS = EVENT_CATEGORIES.map((c) => c.value);

const date = (v: unknown) => (typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v)) ? v : '');
const time = (v: unknown) => (typeof v === 'string' && TIME_RE.test(v) ? v : '');
const dateTime = (v: unknown) => (typeof v === 'string' && DT_RE.test(v) && !Number.isNaN(Date.parse(v)) ? v : '');
const id = (v: unknown) => (typeof v === 'string' && ID_RE.test(v) ? v : randomUUID().slice(0, 12));
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const phone = (v: unknown) => { const s = clip(v, 24); return PHONE_RE.test(s) ? s : ''; };
const ownImage = (v: unknown) => (typeof v === 'string' && isOwnedStorageUrl(v) ? new URL(v).toString() : '');
/** Lien de carte : http(s) uniquement (jamais javascript: ni data:). */
const webUrl = (v: unknown) => {
  const s = clip(v, 500);
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''; } catch { return ''; }
};
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function payMethods(v: unknown): PayMethod[] {
  return list(v, 6).map((m) => {
    const o = obj(m);
    return { label: clip(o.label, 60), accountNumber: clip(o.accountNumber, 60), accountName: clip(o.accountName, 100), instructions: clip(o.instructions, 300) };
  }).filter((m) => m.label);
}

export function emptyConfig(): FuneralConfig {
  return {
    profile: {
      titles: '', birthDate: '', deathDate: '', hometown: '', residenceCity: '', photoUrl: '', epitaph: '', biography: '',
      familyMessage: '', dressCodeAdvice: '', currency: 'FCFA', contactPhone: '', contactEmail: '', donationsOpen: true, donationMethods: [], searchIndexing: true,
    },
    fairePart: { header: '', footer: '', groups: [] },
    events: [], notices: [],
  };
}

/** Nettoie une configuration complète envoyée par le responsable. */
export function cleanConfig(raw: unknown): Result<FuneralConfig> {
  const r = obj(raw);
  if (!raw || typeof raw !== 'object') return fail('Requête invalide.');
  const p = obj(r.profile), fp = obj(r.fairePart);
  const email = clip(p.contactEmail, 200);
  const config: FuneralConfig = {
    profile: {
      titles: clip(p.titles, 200), birthDate: date(p.birthDate), deathDate: date(p.deathDate),
      hometown: clip(p.hometown, 120), residenceCity: clip(p.residenceCity, 120), photoUrl: ownImage(p.photoUrl),
      epitaph: clip(p.epitaph, 300), biography: clip(p.biography, 6000), familyMessage: clip(p.familyMessage, 3000),
      dressCodeAdvice: clip(p.dressCodeAdvice, 600), currency: clip(p.currency, 12) || 'FCFA',
      contactPhone: phone(p.contactPhone), contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
      donationsOpen: bool(p.donationsOpen, true), donationMethods: payMethods(p.donationMethods), searchIndexing: bool(p.searchIndexing, true),
    },
    fairePart: {
      header: clip(fp.header, 3000), footer: clip(fp.footer, 2000),
      groups: list(fp.groups, 40).map((g) => {
        const o = obj(g);
        return { id: id(o.id), title: clip(o.title, 120), members: list(o.members, 200).map((m) => clip(m, 160)).filter(Boolean) };
      }).filter((g) => g.title || g.members.length),
    },
    events: list(r.events, 60).map((e) => {
      const o = obj(e);
      return {
        id: id(o.id), title: clip(o.title, 160), category: (CATS.includes(o.category as EventCategory) ? o.category : 'autre') as EventCategory,
        date: date(o.date), startTime: time(o.startTime), endTime: time(o.endTime),
        locationName: clip(o.locationName, 160), locationAddress: clip(o.locationAddress, 300), mapUrl: webUrl(o.mapUrl),
        description: clip(o.description, 1500), leader: clip(o.leader, 160), dressCode: clip(o.dressCode, 200), isKey: bool(o.isKey, false),
      };
    }).filter((e) => e.title),
    notices: list(r.notices, 20).map((n) => {
      const o = obj(n);
      return { id: id(o.id), title: clip(o.title, 120), message: clip(o.message, 600), showFrom: dateTime(o.showFrom), active: bool(o.active, true) };
    }).filter((n) => n.title || n.message),
  };
  return { ok: true, value: config };
}

export function cleanBus(raw: unknown): Result<Bus> {
  const o = obj(raw);
  const name = clip(o.name, 120);
  if (!name) return fail('Le nom du bus est obligatoire.');
  const capacity = Number(o.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) return fail('Capacité invalide (1 à 200 places).');
  const fare = Number(o.fare ?? 0);
  if (!Number.isInteger(fare) || fare < 0 || fare > 10_000_000) return fail('Tarif invalide.');
  return {
    ok: true,
    value: {
      id: id(o.id), name, plate: clip(o.plate, 30), capacity,
      departureLocation: clip(o.departureLocation, 200), departureAt: dateTime(o.departureAt), destination: clip(o.destination, 200),
      driverName: clip(o.driverName, 120), driverPhone: phone(o.driverPhone), captainName: clip(o.captainName, 120), captainPhone: phone(o.captainPhone),
      notes: clip(o.notes, 800), fare, paymentMethods: payMethods(o.paymentMethods), reservationsOpen: bool(o.reservationsOpen, true),
    },
  };
}

export interface ReservationInput { busId: string; passengerName: string; passengerPhone: string; category: string; paymentMethod: string; proofUrl: string }
export function cleanReservationInput(raw: unknown): Result<ReservationInput> {
  const o = obj(raw);
  const passengerName = clip(o.passengerName, 120);
  if (passengerName.length < 2) return fail('Indiquez votre nom complet.');
  const passengerPhone = phone(o.passengerPhone);
  if (!passengerPhone) return fail('Indiquez un numéro de téléphone valide.');
  if (typeof o.busId !== 'string' || !ID_RE.test(o.busId)) return fail('Bus invalide.');
  return { ok: true, value: { busId: o.busId, passengerName, passengerPhone, category: clip(o.category, 80), paymentMethod: clip(o.paymentMethod, 60), proofUrl: ownImage(o.proofUrl) } };
}

const STATUSES: Status[] = ['pending', 'confirmed', 'rejected'];
export function cleanReservationPatch(raw: unknown): Result<{ status?: Status; notes?: string }> {
  const o = obj(raw);
  const out: { status?: Status; notes?: string } = {};
  if (o.status !== undefined) { if (!STATUSES.includes(o.status as Status)) return fail('Statut invalide.'); out.status = o.status as Status; }
  if (o.notes !== undefined) out.notes = clip(o.notes, 600);
  return Object.keys(out).length ? { ok: true, value: out } : fail('Aucune modification.');
}

const METHODS: DonationMethod[] = ['mobile_money', 'cash', 'transfer', 'cheque', 'autre'];
export interface DonationInput {
  donorName: string; donorPhone: string; category: string; amount: number; paymentMethod: DonationMethod; paymentReference: string;
  date: string; isAnonymous: boolean; purpose: string; blessing: string;
}
export function cleanDonationInput(raw: unknown): Result<DonationInput> {
  const o = obj(raw);
  const donorName = clip(o.donorName, 120);
  if (donorName.length < 2) return fail('Indiquez votre nom.');
  const amount = Number(o.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000_000) return fail('Montant invalide.');
  const dPhone = o.donorPhone ? phone(o.donorPhone) : '';
  if (o.donorPhone && !dPhone) return fail('Numéro de téléphone invalide.');
  return {
    ok: true,
    value: {
      donorName, donorPhone: dPhone, category: clip(o.category, 80), amount,
      paymentMethod: (METHODS.includes(o.paymentMethod as DonationMethod) ? o.paymentMethod : 'autre') as DonationMethod,
      paymentReference: clip(o.paymentReference, 80), date: date(o.date) || new Date().toISOString().slice(0, 10),
      isAnonymous: bool(o.isAnonymous, false), purpose: clip(o.purpose, 160), blessing: clip(o.blessing, 500),
    },
  };
}
export function cleanDonationPatch(raw: unknown): Result<{ status: Status }> {
  const o = obj(raw);
  return STATUSES.includes(o.status as Status) ? { ok: true, value: { status: o.status as Status } } : fail('Statut invalide.');
}
