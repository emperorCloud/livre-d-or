// Traitement des images DANS LE NAVIGATEUR avant envoi : orientation EXIF corrigée, redimensionnement,
// JPEG compressé, vignette. Un souvenir de 8 Mo sort à ~0,4 Mo sans perte visible à l'écran ni en PDF.

export const PHOTO_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 480;
export const FEATURED_MAX_EDGE = 2400;

export type FeaturedRatio = '16:9' | '4:5' | '1:1';

/** Dimensions idéales / minimales de la photo à la une, selon le format choisi par le responsable. */
export const FEATURED_SPECS: Record<FeaturedRatio, { ideal: [number, number]; min: [number, number]; label: string }> = {
  '16:9': { ideal: [2400, 1350], min: [1600, 900], label: 'Paysage 16:9' },
  '4:5': { ideal: [1600, 2000], min: [1080, 1350], label: 'Portrait 4:5' },
  '1:1': { ideal: [1800, 1800], min: [1080, 1080], label: 'Carré 1:1' },
};

export interface ProcessedPhoto { full: Blob; thumb: Blob; width: number; height: number }
export interface ProcessedFeatured { full: Blob; width: number; height: number }

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("Cette photo n'a pas pu être lue (format HEIC non pris en charge ?). Choisissez une photo JPEG ou PNG.");
  }
}

function toJpeg(bmp: ImageBitmap, maxEdge: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Impossible de traiter l'image sur cet appareil.");
  ctx.fillStyle = '#ffffff'; // les PNG transparents deviennent blancs au lieu de noirs
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve({ blob: b, width, height }) : reject(new Error("Échec de la compression de l'image."))), 'image/jpeg', quality)
  );
}

function checkFile(file: File) {
  if (!file.type.startsWith('image/')) throw new Error("Ce fichier n'est pas une image.");
  if (file.size > 40_000_000) throw new Error('Cette photo est trop lourde (40 Mo maximum).');
}

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  checkFile(file);
  const bmp = await decode(file);
  try {
    const full = await toJpeg(bmp, PHOTO_MAX_EDGE, 0.82);
    const thumb = await toJpeg(bmp, THUMB_MAX_EDGE, 0.75);
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height };
  } finally {
    bmp.close();
  }
}

export async function processFeatured(file: File, ratio: FeaturedRatio): Promise<ProcessedFeatured> {
  checkFile(file);
  const bmp = await decode(file);
  try {
    const { min, ideal } = FEATURED_SPECS[ratio];
    if (bmp.width < min[0] || bmp.height < min[1]) {
      throw new Error(
        `Photo trop petite pour le format ${ratio} : ${bmp.width}×${bmp.height} px reçus, minimum ${min[0]}×${min[1]} px ` +
        `(idéal ${ideal[0]}×${ideal[1]} px). Choisissez la photo d'origine plutôt qu'une capture ou une copie WhatsApp.`
      );
    }
    const full = await toJpeg(bmp, FEATURED_MAX_EDGE, 0.85);
    return { full: full.blob, width: full.width, height: full.height };
  } finally {
    bmp.close();
  }
}
