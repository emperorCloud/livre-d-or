// Migration Vercel Blob -> Cloudflare R2, sans toucher au code de l'application.
//
//   1. Créer le bucket R2 + un domaine public + une clé API (voir MIGRATION.md), renseigner R2_* dans .env.local
//   2. npm run migrate:storage -- --dry-run
//   3. npm run migrate:storage
//   4. Mettre STORAGE_DRIVER=r2 dans Vercel, redéployer, vérifier le site et un PDF.
//
// Le script COPIE (il ne supprime rien dans Blob) et peut être relancé : un objet déjà présent dans R2 est ignoré.
import { sql } from '@vercel/postgres';
import { r2Exists, putObject, r2PublicUrl } from '../lib/storage/r2';

const dry = process.argv.includes('--dry-run');
const need = (n: string) => { const v = process.env[n]; if (!v) { console.error(`Variable manquante : ${n}`); process.exit(1); } return v; };
for (const n of ['R2_BUCKET', 'R2_PUBLIC_URL', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) need(n);
need('POSTGRES_URL');

const isBlob = (u: string) => { try { return new URL(u).hostname.endsWith('.public.blob.vercel-storage.com'); } catch { return false; } };
const cache = new Map<string, string>(); // ancienne URL -> nouvelle URL
let copied = 0, skipped = 0, failed = 0;

async function migrate(url: string): Promise<string | null> {
  if (!url || !isBlob(url)) return null;
  if (cache.has(url)) return cache.get(url)!;
  const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  const next = r2PublicUrl(key);
  try {
    if (await r2Exists(key)) skipped++;
    else if (!dry) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`téléchargement ${res.status}`);
      await putObject(key, new Uint8Array(await res.arrayBuffer()), res.headers.get('content-type') || 'image/jpeg');
      copied++;
    } else copied++;
    cache.set(url, next);
    return next;
  } catch (e) {
    failed++; console.error('ÉCHEC', url, (e as Error).message); return null;
  }
}

const photos = (await sql`SELECT id, url, thumb_url FROM entry_photos`).rows;
for (const p of photos) {
  const url = await migrate(p.url), thumb = await migrate(p.thumb_url || '');
  if (!dry && url) await sql`UPDATE entry_photos SET url = ${url}, thumb_url = ${thumb ?? p.thumb_url ?? ''} WHERE id = ${p.id}`;
  else if (!dry && thumb) await sql`UPDATE entry_photos SET thumb_url = ${thumb} WHERE id = ${p.id}`;
}
for (const g of (await sql`SELECT id, featured_photo_url FROM groups WHERE featured_photo_url <> ''`).rows) {
  const url = await migrate(g.featured_photo_url);
  if (!dry && url) await sql`UPDATE groups SET featured_photo_url = ${url} WHERE id = ${g.id}`;
}
for (const c of (await sql`SELECT id, theme->>'coverImage' AS cover FROM ceremonies WHERE COALESCE(theme->>'coverImage','') <> ''`).rows) {
  const url = await migrate(c.cover);
  if (!dry && url) await sql`UPDATE ceremonies SET theme = jsonb_set(theme, '{coverImage}', to_jsonb(${url}::text)) WHERE id = ${c.id}`;
}

console.log(`${dry ? '[SIMULATION] ' : ''}copiés : ${copied} · déjà présents : ${skipped} · échecs : ${failed}`);
if (!dry && failed === 0) console.log('Terminé. Mettez STORAGE_DRIVER=r2 dans Vercel puis redéployez. Les fichiers Blob sont conservés.');
if (failed > 0) { console.error('Des fichiers ont échoué : relancez le script avant de changer de stockage.'); process.exit(2); }
