export type CardStyle = 'polaroid' | 'parchment' | 'gold' | 'sticky' | 'modern' | 'typewriter';

export type RelationshipType =
  | 'Collègue'
  | 'Ami'
  | 'Direction'
  | 'Membre de l\'équipe'
  | 'Ancien collègue'
  | 'Partenaire'
  | 'Famille'
  | 'Autre'
  | (string & {}); // v2 : texte libre accepté ("Ami d'enfance", "Cousin"…)

export interface GuestPhoto {
  id?: string;
  url: string;
  thumbUrl?: string; // vignette 480 px (pages web rapides)
  width?: number;    // dimensions de l'image stockée (mise en page PDF sans re-téléchargement)
  height?: number;
  caption?: string;
}

export interface GuestEntry {
  id: string;
  groupId?: string;
  token: string;
  firstName: string;
  lastName: string;
  email?: string;
  relationship: RelationshipType;
  yearsKnown?: string;
  message: string;
  anecdote?: string;
  wish?: string;
  photoUrl?: string;
  photoCaption?: string;
  photos?: GuestPhoto[];
  cardStyle: CardStyle;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isPinned: boolean;
  isApproved: boolean;
  reactions: Record<string, number>;
}

export interface AdminStats {
  totalEntries: number;
  totalPhotos: number;
  totalLikes: number;
  relationshipsCount: Record<string, number>;
}

export interface EntryFormData {
  firstName: string;
  lastName: string;
  email?: string;
  relationship: RelationshipType;
  yearsKnown?: string;
  message: string;
  anecdote?: string;
  wish?: string;
  photoUrl?: string;
  photoCaption?: string;
  photos?: GuestPhoto[];
  cardStyle: CardStyle;
}

export function getEntryPhotos(entry?: {
  photos?: GuestPhoto[];
  photoUrl?: string;
  photoCaption?: string;
} | null): GuestPhoto[] {
  if (!entry) return [];
  if (entry.photos && entry.photos.length > 0) {
    return entry.photos.filter((p) => Boolean(p && p.url && p.url.trim() !== ''));
  }
  if (entry.photoUrl && entry.photoUrl.trim() !== '') {
    return [{ id: 'legacy-photo-0', url: entry.photoUrl, caption: entry.photoCaption || '' }];
  }
  return [];
}


// ===== v2 : cérémonies, groupes, rôles =====
export type CeremonyType = 'deuil' | 'mariage' | 'anniversaire' | 'retraite';
export type FontStyle = 'cormorant' | 'cinzel' | 'lora';
export type PaperTexture = 'ivory' | 'parchment' | 'alabaster' | 'linen' | 'noir';
export type CeremonySymbol = 'candle' | 'lily' | 'ring' | 'heart' | 'champagne' | 'pen' | 'quill' | 'star';

export interface ThemeConfig {
  fontStyle: FontStyle;
  paperTexture: PaperTexture;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  coverImage: string;
  coverQuote: string;
  coverQuoteAuthor?: string;
  footerText?: string; // pied de page de la page invité de cette cérémonie (géré par l'admin)
  symbol: CeremonySymbol;
  borderStyle: 'classic' | 'minimal' | 'ornate' | 'modern';
}

export interface Ceremony {
  id: string;
  type: CeremonyType;
  title: string;
  subtitle: string;
  honoreeName: string;
  date: string;
  location: string;
  theme: ThemeConfig;
  createdAt: string;
}

/** Vue complète (admin / responsable du groupe). Jamais le secret ni son hash. */
export interface Group {
  id: string;
  ceremonyId: string;
  name: string;
  managerName: string;
  managerEmail: string;
  inviteSlug: string;
  hasManagerCode: boolean;
  customIntro: string;
  customPrompt: string;
  themeOverrides: Partial<ThemeConfig>;
  allowPhotos: boolean;
  isClosed: boolean;
  featuredPhotoUrl: string;
  featuredPhotoAspectRatio: '16:9' | '4:5' | '1:1';
  featuredFocalX: number; // point focal 0..1 : centre du recadrage mobile/bureau
  featuredFocalY: number;
  featuredWidth: number | null;
  featuredHeight: number | null;
}

/** Vue publique renvoyée à un invité via /api/invite/[slug] (aucune donnée de gestion). */
export interface PublicInvite {
  slug: string;
  groupName: string;
  customIntro: string;
  customPrompt: string;
  allowPhotos: boolean;
  isClosed: boolean;
  featuredPhotoUrl: string;
  featuredPhotoAspectRatio: '16:9' | '4:5' | '1:1';
  featuredFocalX: number;
  featuredFocalY: number;
  ceremony: Pick<Ceremony, 'type' | 'title' | 'subtitle' | 'honoreeName' | 'date' | 'location'>;
  theme: ThemeConfig;
}

export type AuthRole = 'none' | 'admin' | 'manager';
export interface SessionInfo {
  role: AuthRole;
  groupId?: string;
  isAdmin: boolean; // compat. ancienne UI
}
