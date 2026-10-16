import type { Ceremony, Group, GuestEntry, SessionInfo } from '@/lib/types';
import type { SiteSettings } from '@/lib/siteSettings';

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  return data as T;
}
const get = <T,>(url: string) => fetch(url, { cache: 'no-store' }).then((r) => parse<T>(r));
const send = <T,>(method: string, url: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }).then((r) => parse<T>(r));

export const api = {
  settings: () => get<SiteSettings>('/api/settings'),
  saveSettings: (s: Partial<SiteSettings>) => send<SiteSettings>('PATCH', '/api/settings', s),

  session: () => get<SessionInfo>('/api/admin/session'),
  adminLogin: (passcode: string) => send<{ success: true }>('POST', '/api/admin/login', { passcode }),
  managerLogin: (code: string) => send<{ success: true; groupId: string }>('POST', '/api/manager/login', { code }),
  logout: () => send<{ success: true }>('POST', '/api/admin/logout'),

  ceremonies: () => get<{ ceremonies: Ceremony[]; groups: Group[] }>('/api/ceremonies'),
  createCeremony: (c: unknown) => send<{ ceremony: Ceremony }>('POST', '/api/ceremonies', c),
  updateCeremony: (id: string, c: unknown) => send<{ ceremony: Ceremony }>('PATCH', `/api/ceremonies/${id}`, c),
  deleteCeremony: (id: string) => send<{ success: true }>('DELETE', `/api/ceremonies/${id}`),

  createGroup: (g: unknown) => send<{ group: Group; accessCode: string }>('POST', '/api/groups', g),
  updateGroup: (id: string, g: unknown) => send<{ group: Group }>('PATCH', `/api/groups/${id}`, g),
  deleteGroup: (id: string) => send<{ success: true }>('DELETE', `/api/groups/${id}`),
  resetCode: (id: string) => send<{ accessCode: string }>('POST', `/api/groups/${id}/reset-code`),
  managerMe: () => get<{ group: Group; ceremony: Ceremony }>('/api/manager/me'),

  entries: () => get<GuestEntry[]>('/api/entries'),
  moderate: (id: string, patch: { isPinned?: boolean; isApproved?: boolean }) => send<{ entry: GuestEntry }>('PATCH', `/api/admin/entries/${id}`, patch),
  deleteEntry: (id: string) => send<{ success: true }>('DELETE', `/api/admin/entries/${id}`),

  // invité
  myEntries: (token: string) => get<GuestEntry[]>(`/api/entries?guestToken=${encodeURIComponent(token)}`),
  submitEntry: (body: unknown) => send<{ entry: GuestEntry; token?: string }>('POST', '/api/entries', body),
  deleteMine: (token: string) => send<{ success: true }>('DELETE', `/api/entries/token/${encodeURIComponent(token)}`),
};
