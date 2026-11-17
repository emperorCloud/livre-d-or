import type { GuestPhoto } from '@/lib/types';
import { processItinerary, processPhoto, processFeatured, type FeaturedRatio } from './images';

type Kind = 'photo' | 'thumb' | 'featured' | 'proof';
const FOLDER: Record<Kind, string> = { photo: 'photos', thumb: 'thumbs', featured: 'featured', proof: 'proofs' };

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

/** Image du contenu de l'invitation (photos de l'histoire, cadeaux, couverture…) : réduite dans le navigateur, sans contrainte de format. */
export async function uploadConfigImage(file: File): Promise<string> {
  const p = await processPhoto(file);
  return uploadJpeg(p.full, 'featured'); // réservé aux sessions responsable / admin côté serveur
}

/** Preuve de paiement d'un convoi (capture d'écran ou photo du reçu) : réduite en JPEG dans le navigateur. Les PDF ne sont pas acceptés. */
export async function uploadProofImage(file: File, inviteSlug: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Envoyez une capture ou une photo (JPEG, PNG…). Les PDF ne sont pas acceptés.');
  const p = await processPhoto(file);
  return uploadJpeg(p.full, 'proof', { inviteSlug });
}

/** Itinéraire / plan d'accès du programme de deuil (session responsable ou admin requise côté serveur). */
export async function uploadItineraryImage(file: File): Promise<string> {
  const p = await processItinerary(file);
  return uploadJpeg(p.full, 'featured');
}

const AUDIO_EXT: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', wav: 'audio/wav' };
const AUDIO_MIME_TO_EXT: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav' };
export const AUDIO_MAX_MB = 12;

/** Envoie la musique de l'invitation (MP3, M4A, AAC, OGG ou WAV, 12 Mo maximum) et renvoie son lien public. */
export async function uploadWeddingAudio(file: File): Promise<string> {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? '';
  const ext = AUDIO_MIME_TO_EXT[file.type] ?? (AUDIO_EXT[fromName] ? fromName : '');
  if (!ext) throw new Error('Format non pris en charge. Envoyez un fichier MP3, M4A, AAC, OGG ou WAV.');
  if (file.size > AUDIO_MAX_MB * 1_000_000) throw new Error(`Fichier trop lourd (${(file.size / 1_000_000).toFixed(1)} Mo). Maximum ${AUDIO_MAX_MB} Mo : compressez le morceau en MP3 (128 kb/s suffit).`);
  const contentType = AUDIO_EXT[ext];
  const { driver } = await getUploadConfig();
  return withRetry(async () => {
    if (driver === 'r2') {
      const sign = await fetch('/api/upload/r2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'audio', contentType }) });
      const data = await sign.json();
      if (!sign.ok) throw new Error(data.error || 'Téléversement refusé.');
      const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      if (!put.ok) throw new Error("Échec de l'envoi du fichier audio.");
      return data.publicUrl as string;
    }
    const { upload } = await import('@vercel/blob/client');
    const res = await upload(`audio/${crypto.randomUUID()}.${ext}`, file, { access: 'public', handleUploadUrl: '/api/upload/blob', contentType, multipart: file.size > 5_000_000 });
    return res.url;
  });
}
