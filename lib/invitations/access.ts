import { getSession } from '../auth';
import { getGroup, getCeremonyById } from '../ceremonies';
import type { Ceremony } from '../types';

type Access = { ok: true; ceremony: Ceremony } | { ok: false; status: number; error: string };

/**
 * Qui peut gérer les invitations d'un mariage ?
 *  - l'administrateur : n'importe quel mariage (il doit préciser lequel) ;
 *  - le responsable : UNIQUEMENT le mariage de son dossier (le paramètre éventuel est ignoré).
 * Le mariage doit avoir la formule « invitation » ou « les deux ».
 */
export async function authorizeInvitations(requestedCeremonyId?: string | null): Promise<Access> {
  const s = await getSession();
  if (!s) return { ok: false, status: 401, error: 'Accès non autorisé.' };
  let ceremonyId: string | null | undefined;
  if (s.role === 'admin') ceremonyId = requestedCeremonyId;
  else ceremonyId = (await getGroup(s.groupId))?.ceremonyId;
  if (!ceremonyId) return { ok: false, status: 400, error: 'Cérémonie non précisée.' };
  const ceremony = await getCeremonyById(ceremonyId);
  if (!ceremony) return { ok: false, status: 404, error: 'Cérémonie introuvable.' };
  if (ceremony.mode === 'guestbook') return { ok: false, status: 403, error: "Cette cérémonie n'utilise pas les invitations." };
  return { ok: true, ceremony };
}
