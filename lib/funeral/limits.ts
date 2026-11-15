import { clientIp, rateLimit } from '../ratelimit';

/** Écritures publiques (réservation, don) : par adresse IP (un même Wi-Fi de famille reste toléré) et par lien. */
export async function publicWriteLimit(req: Request, slug: string, scope: 'resa' | 'don'): Promise<boolean> {
  return (await rateLimit(`prog-${scope}:${clientIp(req)}`, 30, 600)) && (await rateLimit(`prog-${scope}-s:${slug.slice(0, 32)}`, 400, 3600));
}
