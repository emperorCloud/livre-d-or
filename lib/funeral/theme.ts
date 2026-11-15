// Couleur de fond du programme, réglable par le responsable. Pur : navigateur et serveur.
// Une seule couleur de base (sombre) suffit : tout le reste (dégradé, cartes, teintes du texte et des boutons) en est dérivé,
// de sorte que la lisibilité reste garantie quelle que soit la couleur choisie.

export const DEFAULT_PAGE_COLOR = '#22103F';
export const PAGE_COLORS: { name: string; hex: string }[] = [
  { name: 'Violet nuit', hex: '#22103F' }, { name: 'Bordeaux', hex: '#3B0F1E' }, { name: 'Bleu nuit', hex: '#0F2147' },
  { name: 'Vert forêt', hex: '#0F2E22' }, { name: 'Brun profond', hex: '#2E1B12' }, { name: 'Anthracite', hex: '#1F2328' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
function rgb(hex: string): [number, number, number] { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]; }

/** Luminance relative (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Couleur acceptée : au format #RRGGBB ET assez sombre pour que le texte clair reste lisible. */
export const isValidPageColor = (v: unknown): v is string => typeof v === 'string' && HEX.test(v) && luminance(v) <= 0.14;
export const normalizePageColor = (v: unknown): string => (isValidPageColor(v) ? v.toUpperCase() : DEFAULT_PAGE_COLOR);

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

/** Variables CSS à poser sur le conteneur de la page : fond, surface des fenêtres et teintes qui remplacent la palette « violet ». */
export function pageThemeVars(color: string): Record<string, string> {
  const hex = normalizePageColor(color);
  const [h, s, l] = toHsl(hex);
  const tint = Math.min(Math.max(s, 0.3), 0.55); // teinte du texte : même famille de couleur, jamais criarde
  return {
    '--pg-from': hsl(h, s, Math.max(l * 0.78, 0.03)),
    '--pg-via': hex,
    '--pg-to': hsl(h, s, Math.max(l * 0.5, 0.02)),
    '--pg-surface': hsl(h, s, Math.max(l * 0.82, 0.04)),
    '--color-violet-50': hsl(h, tint, 0.97), '--color-violet-100': hsl(h, tint, 0.93), '--color-violet-200': hsl(h, tint, 0.86),
    '--color-violet-300': hsl(h, tint, 0.76), '--color-violet-950': hsl(h, Math.min(s, 0.6), 0.1),
  };
}
