// Seul endroit du code où vit l'identité de la plateforme. Aucun nom de personne ni de cérémonie ici :
// les cérémonies, groupes et textes sont des DONNÉES (base Postgres), modifiables par l'administrateur.
// Le nom et les textes ci-dessous ne sont que des valeurs par défaut (écrasées par « Paramètres du site »).
export const BRAND = {
  name: 'CardEvents',
  tagline: "Livres d'or & registres cérémoniels",
  description:
    "Créez un livre d'or en ligne pour un deuil, un mariage, un anniversaire ou un départ à la retraite : lien privé et QR code, messages et photos des proches, livre PDF A4 haute définition.",
  keywords: [
    "livre d'or en ligne", "livre d'or numérique", 'livre d’or cérémonie', 'hommage en ligne', 'livre d’or mariage',
    'livre d’or deuil', 'livre d’or anniversaire', 'livre d’or départ retraite', 'QR code livre d’or', 'livre photo PDF',
  ],
  themeColor: '#1c1917',
} as const;

/** Initiales du badge d'en-tête / du favicon : « CardEvents » → « CE », « Livre d'Or » → « LO ». */
export function brandInitials(name: string): string {
  const words = name.replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2').split(/[\s'’-]+/).filter(Boolean);
  const letters = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] || '').slice(0, 2);
  return letters.slice(0, 2).toUpperCase() || 'CE';
}

export const BRAND_INITIALS = brandInitials(BRAND.name);
