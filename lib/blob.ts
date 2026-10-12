import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

// Seuls JPEG / PNG / WebP sont acceptés (pas de SVG : risque XSS). Les octets
// d'en-tête sont vérifiés : le type MIME déclaré par le client ne suffit pas.
const MAX_DATAURL_CHARS = 4_400_000; // ~3,2 Mo d'image ; la limite Vercel d'une requête est de 4,5 Mo
const MAX_BYTES = 3_300_000;

function sniff(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export async function uploadImageToBlob(dataUrl: string): Promise<string> {
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_DATAURL_CHARS) throw new Error('Image trop volumineuse.');
  const match = dataUrl.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Format image invalide (JPEG, PNG ou WebP attendu).');
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > MAX_BYTES) throw new Error('Image trop volumineuse.');
  const kind = sniff(buffer);
  if (!kind) throw new Error("Le contenu du fichier n'est pas une image valide.");

  const blob = await put(`guestbook/${randomUUID()}.${kind === 'jpeg' ? 'jpg' : kind}`, buffer, {
    access: 'public',
    contentType: `image/${kind}`,
  });
  return blob.url;
}
