// Couche de stockage des photos. Le reste du code ne connaît que ces fonctions : changer de fournisseur
// = changer STORAGE_DRIVER (+ variables R2_*) puis exécuter scripts/migrate-storage.mts. Aucun autre code à toucher.

export type StorageDriver = 'blob' | 'r2';

export const MAX_PHOTOS_PER_ENTRY = 6;
export const UPLOAD_MAX_BYTES = 2_500_000; // image déjà redimensionnée par le navigateur (~0,3–1 Mo)
export const UPLOAD_CONTENT_TYPE = 'image/jpeg';
export const UPLOAD_PATH = /^(photos|thumbs|featured|proofs)\/[A-Za-z0-9_-]{8,64}\.jpg$/;

// Musique de l'invitation de mariage : un morceau envoyé par les mariés (réservé aux comptes connectés).
export const AUDIO_MAX_BYTES = 12_000_000;
export const AUDIO_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', wav: 'audio/wav' };
export const AUDIO_PATH = /^audio\/[A-Za-z0-9_-]{8,64}\.(mp3|m4a|aac|ogg|wav)$/;

export function activeDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === 'r2' ? 'r2' : 'blob';
}

/** Vrai si l'URL appartient à NOTRE stockage (Blob, ou R2 si R2_PUBLIC_URL est défini). */
export function isOwnedStorageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    if (u.hostname.endsWith('.public.blob.vercel-storage.com')) {
      // Si BLOB_PUBLIC_HOST est défini, seul VOTRE store est accepté (pas celui d'un tiers).
      const pinned = process.env.BLOB_PUBLIC_HOST?.trim().toLowerCase();
      return !pinned || u.hostname === pinned;
    }
    const r2 = process.env.R2_PUBLIC_URL;
    return !!r2 && u.hostname === new URL(r2).hostname;
  } catch {
    return false;
  }
}
