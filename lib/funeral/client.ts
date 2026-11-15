import type { Bus, Donation, FuneralConfig, FuneralState, PublicProgramme, Reservation, Status } from './types';
import type { DonationInput, ReservationInput } from './validate';

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  return data as T;
}
const call = <T,>(method: string, url: string, body?: unknown) =>
  fetch(url, { method, cache: 'no-store', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }).then((r) => parse<T>(r));

/** Client du responsable / de l'administrateur (le serveur ignore ceremonyId pour un responsable). */
export function funeralApi(ceremonyId: string) {
  const q = `?ceremonyId=${encodeURIComponent(ceremonyId)}`;
  return {
    state: () => call<FuneralState>('GET', `/api/funeral/state${q}`),
    saveConfig: (c: FuneralConfig) => call<{ config: FuneralConfig }>('PUT', `/api/funeral/config${q}`, c),
    saveBus: (b: Bus) => call<{ bus: Bus }>('POST', `/api/funeral/buses${q}`, b),
    deleteBus: (id: string) => call<{ success: true }>('DELETE', `/api/funeral/buses/${id}${q}`),
    patchReservation: (id: string, p: { status?: Status; notes?: string }) => call<{ reservation: Reservation }>('PATCH', `/api/funeral/reservations/${id}${q}`, p),
    deleteReservation: (id: string) => call<{ success: true }>('DELETE', `/api/funeral/reservations/${id}${q}`),
    addDonation: (d: Partial<DonationInput>) => call<{ donation: Donation }>('POST', `/api/funeral/donations${q}`, d),
    patchDonation: (id: string, status: Status) => call<{ donation: Donation }>('PATCH', `/api/funeral/donations/${id}${q}`, { status }),
    deleteDonation: (id: string) => call<{ success: true }>('DELETE', `/api/funeral/donations/${id}${q}`),
  };
}

/** Client du public (page /p/<slug>). */
export const programmeApi = (slug: string) => ({
  get: () => call<PublicProgramme>('GET', `/api/programme/${slug}`),
  reserve: (r: ReservationInput) => call<{ orderNumber: number; status: Status }>('POST', `/api/programme/${slug}/reserve`, r),
  donate: (d: Partial<DonationInput>) => call<{ receiptNumber: string; status: Status }>('POST', `/api/programme/${slug}/donate`, d),
});
