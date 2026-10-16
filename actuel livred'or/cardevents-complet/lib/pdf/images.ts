// Chargement des photos pour le PDF (navigateur). Chaque photo est ramenée à la définition utile
// pour sa taille imprimée : jamais d'agrandissement, jamais de fichier démesuré.

export async function fetchImageBlob(url: string): Promise<Blob> {
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (r.ok) return await r.blob();
  } catch { /* CORS : on retente via le relais */ }
  const r2 = await fetch(`/api/img?u=${encodeURIComponent(url)}`);
  if (!r2.ok) throw new Error('image inaccessible');
  return r2.blob();
}

export async function measureBlob(blob: Blob): Promise<{ w: number; h: number }> {
  const b = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const d = { w: b.width, h: b.height };
  b.close();
  return d;
}

export async function renderJpegDataUrl(blob: Blob, targetWidthPx: number, quality: number): Promise<string> {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    const w = Math.max(1, Math.min(bmp.width, targetWidthPx)); // pas d'agrandissement
    const h = Math.max(1, Math.round((bmp.height * w) / bmp.width));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponible');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bmp.close();
  }
}

export async function mapPool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
