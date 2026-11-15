// Types du programme de deuil. Aucune dépendance Node : utilisable côté navigateur comme côté serveur.

export type EventCategory = 'veillee' | 'levee_corps' | 'messe' | 'convoi' | 'inhumation' | 'reception' | 'coutume' | 'autre';

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'veillee', label: 'Veillée' },
  { value: 'levee_corps', label: 'Levée de corps' },
  { value: 'messe', label: 'Messe / culte' },
  { value: 'convoi', label: 'Convoi' },
  { value: 'inhumation', label: 'Inhumation' },
  { value: 'reception', label: 'Réception' },
  { value: 'coutume', label: 'Rite coutumier' },
  { value: 'autre', label: 'Autre' },
];

export interface PayMethod { label: string; accountNumber: string; accountName: string; instructions: string }

export interface FuneralEvent {
  id: string; title: string; category: EventCategory;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm ou ''
  locationName: string; locationAddress: string; mapUrl: string;
  description: string; leader: string; dressCode: string; isKey: boolean;
}

export interface FairePartGroup { id: string; title: string; members: string[] }

/** Rappel / alerte affiché en bandeau sur la page publique à partir de `showFrom` (vide = tout de suite). */
export interface Notice { id: string; title: string; message: string; showFrom: string; active: boolean }

export interface FuneralProfile {
  titles: string; birthDate: string; deathDate: string; hometown: string; residenceCity: string;
  photoUrl: string; epitaph: string; biography: string; familyMessage: string; dressCodeAdvice: string;
  currency: string; contactPhone: string; contactEmail: string;
  donationsOpen: boolean; donationMethods: PayMethod[];
  /** Autorise Google à référencer la page publique du programme (sitemap + indexation). */
  searchIndexing: boolean;
}

export interface FuneralConfig {
  profile: FuneralProfile;
  fairePart: { header: string; footer: string; groups: FairePartGroup[] };
  events: FuneralEvent[];
  notices: Notice[];
}

export interface Bus {
  id: string; name: string; plate: string; capacity: number;
  departureLocation: string; departureAt: string; // YYYY-MM-DDTHH:mm ou ''
  destination: string; driverName: string; driverPhone: string; captainName: string; captainPhone: string;
  notes: string; fare: number; // 0 = gratuit
  paymentMethods: PayMethod[]; reservationsOpen: boolean;
}
/** Ce que voit le public : places prises, jamais les noms des passagers ni le téléphone du chauffeur. */
export type PublicBus = Omit<Bus, 'driverPhone'> & { taken: number };

export type Status = 'pending' | 'confirmed' | 'rejected';

export interface Reservation {
  id: string; busId: string; orderNumber: number; passengerName: string; passengerPhone: string;
  category: string; paymentMethod: string; proofUrl: string; status: Status; notes: string; createdAt: string;
}

export type DonationMethod = 'mobile_money' | 'cash' | 'transfer' | 'cheque' | 'autre';
export const DONATION_METHODS: { value: DonationMethod; label: string }[] = [
  { value: 'mobile_money', label: 'Mobile Money (Orange / MTN)' },
  { value: 'cash', label: 'Espèces' },
  { value: 'transfer', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'autre', label: 'Autre' },
];

export interface Donation {
  id: string; receiptNumber: string; donorName: string; donorPhone: string; category: string; amount: number;
  paymentMethod: DonationMethod; paymentReference: string; date: string; isAnonymous: boolean;
  purpose: string; blessing: string; status: Status; createdAt: string;
}

/** Données publiques de la page /p/<slug>. */
export interface PublicProgramme {
  slug: string; hasBook: boolean;
  ceremony: { title: string; subtitle: string; honoreeName: string; date: string; location: string };
  config: FuneralConfig;
  buses: PublicBus[];
  donations: { total: number; count: number; donors: string[] };
}

/** Tout ce que voit le responsable. */
export interface FuneralState { config: FuneralConfig; buses: Bus[]; reservations: Reservation[]; donations: Donation[] }

export const receiptLabel = (seq: number) => `REC-${String(seq).padStart(4, '0')}`;
export const fmtMoney = (n: number, currency: string) => `${new Intl.NumberFormat('fr-FR').format(n)} ${currency || 'FCFA'}`;
