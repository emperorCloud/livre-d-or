// URL publique du site (serveur uniquement). Priorité : NEXT_PUBLIC_SITE_URL (domaine personnalisé),
// puis l'URL de production Vercel, puis l'URL du déploiement, puis localhost.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const raw = explicit || (vercel ? `https://${vercel}` : 'http://localhost:3000');
  return raw.replace(/\/+$/, '');
}

/** Description ≤ 160 caractères, coupée proprement. */
export function trimDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '') + '…';
}
