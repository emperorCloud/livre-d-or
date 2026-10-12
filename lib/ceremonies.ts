import { sql } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import type { Ceremony, CeremonyType, Group, PublicInvite, ThemeConfig } from './types';
import { buildTheme, sanitizeBlobUrl } from './themePresets';
import { generateAccessCode } from './auth';

const TYPES: CeremonyType[] = ['deuil', 'mariage', 'anniversaire', 'retraite'];
const RATIOS = ['16:9', '4:5', '1:1'] as const;
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

function rowToCeremony(r: any): Ceremony {
  return {
    id: r.id, type: r.type, title: r.title, subtitle: r.subtitle, honoreeName: r.honoree_name,
    date: r.event_date, location: r.location,
    theme: buildTheme(r.type, r.theme || {}),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function rowToGroup(r: any): Group {
  return {
    id: r.id, ceremonyId: r.ceremony_id, name: r.name, managerName: r.manager_name,
    managerEmail: r.manager_email, inviteSlug: r.invite_slug, hasManagerCode: !!r.manager_secret_hash,
    customIntro: r.custom_intro, customPrompt: r.custom_prompt, themeOverrides: r.theme_overrides || {},
    allowPhotos: r.allow_photos, isClosed: r.is_closed, featuredPhotoUrl: r.featured_photo_url,
    featuredPhotoAspectRatio: r.featured_photo_aspect_ratio,
    featuredFocalX: r.featured_focal_x ?? 0.5, featuredFocalY: r.featured_focal_y ?? 0.4,
    featuredWidth: r.featured_width ?? null, featuredHeight: r.featured_height ?? null,
  };
}

// ---------- Cérémonies ----------
export async function listCeremonies(): Promise<{ ceremonies: Ceremony[]; groups: Group[] }> {
  const { rows: c } = await sql`SELECT * FROM ceremonies ORDER BY created_at DESC`;
  const { rows: g } = await sql`SELECT * FROM groups ORDER BY created_at ASC`;
  return { ceremonies: c.map(rowToCeremony), groups: g.map(rowToGroup) };
}

export async function createCeremony(d: any): Promise<Ceremony | null> {
  const type = TYPES.includes(d?.type) ? (d.type as CeremonyType) : null;
  const title = clip(d?.title, 160), honoree = clip(d?.honoreeName, 160);
  if (!type || !title || !honoree) return null;
  const id = 'ceremony-' + randomUUID();
  const theme = buildTheme(type, d.theme || {});
  await sql`
    INSERT INTO ceremonies (id, type, title, subtitle, honoree_name, event_date, location, theme)
    VALUES (${id}, ${type}, ${title}, ${clip(d.subtitle, 200)}, ${honoree}, ${clip(d.date, 80)},
            ${clip(d.location, 200)}, ${JSON.stringify(theme)}::jsonb)
  `;
  const { rows } = await sql`SELECT * FROM ceremonies WHERE id = ${id}`;
  return rowToCeremony(rows[0]);
}

export async function updateCeremony(id: string, d: any): Promise<Ceremony | null> {
  const { rows } = await sql`SELECT * FROM ceremonies WHERE id = ${id}`;
  if (!rows[0]) return null;
  const cur = rowToCeremony(rows[0]);
  const type = TYPES.includes(d?.type) ? (d.type as CeremonyType) : cur.type;
  const theme = buildTheme(type, { ...cur.theme, ...(d?.theme || {}) });
  await sql`
    UPDATE ceremonies SET type = ${type},
      title = ${clip(d.title, 160) || cur.title},
      subtitle = ${typeof d.subtitle === 'string' ? clip(d.subtitle, 200) : cur.subtitle},
      honoree_name = ${clip(d.honoreeName, 160) || cur.honoreeName},
      event_date = ${typeof d.date === 'string' ? clip(d.date, 80) : cur.date},
      location = ${typeof d.location === 'string' ? clip(d.location, 200) : cur.location},
      theme = ${JSON.stringify(theme)}::jsonb
    WHERE id = ${id}
  `;
  const { rows: out } = await sql`SELECT * FROM ceremonies WHERE id = ${id}`;
  return rowToCeremony(out[0]);
}

export async function deleteCeremony(id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM ceremonies WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

// ---------- Groupes ----------
export async function getGroup(id: string): Promise<Group | null> {
  const { rows } = await sql`SELECT * FROM groups WHERE id = ${id}`;
  return rows[0] ? rowToGroup(rows[0]) : null;
}

export async function getGroupRowByLoginId(loginId: string) {
  const { rows } = await sql`SELECT * FROM groups WHERE manager_login_id = ${loginId}`;
  return rows[0] || null;
}

/** Crée un groupe et renvoie son code responsable EN CLAIR, une seule fois. */
export async function createGroup(d: any): Promise<{ group: Group; accessCode: string } | null> {
  const ceremonyId = clip(d?.ceremonyId, 80), name = clip(d?.name, 160);
  if (!ceremonyId || !name) return null;
  const { rows: c } = await sql`SELECT id FROM ceremonies WHERE id = ${ceremonyId}`;
  if (!c[0]) return null;
  const id = 'group-' + randomUUID();
  const code = generateAccessCode();
  await sql`
    INSERT INTO groups (id, ceremony_id, name, manager_name, manager_email, manager_login_id, manager_secret_hash,
                        custom_intro, custom_prompt, allow_photos, featured_photo_url, featured_photo_aspect_ratio)
    VALUES (${id}, ${ceremonyId}, ${name}, ${clip(d.managerName, 120)}, ${clip(d.managerEmail, 200)},
            ${code.loginId}, ${code.hash}, ${clip(d.customIntro, 1200)}, ${clip(d.customPrompt, 400)},
            ${d.allowPhotos !== false}, ${sanitizeBlobUrl(d.featuredPhotoUrl || '')},
            ${RATIOS.includes(d.featuredPhotoAspectRatio) ? d.featuredPhotoAspectRatio : '16:9'})
  `;
  return { group: (await getGroup(id))!, accessCode: code.code };
}

/** Champs modifiables. Le responsable du groupe n'a droit qu'à `MANAGER_FIELDS`. */
export const MANAGER_FIELDS = ['customIntro', 'customPrompt', 'allowPhotos', 'isClosed', 'featuredPhotoUrl', 'featuredPhotoAspectRatio'] as const;

export async function updateGroup(id: string, d: any, asManager: boolean): Promise<Group | null> {
  const cur = await getGroup(id);
  if (!cur) return null;
  const pick = (k: string) => !asManager || (MANAGER_FIELDS as readonly string[]).includes(k);
  const next = {
    name: pick('name') && clip(d.name, 160) ? clip(d.name, 160) : cur.name,
    managerName: pick('managerName') && typeof d.managerName === 'string' ? clip(d.managerName, 120) : cur.managerName,
    managerEmail: pick('managerEmail') && typeof d.managerEmail === 'string' ? clip(d.managerEmail, 200) : cur.managerEmail,
    customIntro: typeof d.customIntro === 'string' ? clip(d.customIntro, 1200) : cur.customIntro,
    customPrompt: typeof d.customPrompt === 'string' ? clip(d.customPrompt, 400) : cur.customPrompt,
    allowPhotos: typeof d.allowPhotos === 'boolean' ? d.allowPhotos : cur.allowPhotos,
    isClosed: typeof d.isClosed === 'boolean' ? d.isClosed : cur.isClosed,
    featuredPhotoUrl: typeof d.featuredPhotoUrl === 'string' ? sanitizeBlobUrl(d.featuredPhotoUrl) : cur.featuredPhotoUrl,
    ratio: RATIOS.includes(d.featuredPhotoAspectRatio) ? d.featuredPhotoAspectRatio : cur.featuredPhotoAspectRatio,
    focalX: typeof d.featuredFocalX === 'number' ? Math.min(1, Math.max(0, d.featuredFocalX)) : cur.featuredFocalX,
    focalY: typeof d.featuredFocalY === 'number' ? Math.min(1, Math.max(0, d.featuredFocalY)) : cur.featuredFocalY,
    fw: Number.isInteger(d.featuredWidth) && d.featuredWidth > 0 ? d.featuredWidth : cur.featuredWidth,
    fh: Number.isInteger(d.featuredHeight) && d.featuredHeight > 0 ? d.featuredHeight : cur.featuredHeight,
    overrides: pick('themeOverrides') && d.themeOverrides && typeof d.themeOverrides === 'object'
      ? d.themeOverrides : cur.themeOverrides,
  };
  await sql`
    UPDATE groups SET name = ${next.name}, manager_name = ${next.managerName}, manager_email = ${next.managerEmail},
      custom_intro = ${next.customIntro}, custom_prompt = ${next.customPrompt}, allow_photos = ${next.allowPhotos},
      is_closed = ${next.isClosed}, featured_photo_url = ${next.featuredPhotoUrl},
      featured_photo_aspect_ratio = ${next.ratio}, featured_focal_x = ${next.focalX}, featured_focal_y = ${next.focalY},
      featured_width = ${next.fw}, featured_height = ${next.fh}, theme_overrides = ${JSON.stringify(next.overrides)}::jsonb
    WHERE id = ${id}
  `;
  return getGroup(id);
}

export async function deleteGroup(id: string): Promise<boolean> {
  const { rowCount } = await sql`DELETE FROM groups WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

/** Génère un nouveau code responsable (l'ancien cesse de fonctionner). Affiché une seule fois. */
export async function resetGroupCode(id: string): Promise<string | null> {
  const code = generateAccessCode();
  const { rowCount } = await sql`
    UPDATE groups SET manager_login_id = ${code.loginId}, manager_secret_hash = ${code.hash} WHERE id = ${id}
  `;
  return (rowCount ?? 0) > 0 ? code.code : null;
}

// ---------- Invitation publique ----------
export async function getPublicInvite(slug: string): Promise<PublicInvite | null> {
  const { rows } = await sql`
    SELECT g.*, c.type AS c_type, c.title AS c_title, c.subtitle AS c_subtitle, c.honoree_name AS c_honoree,
           c.event_date AS c_date, c.location AS c_location, c.theme AS c_theme
    FROM groups g JOIN ceremonies c ON c.id = g.ceremony_id WHERE g.invite_slug = ${slug}
  `;
  const r = rows[0];
  if (!r) return null;
  const theme: ThemeConfig = buildTheme(r.c_type, { ...(r.c_theme || {}), ...(r.theme_overrides || {}) });
  return {
    slug: r.invite_slug, groupName: r.name, customIntro: r.custom_intro, customPrompt: r.custom_prompt,
    allowPhotos: r.allow_photos, isClosed: r.is_closed,
    featuredPhotoUrl: r.featured_photo_url || theme.coverImage, featuredPhotoAspectRatio: r.featured_photo_aspect_ratio,
    featuredFocalX: r.featured_focal_x ?? 0.5, featuredFocalY: r.featured_focal_y ?? 0.4,
    ceremony: { type: r.c_type, title: r.c_title, subtitle: r.c_subtitle, honoreeName: r.c_honoree, date: r.c_date, location: r.c_location },
    theme,
  };
}

export async function getGroupIdBySlug(slug: string): Promise<{ id: string; allowPhotos: boolean; isClosed: boolean } | null> {
  const { rows } = await sql`SELECT id, allow_photos, is_closed FROM groups WHERE invite_slug = ${slug}`;
  return rows[0] ? { id: rows[0].id, allowPhotos: rows[0].allow_photos, isClosed: rows[0].is_closed } : null;
}

// TRANSITION : groupe historique utilisé tant que l'ancienne interface n'envoie pas d'inviteSlug.
export const LEGACY_GROUP_ID = 'group-legacy-jean-michel';
export async function getLegacyGroupAccess() {
  const { rows } = await sql`SELECT id, allow_photos, is_closed FROM groups WHERE id = ${LEGACY_GROUP_ID}`;
  return rows[0] ? { id: rows[0].id as string, allowPhotos: rows[0].allow_photos as boolean, isClosed: rows[0].is_closed as boolean } : null;
}
