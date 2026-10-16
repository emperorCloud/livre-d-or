import type { GuestPhoto } from '@/lib/types';
import { processPhoto, processFeatured, type FeaturedRatio } from './images';

type Kind = 'photo' | 'thumb' | 'featured';
const FOLDER: Record<Kind, string> = { photo: 'photos', thumb: 'thumbs', featured: 'featured' };

let configPromise: Promise<{ driver: 'blob' | 'r2'; maxPhotosPerEntry: number }> | null = null;
export function getUploadConfig() {
  configPromise ??= fetch('/api/upload/config').then((r) => r.json());
  return configPromise;
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 600 * (i + 1))); }
  }
  throw last instanceof Error ? last : new Error("Échec de l'envoi de la photo.");
}

/** Envoie un JPEG directement au stockage actif (Blob ou R2) et renvoie son URL publique. */
export async function uploadJpeg(blob: Blob, kind: Kind, ctx: { inviteSlug?: string } = {}): Promise<string> {
  const { driver } = await getUploadConfig();
  return withRetry(async () => {
    if (driver === 'r2') {
      const sign = await fetch('/api/upload/r2', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteSlug: ctx.inviteSlug, kind, contentType: 'image/jpeg' }),
      });
      const data = await sign.json();
      if (!sign.ok) throw new Error(data.error || 'Téléversement refusé.');
      const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
      if (!put.ok) throw new Error("Échec de l'envoi de la photo.");
      return data.publicUrl as string;
    }
    const { upload } = await import('@vercel/blob/client');
    const res = await upload(`${FOLDER[kind]}/${crypto.randomUUID()}.jpg`, blob, {
      access: 'public',
      handleUploadUrl: '/api/upload/blob',
      clientPayload: JSON.stringify({ inviteSlug: ctx.inviteSlug }),
    });
    return res.url;
  });
}

/** Photo de souvenir d'un invité : redimensionnée, vignette générée, les deux envoyées. */
export async function uploadGuestPhoto(file: File, ctx: { inviteSlug?: string }, caption = ''): Promise<GuestPhoto> {
  const p = await processPhoto(file);
  const [url, thumbUrl] = await Promise.all([uploadJpeg(p.full, 'photo', ctx), uploadJpeg(p.thumb, 'thumb', ctx)]);
  return { url, thumbUrl, width: p.width, height: p.height, caption };
}

/** Photo à la une du concerné (responsable/admin) : contrôle des dimensions minimales avant envoi. */
export async function uploadFeaturedPhoto(file: File, ratio: FeaturedRatio) {
  const p = await processFeatured(file, ratio);
  const url = await uploadJpeg(p.full, 'featured');
  return { url, width: p.width, height: p.height };
}
