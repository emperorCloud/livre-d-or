// Seul endroit du code où vit l'identité de la plateforme. Aucun nom de personne ni de cérémonie ici :
// les cérémonies, groupes et textes sont des DONNÉES (base Postgres), modifiables par l'administrateur.
// Le nom et les textes ci-dessous ne sont que des valeurs par défaut (écrasées par « Paramètres du site »).
export const BRAND = {
  name: 'CardEvents',
  tagline: "Agence d'événementiels : organisation, décoration et mise en œuvre",
  description:
    "Agence d'événementiels : nous organisons, embellissons et mettons en œuvre vos cérémonies sur le terrain et en numérique : mariage, deuil et hommage, anniversaire, baptême, départ à la retraite. Invitations en ligne, programme, billets QR et livre d'or.",
  keywords: [
    'agence événementielle', "organisation d'événements", 'organisation de mariage', 'organisation de deuil', "organisation d'obsèques", 'hommage en ligne',
    "organisation d'anniversaire", 'décoration événementielle', 'décoration florale mariage', 'coordination jour J', 'invitation numérique', 'faire-part en ligne',
    'programme des obsèques en ligne', "livre d'or en ligne", 'livre souvenir PDF', 'billet QR invité', 'wedding planner',
  ],
  themeColor: '#C65E7E',
} as const;

/** Initiales du badge d'en-tête / du favicon : « CardEvents » → « CE », « Livre d'Or » → « LO ». */
export function brandInitials(name: string): string {
  const words = name.replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2').split(/[\s'’-]+/).filter(Boolean);
  const letters = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] || '').slice(0, 2);
  return letters.slice(0, 2).toUpperCase() || 'CE';
}

export const BRAND_INITIALS = brandInitials(BRAND.name);
