import { clientIp, rateLimit } from '../ratelimit';

/** Limite les écritures faites avec un lien personnel : par adresse IP (invités sur un même Wi-Fi tolérés) et par invité. */
export async function guestWriteLimit(req: Request, token: string): Promise<boolean> {
  return (await rateLimit(`inv-write:${clientIp(req)}`, 120, 600)) && (await rateLimit(`inv-write-t:${token.slice(0, 12)}`, 60, 3600));
}
