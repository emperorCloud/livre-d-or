import { getSession } from '../auth';
import { getCeremonyById, getGroup } from '../ceremonies';
import type { Ceremony } from '../types';

type Access = { ok: true; ceremony: Ceremony; role: 'admin' | 'manager' } | { ok: false; status: number; error: string };

/**
 * Qui peut gérer le programme d'un deuil ?
 *  - l'administrateur : n'importe quel deuil (il doit préciser lequel) ;
 *  - le responsable : UNIQUEMENT le deuil de son dossier (le paramètre éventuel est ignoré).
 * Le deuil doit avoir la formule « programme » ou « les deux ».
 */
export async function authorizeFuneral(requestedCeremonyId?: string | null): Promise<Access> {
  const s = await getSession();
  if (!s) return { ok: false, status: 401, error: 'Accès non autorisé.' };
  let ceremonyId: string | null | undefined;
  if (s.role === 'admin') ceremonyId = requestedCeremonyId;
  else ceremonyId = (await getGroup(s.groupId))?.ceremonyId;
  if (!ceremonyId) return { ok: false, status: 400, error: 'Cérémonie non précisée.' };
  const ceremony = await getCeremonyById(ceremonyId);
  if (!ceremony) return { ok: false, status: 404, error: 'Cérémonie introuvable.' };
  if (ceremony.type !== 'deuil' || ceremony.mode === 'guestbook') return { ok: false, status: 403, error: "Cette cérémonie n'utilise pas le programme." };
  return { ok: true, ceremony, role: s.role };
}
