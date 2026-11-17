// Ordre des messages du livre d'or : UNE seule règle, utilisée par la liste du responsable, l'aperçu et le livre PDF.
//   1. les messages classés par le responsable (sortOrder), du plus petit au plus grand ;
//   2. puis les messages non classés (nouveaux), par date d'arrivée, du plus ancien au plus récent.
// (Un message « épinglé » à l'ancienne, sans position, passe avant les autres non classés.)
import type { GuestEntry } from './types';

type Orderable = Pick<GuestEntry, 'id' | 'createdAt'> & { sortOrder?: number | null; isPinned?: boolean };

export function compareEntries(a: Orderable, b: Orderable): number {
  const ao = a.sortOrder ?? null, bo = b.sortOrder ?? null;
  if (ao !== null && bo !== null && ao !== bo) return ao - bo;
  if (ao !== null && bo === null) return -1;
  if (ao === null && bo !== null) return 1;
  if (ao === null && bo === null && !!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
  return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime() || a.id.localeCompare(b.id);
}

export const sortEntries = <T extends Orderable>(list: T[]): T[] => [...list].sort(compareEntries);

/** Même règle pour plusieurs groupes : d'abord l'ordre des groupes, puis l'ordre des messages dans chaque groupe. */
export function sortEntriesAcrossGroups<T extends Orderable & { groupId?: string }>(list: T[], groupIds: string[]): T[] {
  const rank = new Map(groupIds.map((g, i) => [g, i]));
  return [...list].sort((a, b) => (rank.get(a.groupId ?? '') ?? 1e9) - (rank.get(b.groupId ?? '') ?? 1e9) || compareEntries(a, b));
}

/** Déplace l'élément `id` de `delta` rangs (négatif = vers le haut) ; renvoie la nouvelle liste d'identifiants. */
export function moveId(ids: string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return ids;
  const to = Math.max(0, Math.min(ids.length - 1, from + delta));
  if (to === from) return ids;
  const next = [...ids]; next.splice(from, 1); next.splice(to, 0, id);
  return next;
}
export const moveToTop = (ids: string[], id: string) => (ids.includes(id) ? [id, ...ids.filter((x) => x !== id)] : ids);
export function moveBefore(ids: string[], id: string, targetId: string): string[] {
  if (id === targetId || !ids.includes(id) || !ids.includes(targetId)) return ids;
  const rest = ids.filter((x) => x !== id); rest.splice(rest.indexOf(targetId), 0, id);
  return rest;
}
