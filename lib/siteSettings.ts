import { BRAND } from './brand';

// Paramètres du site (type + valeurs par défaut GÉNÉRIQUES, sans aucun nom propre). Modifiables par l'administrateur.
export interface SiteSettings {
  brandName: string;       // nom affiché dans l'en-tête
  brandTagline: string;    // sous-titre de l'en-tête (visiteur non connecté)
  welcomeKicker: string;   // petit texte au-dessus du titre d'accueil
  welcomeTitle: string;
  welcomeText: string;
  loginLabel: string;      // libellé du bouton de connexion
  footerLeft: string;
  footerRight: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: BRAND.name,
  brandTagline: BRAND.tagline,
  welcomeKicker: "Plateforme de livres d'or cérémoniels",
  welcomeTitle: "Un livre d'or en ligne pour chaque cérémonie : messages, photos et livre PDF d'art",
  welcomeText:
    "Deuil, mariage, anniversaire ou départ à la retraite : invitez vos proches à déposer un message et des photos depuis un simple lien ou un QR code, puis téléchargez un livre commémoratif en haute définition.",
  loginLabel: 'Connexion',
  footerLeft: `${BRAND.name} — ${BRAND.tagline}`,
  footerRight: 'Photos souvenirs · Livre PDF A4 haute définition',
};

const LIMITS: Record<keyof SiteSettings, number> = {
  brandName: 60, brandTagline: 120, welcomeKicker: 80, welcomeTitle: 160, welcomeText: 600,
  loginLabel: 40, footerLeft: 160, footerRight: 160,
};

/** Fusionne des valeurs saisies sur les défauts, en bornant la longueur. Un champ vide retombe sur le défaut. */
export function mergeSettings(raw: unknown): SiteSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(LIMITS) as (keyof SiteSettings)[]) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, LIMITS[k]);
    }
  }
  return out;
}
