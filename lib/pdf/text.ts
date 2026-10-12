// Nettoyage du texte avant composition. Les emoji sont conservés quand le moteur sait les dessiner
// (images Twemoji) ; sinon on les retire proprement au lieu de produire des caractères parasites.

const EMOJI_LIKE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u20E3]/gu;

export function cleanText(input: unknown, keepEmoji: boolean): string {
  let t = typeof input === 'string' ? input : '';
  t = t
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B\u2060\uFEFF]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\u00A0/g, ' ');
  if (!keepEmoji) {
    t = t.replace(EMOJI_LIKE, '').replace(/\u200D/g, '').replace(/[ \t]{2,}/g, ' ');
  }
  return t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function paragraphs(text: string): string[] {
  return text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
}
