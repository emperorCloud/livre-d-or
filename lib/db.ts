import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import type { GuestEntry, GuestPhoto, EntryFormData, AdminStats } from './types';
import { sanitizeBlobUrl } from './themePresets';

const DEFAULT_REACTIONS = { '❤️': 0, '🥂': 0, '👏': 0, '🎉': 0, '🌟': 0 };

function rowToEntry(row: any, photos: GuestPhoto[]): GuestEntry {
  const primaryPhoto = photos[0];
  return {
    id: row.id,
    groupId: row.group_id || undefined,
    token: row.token,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || '',
    relationship: row.relationship,
    yearsKnown: row.years_known || '',
    message: row.message,
    anecdote: row.anecdote || '',
    wish: row.wish || '',
    photoUrl: primaryPhoto?.url || '',
    photoCaption: primaryPhoto?.caption || '',
    photos,
    cardStyle: row.card_style,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    likesCount: row.likes_count,
    isPinned: row.is_pinned,
    isApproved: row.is_approved,
    reactions: row.reactions || DEFAULT_REACTIONS,
  };
}

async function getPhotosForEntries(entryIds: string[]): Promise<Map<string, GuestPhoto[]>> {
  const map = new Map<string, GuestPhoto[]>();
  if (entryIds.length === 0) return map;
  const { rows } = await sql.query(
    `SELECT id, entry_id, url, thumb_url, width, height, caption FROM entry_photos WHERE entry_id = ANY($1::text[]) ORDER BY position ASC`,
    [entryIds]
  );
  for (const r of rows) {
    const list = map.get(r.entry_id) || [];
    list.push({ id: r.id, url: r.url, thumbUrl: r.thumb_url || '', width: r.width ?? undefined, height: r.height ?? undefined, caption: r.caption || '' });
    map.set(r.entry_id, list);
  }
  return map;
}

export async function getAllEntries(): Promise<GuestEntry[]> {
  const { rows } = await sql`
    SELECT * FROM entries ORDER BY is_pinned DESC, created_at DESC
  `;
  const photosMap = await getPhotosForEntries(rows.map((r) => r.id));
  return rows.map((r) => rowToEntry(r, photosMap.get(r.id) || []));
}

export async function getEntriesByGroup(groupId: string): Promise<GuestEntry[]> {
  const { rows } = await sql`
    SELECT * FROM entries WHERE group_id = ${groupId} ORDER BY is_pinned DESC, created_at DESC
  `;
  const photosMap = await getPhotosForEntries(rows.map((r) => r.id));
  return rows.map((r) => rowToEntry(r, photosMap.get(r.id) || []));
}

export async function getEntriesByToken(token: string): Promise<GuestEntry[]> {
  const { rows } = await sql`SELECT * FROM entries WHERE token = ${token}`;
  const photosMap = await getPhotosForEntries(rows.map((r) => r.id));
  return rows.map((r) => rowToEntry(r, photosMap.get(r.id) || []));
}

export async function getEntryByToken(token: string): Promise<GuestEntry | null> {
  const { rows } = await sql`SELECT * FROM entries WHERE token = ${token} LIMIT 1`;
  if (rows.length === 0) return null;
  const photosMap = await getPhotosForEntries([rows[0].id]);
  return rowToEntry(rows[0], photosMap.get(rows[0].id) || []);
}

export async function getEntryById(id: string): Promise<GuestEntry | null> {
  const { rows } = await sql`SELECT * FROM entries WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const photosMap = await getPhotosForEntries([rows[0].id]);
  return rowToEntry(rows[0], photosMap.get(rows[0].id) || []);
}

async function replacePhotos(entryId: string, photos: GuestPhoto[]) {
  await sql`DELETE FROM entry_photos WHERE entry_id = ${entryId}`;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (!p.url) continue;
    const photoId = p.id || `photo-${entryId}-${i}-${Date.now()}`;
    await sql`
      INSERT INTO entry_photos (id, entry_id, url, thumb_url, width, height, caption, position)
      VALUES (${photoId}, ${entryId}, ${p.url}, ${p.thumbUrl || ''}, ${p.width ?? null}, ${p.height ?? null}, ${p.caption || ''}, ${i})
    `;
  }
}

export async function createEntry(data: EntryFormData, groupId: string): Promise<GuestEntry> {
  const id = 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const token = 'guest-' + randomUUID();

  await sql`
    INSERT INTO entries (
      id, group_id, token, first_name, last_name, email, relationship, years_known,
      message, anecdote, wish, card_style, likes_count, is_pinned, is_approved, reactions
    ) VALUES (
      ${id}, ${groupId}, ${token}, ${data.firstName}, ${data.lastName}, ${data.email || ''},
      ${data.relationship || 'Collègue'}, ${data.yearsKnown || ''},
      ${data.message}, ${data.anecdote || ''}, ${data.wish || ''},
      ${data.cardStyle || 'polaroid'}, 0, false, true, ${JSON.stringify(DEFAULT_REACTIONS)}
    )
  `;

  const photos = normalizePhotos(data);
  await replacePhotos(id, photos);

  const entry = await getEntryById(id);
  return entry!;
}

export async function updateEntryByToken(token: string, data: EntryFormData): Promise<GuestEntry | null> {
  const existing = await getEntryByToken(token);
  if (!existing) return null;

  await sql`
    UPDATE entries SET
      first_name = ${data.firstName},
      last_name = ${data.lastName},
      email = ${data.email || existing.email || ''},
      relationship = ${data.relationship || existing.relationship},
      years_known = ${data.yearsKnown || existing.yearsKnown || ''},
      message = ${data.message},
      anecdote = ${data.anecdote || ''},
      wish = ${data.wish || ''},
      card_style = ${data.cardStyle || existing.cardStyle},
      updated_at = now()
    WHERE token = ${token}
  `;

  const photos = normalizePhotos(data);
  // Toujours remplacer (même par une liste vide) : le formulaire invité
  // envoie systématiquement l'état complet et actuel de ses photos à chaque
  // soumission. Ne remplacer que "si non vide" empêcherait de supprimer
  // définitivement une photo retirée par l'invité.
  await replacePhotos(existing.id, photos);

  return getEntryById(existing.id);
}

function normalizePhotos(data: EntryFormData): GuestPhoto[] {
  if (Array.isArray(data.photos) && data.photos.length > 0) {
    return data.photos
      .filter((p) => p && typeof p.url === 'string')
      .map((p) => ({
        ...p,
        url: sanitizeBlobUrl(p.url),
        thumbUrl: sanitizeBlobUrl(p.thumbUrl || ''),
        width: Number.isInteger(p.width) && p.width! > 0 && p.width! < 20000 ? p.width : undefined,
        height: Number.isInteger(p.height) && p.height! > 0 && p.height! < 20000 ? p.height : undefined,
        caption: (p.caption || '').slice(0, 200),
      }))
      .filter((p) => p.url !== '')
      .slice(0, 6);
  }
  if (data.photoUrl && sanitizeBlobUrl(data.photoUrl) !== '') {
    return [{ url: sanitizeBlobUrl(data.photoUrl), caption: (data.photoCaption || '').slice(0, 200) }];
  }
  return [];
}

export async function deleteEntryByToken(token: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM entries WHERE token = ${token}`;
  return (rowCount ?? 0) > 0;
}

export async function addReaction(id: string, emoji: string): Promise<{ reactions: Record<string, number>; likesCount: number } | null> {
  const key = Object.prototype.hasOwnProperty.call(DEFAULT_REACTIONS, emoji) ? emoji : '❤️';
  const { rows } = await sql`
    UPDATE entries SET
      reactions = jsonb_set(reactions, ARRAY[${key}]::text[], to_jsonb(COALESCE((reactions->>${key})::int, 0) + 1)),
      likes_count = likes_count + 1
    WHERE id = ${id} AND is_approved = true
    RETURNING reactions, likes_count
  `;
  if (!rows[0]) return null;
  return { reactions: rows[0].reactions, likesCount: rows[0].likes_count };
}

export async function adminUpdateEntry(id: string, patch: Partial<GuestEntry>): Promise<GuestEntry | null> {
  const existing = await getEntryById(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch };
  await sql`
    UPDATE entries SET
      first_name = ${merged.firstName},
      last_name = ${merged.lastName},
      email = ${merged.email || ''},
      relationship = ${merged.relationship},
      years_known = ${merged.yearsKnown || ''},
      message = ${merged.message},
      anecdote = ${merged.anecdote || ''},
      wish = ${merged.wish || ''},
      card_style = ${merged.cardStyle},
      is_pinned = ${merged.isPinned},
      is_approved = ${merged.isApproved},
      updated_at = now()
    WHERE id = ${id}
  `;

  return getEntryById(id);
}

export async function adminDeleteEntry(id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM entries WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

export async function getStats(): Promise<AdminStats> {
  const { rows: entryRows } = await sql`SELECT relationship, likes_count FROM entries`;
  const { rows: photoCountRows } = await sql`SELECT COUNT(*)::int AS count FROM entry_photos`;

  const totalEntries = entryRows.length;
  const totalLikes = entryRows.reduce((acc, r) => acc + (r.likes_count || 0), 0);
  const totalPhotos = photoCountRows[0]?.count || 0;

  const relationshipsCount: Record<string, number> = {};
  for (const r of entryRows) {
    const rel = r.relationship || 'Autre';
    relationshipsCount[rel] = (relationshipsCount[rel] || 0) + 1;
  }

  return { totalEntries, totalPhotos, totalLikes, relationshipsCount };
}
