import { getSession } from './auth';
import { getGroupIdBySlug } from './ceremonies';
import { rateLimit, clientIp } from './ratelimit';

export type UploadKind = 'photo' | 'thumb' | 'featured';
type Result = { ok: true } | { ok: false; status: number; error: string };

/**
 * Qui peut téléverser ? La photo à la une : admin ou responsable connecté.
 * Les photos de souvenir : un invité avec le lien d'un groupe ouvert qui accepte les photos (ou un responsable/admin).
 */
export async function authorizeUpload(req: Request, input: { inviteSlug?: string; kind: UploadKind }): Promise<Result> {
  if (!(await rateLimit(`upload:${(input.inviteSlug || 'staff').slice(0, 64)}:${clientIp(req)}`, 300, 600))) {
    return { ok: false, status: 429, error: 'Trop de téléversements, réessayez dans quelques minutes.' };
  }
  const session = await getSession();
  if (input.kind === 'featured') {
    return session ? { ok: true } : { ok: false, status: 401, error: 'Accès non autorisé.' };
  }
  if (session) return { ok: true };
  const group = input.inviteSlug ? await getGroupIdBySlug(input.inviteSlug) : null;
  if (!group || group.isClosed || !group.allowPhotos) {
    return { ok: false, status: 403, error: "Le téléversement n'est pas autorisé." };
  }
  return { ok: true };
}
