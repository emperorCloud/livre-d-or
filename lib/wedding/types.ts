// Modèle du gestionnaire d'invitations (repris du projet modèle, avec catégories et événements configurables).
export type RsvpStatus = 'confirmed' | 'declined' | 'pending';

export type DietaryOption = 'classic' | 'vegetarian' | 'halal' | 'kosher' | 'gluten_free' | 'other';

export interface TimelineEventItem {
  id: string;
  order: string; // "01", "02", etc.
  title: string;
  dateStr: string; // "jeudi 17 décembre", "samedi 19 décembre"
  time: string; // "18:00", "09:00"
  locationName: string;
  locationDetails: string;
  city: string;
  mapsUrl: string;
}

export interface GiftPaymentOption {
  id: string;
  type: 'orange_money' | 'momo' | 'sumup' | 'paypal' | 'rib' | 'registry';
  beneficiaryName: string;
  numberOrLink: string;
  badgeText: string;
  note: string;
  suggestedAmount?: string;
}

export interface UsefulContact {
  id: string;
  role: string;
  name: string;
  phone: string;
}

export interface StoryPhotoItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface TableItem {
  id: string;
  name: string;
  capacity: number;
  description?: string;
}

export interface DressCodeColor {
  id: string;
  name: string;
  hex: string;
}

export interface Guest {
  id: string;
  qrCodeToken: string; // contenu du QR du billet (code d'émargement)
  inviteToken?: string; // jeton du lien personnel : fourni au responsable uniquement, jamais aux autres invités
  greetingTitle?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  tableNumber: string;
  category: string; // libre : famille, amis, collègues…
  rsvpStatus: RsvpStatus; // réponse de l'invitation (agrégat des personnes) : voir rsvp.ts
  guestRsvp: RsvpStatus; // 1re personne
  partnerRsvp: RsvpStatus; // 2e personne (invitation couple uniquement)
  plusOneAllowed: boolean; // true = invitation couple (deux personnes répondent chacune)
  plusOneConfirmed: boolean;
  plusOneName?: string;
  childrenCount: number;
  dietaryPreference: DietaryOption;
  allergies?: string;
  personalNote?: string;
  partnerNote?: string;
  // Présence par événement du programme : { idÉvénement: true/false }
  attendingEvents: Record<string, boolean>;

  // Representative request if guest cannot come
  representativeRequest?: {
    hasRequested: boolean;
    name?: string;
    contact?: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
  };

  isCheckedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  notes?: string;
  lastUpdated: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'important' | 'urgent';
  createdAt: string;
  author: string;
  target: 'all' | 'confirmed_only';
}

export interface ChatMessage {
  id: string;
  channelId: 'general' | 'covoiturage' | 'logement' | 'temoins';
  senderName: string;
  senderRole: 'Marie(e)' | 'Temoin' | 'Invite' | 'Organisateur';
  content: string;
  createdAt: string;
}

export interface PhysicalGiftPledge {
  id: string;
  guestName: string;
  guestContact?: string;
  quantity: number;
  message?: string;
  createdAt: string;
}

export interface PhysicalGiftItem {
  id: string;
  title: string;
  name?: string;
  description?: string;
  category: 'Cuisine' | 'Électroménager' | 'Maison & Déco' | 'Vaisselle' | 'Autre' | string;
  brandReference?: string;
  colorOrFinish?: string;
  whereToFind?: string;
  externalUrl?: string;
  estimatedPrice?: string;
  imageUrl?: string;
  desiredQuantity: number;
  reservedQuantity: number;
  pledges?: PhysicalGiftPledge[];
}

export interface WeddingConfig {
  coupleNames: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  mapsUrl: string;
  heroImageUrl: string;
  /** true = l'image du héro REMPLACE tout l'en-tête par défaut (noms, date, citation, fleurs) ; elle s'affiche seule. */
  heroImageOnly: boolean;
  ticketImageUrl: string;
  brideImageUrl: string;
  dressCode: string;
  dressCodeColors: DressCodeColor[];
  storyQuote: string;
  storyTitle: string;
  storyText: string;
  storyPhotos: StoryPhotoItem[];
  timelineEvents: TimelineEventItem[];
  giftOptions: GiftPaymentOption[];
  physicalGifts?: PhysicalGiftItem[];
  usefulContacts: UsefulContact[];
  tablesList: TableItem[];
  musicTrack: 'canon' | 'celeste' | 'valse' | 'ambient_harp' | 'custom' | 'uploaded';
  musicTitle?: string;
  customMusicUrl?: string;
  contactPhone: string;
  contactEmail: string;

  // Customization of colors & appearance for both spaces
  guestHeaderBgColor?: string;
  guestAccentColor?: string;
  guestHeroOverlayStyle?: 'soft' | 'dark' | 'transparent';
  responsableThemeColor?: string;
  loadingScreenTitle?: string;
  loadingScreenSubtitle?: string;
}

export interface WeddingStoreState {
  config: WeddingConfig;
  guests: Guest[];
  announcements: Announcement[];
  messages: ChatMessage[];
}

export type WebSocketEvent =
  | { type: 'INIT_STATE'; payload: WeddingStoreState }
  | { type: 'GUEST_UPDATED'; payload: Guest }
  | { type: 'GUEST_CHECKED_IN'; payload: { guestId: string; checkedInAt: string; checkedInBy: string } }
  | { type: 'GUEST_ADDED'; payload: Guest }
  | { type: 'GUEST_DELETED'; payload: { guestId: string } }
  | { type: 'ANNOUNCEMENT_ADDED'; payload: Announcement }
  | { type: 'MESSAGE_ADDED'; payload: ChatMessage }
  | { type: 'CONFIG_UPDATED'; payload: WeddingConfig }
  | { type: 'PHYSICAL_GIFT_PLEDGED'; payload: { giftId: string; pledge: PhysicalGiftPledge; item: PhysicalGiftItem } };

