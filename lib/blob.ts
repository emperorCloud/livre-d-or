import { put } from '@vercel/blob';

/**
 * Décode une image envoyée en base64 (data URL, déjà redimensionnée côté
 * client dans GuestDashboardModal) et l'upload sur Vercel Blob.
 * Retourne l'URL publique (servie par le CDN Vercel Blob).
 */
export async function uploadImageToBlob(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format image invalide (data URL attendue).');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const filename = `guestbook/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
  });

  return blob.url;
}
