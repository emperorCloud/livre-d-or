// Appels du gestionnaire d'invitations, avec les MÊMES noms et signatures que dans le projet modèle : les écrans portés
// fonctionnent donc sans changement. Deux contextes :
//  - responsable / admin : routes /api/wedding/* (l'admin précise le mariage) ;
//  - invité : routes /api/inv/<jeton>/* (le jeton de son lien personnel).
// Le temps réel (WebSocket) est remplacé par une actualisation régulière, et immédiate après chaque action.
import type { Announcement, ChatMessage, Guest, WeddingConfig, WeddingStoreState } from './types';

let ctx: { ceremonyId?: string; token?: string } = {};
export function setWeddingContext(c: { ceremonyId?: string; token?: string }) { ctx = { ...c }; }

const qs = () => (ctx.ceremonyId ? `?ceremonyId=${encodeURIComponent(ctx.ceremonyId)}` : '');
const tokenBase = () => `/api/inv/${encodeURIComponent(ctx.token || '')}`;
const refresh = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('wedding:refresh')); };

async function call<T>(method: string, url: string, body?: unknown, opts: { tolerate?: boolean } = {}): Promise<T> {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !opts.tolerate) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  return data as T;
}

export async function fetchWeddingState(): Promise<WeddingStoreState> {
  return call<WeddingStoreState>('GET', ctx.token ? tokenBase() : `/api/wedding/state${qs()}`);
}

export async function updateWeddingConfig(patch: Partial<WeddingConfig>): Promise<WeddingConfig> {
  const r = await call<{ config: WeddingConfig }>('POST', `/api/wedding/config${qs()}`, patch);
  refresh();
  return r.config;
}

export async function addGuest(data: Partial<Guest>): Promise<Guest> {
  const g = await call<Guest>('POST', `/api/wedding/guests${qs()}`, data); refresh(); return g;
}
export async function updateGuest(id: string, data: Partial<Guest>): Promise<Guest> {
  const g = await call<Guest>('PUT', `/api/wedding/guests/${encodeURIComponent(id)}${qs()}`, data); refresh(); return g;
}
export async function removeGuest(id: string): Promise<void> {
  await call('DELETE', `/api/wedding/guests/${encodeURIComponent(id)}${qs()}`); refresh();
}

export async function submitRsvp(_guestId: string, payload: Record<string, unknown>): Promise<Guest> {
  const r = await call<{ guest: Guest }>('POST', `${tokenBase()}/rsvp`, payload); refresh(); return r.guest;
}
export async function proposeRepresentative(_guestId: string, payload: Record<string, unknown>): Promise<Guest> {
  const r = await call<{ guest: Guest }>('POST', `${tokenBase()}/representative`, payload); refresh(); return r.guest;
}

export interface CheckInResult { success: boolean; status: 'checked_in' | 'already_checked_in' | 'not_found'; message: string; guest?: Guest }
export async function checkInGuest(payload: { token?: string; guestId?: string; checkedInBy?: string }): Promise<CheckInResult> {
  const r = await call<CheckInResult>('POST', `/api/wedding/checkin${qs()}`, payload, { tolerate: true });
  refresh();
  return r && r.status ? r : { success: false, status: 'not_found', message: "Billet / QR Code introuvable. Veuillez vérifier auprès de l'accueil." };
}
export async function undoCheckIn(guestId: string): Promise<Guest> {
  const r = await call<{ guest: Guest }>('POST', `/api/wedding/checkin/undo${qs()}`, { guestId }); refresh(); return r.guest;
}

export async function postAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const a = await call<Announcement>('POST', `/api/wedding/announcements${qs()}`, data); refresh(); return a;
}
export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
  const a = await call<Announcement>('PATCH', `/api/wedding/announcements/${encodeURIComponent(id)}${qs()}`, data); refresh(); return a;
}
export async function deleteAnnouncement(id: string): Promise<void> {
  await call<{ success: true }>('DELETE', `/api/wedding/announcements/${encodeURIComponent(id)}${qs()}`); refresh();
}
export async function sendChatMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
  const m = await call<ChatMessage>('POST', ctx.token ? `${tokenBase()}/messages` : `/api/wedding/messages${qs()}`, data); refresh(); return m;
}
export async function pledgePhysicalGift(giftId: string, payload: Record<string, unknown>): Promise<{ success: boolean }> {
  const r = await call<{ success: boolean }>('POST', `${tokenBase()}/gifts/${encodeURIComponent(giftId)}/pledge`, payload); refresh(); return r;
}

/** Actualisation régulière (en pause quand l'onglet est caché) + immédiate après chaque action. Retourne la fonction d'arrêt. */
export function startWeddingPolling(onState: (s: WeddingStoreState) => void, onStatus?: (ok: boolean) => void, intervalMs = 5000): () => void {
  let stopped = false; let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => { if (!stopped) timer = setTimeout(tick, intervalMs); };
  const tick = async () => {
    if (stopped) return;
    if (document.visibilityState === 'hidden') { schedule(); return; }
    try { const s = await fetchWeddingState(); if (!stopped) { onState(s); onStatus?.(true); } } catch { onStatus?.(false); }
    schedule();
  };
  const now = () => { if (timer) clearTimeout(timer); tick(); };
  window.addEventListener('wedding:refresh', now);
  document.addEventListener('visibilitychange', now);
  tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); window.removeEventListener('wedding:refresh', now); document.removeEventListener('visibilitychange', now); };
}
