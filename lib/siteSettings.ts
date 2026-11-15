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
  contactWhatsapp: string; // numéro international, chiffres uniquement (ex. 237600000000) : bouton « Nous écrire sur WhatsApp »
  contactEmail: string;
  serviceArea: string;     // zone d'intervention affichée et référencée (ex. « Douala et tout le Cameroun »)
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: BRAND.name,
  brandTagline: BRAND.tagline,
  welcomeKicker: "Agence d'événementiels",
  welcomeTitle: "Vos cérémonies, organisées, embellies et vécues pleinement",
  welcomeText:
    "Mariage, deuil et hommage, anniversaire, baptême, retraite : nous organisons, décorons et coordonnons votre événement sur le terrain, puis le prolongeons en numérique avec invitations, programme, billets QR et livre d'or.",
  loginLabel: 'Connexion',
  footerLeft: `${BRAND.name} — ${BRAND.tagline}`,
  footerRight: 'Organisation · Décoration · Coordination · Invitations & livre d\'or en ligne',
  contactWhatsapp: '', contactEmail: '', serviceArea: '',
};

const LIMITS: Record<keyof SiteSettings, number> = {
  brandName: 60, brandTagline: 120, welcomeKicker: 80, welcomeTitle: 160, welcomeText: 600,
  loginLabel: 40, footerLeft: 160, footerRight: 160, contactWhatsapp: 20, contactEmail: 120, serviceArea: 120,
};

/** Fusionne des valeurs saisies sur les défauts, en bornant la longueur. Un champ vide retombe sur le défaut. */
export function mergeSettings(raw: unknown): SiteSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(LIMITS) as (keyof SiteSettings)[]) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v !== 'string') continue;
      const t = v.trim();
      if (k === 'contactWhatsapp') out[k] = t.replace(/[^0-9]/g, '').slice(0, LIMITS[k]);   // chiffres seulement : sert à fabriquer le lien wa.me
      else if (k === 'contactEmail') out[k] = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t.slice(0, LIMITS[k]) : '';
      else if (t) out[k] = t.slice(0, LIMITS[k]);
    }
  }
  return out;
}
