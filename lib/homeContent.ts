// Contenu de la page d'accueil et des pages « événements », partagé par l'affichage ET les données structurées (JSON-LD) :
// Google exige que le balisage corresponde au contenu visible. Aucune donnée de client ici : uniquement l'offre de l'agence.

export const PILLARS = [
  { id: 'organiser', title: 'Organiser', text: "Planification, budget, calendrier, choix et coordination des prestataires : vous gardez le plaisir de l'événement, nous gérons le reste." },
  { id: 'embellir', title: 'Embellir', text: "Décoration, fleurs, scénographie, dressage des tables et ambiance : un décor soigné à la hauteur de l'occasion." },
  { id: 'terrain', title: 'Mettre en œuvre sur le terrain', text: "Le jour J : accueil des invités, protocole, logistique, transport, coordination des équipes. Quelqu'un tient la barre pendant que vous profitez." },
  { id: 'numerique', title: 'Prolonger en numérique', text: "Invitations en ligne, réponses des invités, billets QR, programme et plans d'accès, convois, dons, livre d'or et livre souvenir PDF." },
] as const;

export const STEPS = [
  { title: 'On échange', text: "Vous nous racontez l'événement : l'occasion, le nombre d'invités, le lieu, le budget, vos envies." },
  { title: 'On conçoit', text: "Nous proposons un plan d'organisation, une ambiance de décoration et les outils numériques adaptés." },
  { title: 'On réalise', text: "Nous coordonnons les prestataires, installons le décor et pilotons le déroulé sur le terrain, le jour J." },
  { title: 'On garde les souvenirs', text: "Messages, photos et livre souvenir PDF : l'événement se prolonge bien après la dernière danse ou la dernière prière." },
] as const;

export interface ServicePage {
  slug: string; name: string; metaTitle: string; metaDescription: string;
  kicker: string; h1: string; intro: string;
  organise: string[]; embellish: string[]; terrain: string[]; digital: string[];
  faq: { q: string; a: string }[];
}

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'mariage', name: 'Mariage',
    metaTitle: 'Organisation de mariage : décoration et invitations en ligne',
    metaDescription: "Organisation de mariage de A à Z : planification, décoration florale, coordination le jour J, invitations numériques avec réponse de chaque invité, billets QR et livre d'or.",
    kicker: 'Mariage', h1: 'Un mariage organisé, embelli et vécu sereinement',
    intro: "Du premier rendez-vous au dernier invité, nous organisons votre mariage et nous donnons vie à votre ambiance : fleurs, tables, lumières, accueil. Vos invités reçoivent une invitation en ligne élégante, répondent depuis leur téléphone et gardent un souvenir de la journée.",
    organise: ['Rétroplanning et budget du mariage', 'Sélection et coordination des prestataires (lieu, traiteur, musique, photo)', 'Plan de tables et liste des invités', 'Suivi des réponses et relances'],
    embellish: ['Décoration florale et scénographie', "Mise en place de la salle, de l'arche et des tables", 'Harmonie des couleurs et du dress code', 'Papeterie et signalétique'],
    terrain: ["Coordination complète le jour J", 'Accueil et placement des invités', 'Gestion du timing des cérémonies', 'Logistique : navettes, hébergements, covoiturage'],
    digital: ["Invitation personnelle par invité, avec réponse de chaque personne d'un couple", "Billet QR remis après confirmation et émargement à l'entrée", 'Programme, histoire des mariés, liste de cadeaux et informations pratiques', "Livre d'or en ligne et livre souvenir PDF"],
    faq: [
      { q: "Comment mes invités confirment-ils leur présence ?", a: "Chaque invité reçoit un lien personnel et répond depuis son téléphone. Pour une invitation de couple, chacune des deux personnes indique sa présence ; le billet QR n'est remis qu'après une réponse favorable." },
      { q: "Pouvez-vous gérer le jour J sur place ?", a: "Oui. Nous coordonnons les équipes, l'accueil, le déroulé et la logistique pendant toute la journée, pour que les mariés et leurs familles profitent pleinement." },
    ],
  },
  {
    slug: 'deuil-hommage', name: 'Deuil & hommage',
    metaTitle: "Organisation d'obsèques et hommage : programme en ligne",
    metaDescription: "Accompagnement des familles pour les obsèques et l'hommage : organisation, décoration de recueillement, programme en ligne, plans d'accès, convois en bus, soutien à la famille et livre d'or.",
    kicker: 'Deuil & hommage', h1: "Rendre un hommage digne, avec toute la famille",
    intro: "Dans un moment difficile, nous vous déchargeons de la logistique pour que la famille puisse se recueillir. Programme des obsèques en ligne, plans d'accès, convois, soutien à la famille et livre d'or : tout est clair, partagé en un lien, avec sobriété et respect.",
    organise: ['Calendrier des cérémonies (veillée, levée de corps, messe, inhumation)', 'Coordination des familles et des intervenants', 'Réservation des lieux et des prestataires', 'Budget et suivi des contributions'],
    embellish: ['Décoration de recueillement et dressage de la chapelle ardente', 'Compositions florales', 'Mise en place des lieux de cérémonie et de réception', 'Livrets et supports imprimés'],
    terrain: ["Accueil et placement des proches", 'Coordination des convois vers le village', 'Protocole des cérémonies', 'Logistique de la réception'],
    digital: ["Page de programme en ligne : cérémonies, faire-part, plans d'accès en images", 'Réservation de places dans les convois en bus', "Déclaration des dons et suivi par le responsable", "Livre d'or en ligne et livret imprimable"],
    faq: [
      { q: "Les proches éloignés peuvent-ils suivre le programme ?", a: "Oui. Toute l'information (dates, lieux, plans d'accès, faire-part) est réunie sur une seule page accessible depuis un lien, à partager par message ou réseaux." },
      { q: "Comment fonctionnent les convois en bus ?", a: "La famille crée les bus avec leur capacité et leur tarif. Les proches réservent une place en ligne, joignent leur preuve de paiement, et le responsable confirme chaque réservation." },
    ],
  },
  {
    slug: 'anniversaire', name: 'Anniversaire',
    metaTitle: "Organisation d'anniversaire : décoration et livre d'or",
    metaDescription: "Anniversaire d'enfant, 30, 50 ou 70 ans : organisation, décoration, coordination sur place et livre d'or en ligne avec messages et photos des proches, livre souvenir PDF.",
    kicker: 'Anniversaire', h1: 'Un anniversaire dont on se souvient',
    intro: "Surprise, grande fête ou dîner intime : nous imaginons le thème, installons le décor et coordonnons la journée. Les proches laissent leurs messages et leurs photos dans un livre d'or en ligne, offert ensuite sous forme de livre souvenir PDF.",
    organise: ['Choix du thème, du lieu et du budget', "Liste des invités et coordination des prestataires", 'Planning de la fête et des surprises', 'Organisation de cadeaux collectifs'],
    embellish: ['Décoration thématique, ballons, fleurs et tables', 'Gâteau et buffet mis en scène', 'Coin photo et signalétique', 'Ambiance lumineuse'],
    terrain: ["Installation et démontage", "Accueil des invités", "Gestion du déroulé et des surprises", 'Coordination de l\'animation'],
    digital: ["Livre d'or en ligne avec lien privé et QR code", 'Messages et jusqu\'à 6 photos par proche', 'Modération par le responsable', 'Livre souvenir PDF A4 haute définition'],
    faq: [
      { q: "Faut-il un compte pour laisser un message ?", a: "Non. Les proches ouvrent le lien ou scannent le QR code, écrivent leur message et ajoutent leurs photos en quelques secondes." },
    ],
  },
  {
    slug: 'bapteme-communion', name: 'Baptême & communion',
    metaTitle: 'Organisation de baptême et communion : réception et souvenirs',
    metaDescription: "Baptême, communion, confirmation : organisation de la cérémonie et de la réception, décoration, coordination le jour J et livre d'or en ligne pour garder les messages des invités.",
    kicker: 'Baptême & communion', h1: 'Une fête de famille lumineuse et sans stress',
    intro: "Nous préparons la réception qui suit la célébration : lieu, repas, décor, accueil. Vous vivez la cérémonie avec vos proches, nous veillons au reste, puis les invités laissent un message pour l'enfant dans un livre d'or numérique.",
    organise: ['Planning entre la cérémonie religieuse et la réception', 'Choix du lieu, du traiteur et du gâteau', 'Liste des invités et des places', 'Coordination des familles'],
    embellish: ['Décoration douce et fleurie', 'Tables des invités et table des enfants', 'Dragées, cadeaux et signalétique', 'Espace photo'],
    terrain: ["Accueil à la sortie de l'église", 'Service et déroulé de la réception', 'Gestion des enfants et des invités âgés', 'Rangement'],
    digital: ["Livre d'or en ligne pour les vœux et les photos", "Lien privé et QR code à afficher sur les tables", 'Livre souvenir PDF à offrir à l\'enfant'],
    faq: [
      { q: "Peut-on offrir le livre d'or à l'enfant ?", a: "Oui. Une fois les messages relus, le responsable génère un livre souvenir PDF A4 prêt à être imprimé ou conservé." },
    ],
  },
  {
    slug: 'depart-retraite', name: 'Départ à la retraite',
    metaTitle: "Départ à la retraite : cérémonie, cocktail et livre d'or",
    metaDescription: "Départ à la retraite : organisation de la cérémonie et du cocktail, décoration, coordination sur place et livre d'or en ligne pour réunir les messages des collègues et anciens collègues.",
    kicker: 'Départ à la retraite', h1: 'Saluer une carrière comme elle le mérite',
    intro: "Discours, cocktail, remise de cadeaux : nous organisons une cérémonie à la hauteur d'une carrière. Les équipes et anciens collègues, même éloignés, déposent leurs messages et leurs souvenirs dans un livre d'or en ligne, relié ensuite en livre PDF.",
    organise: ['Programme de la cérémonie et prises de parole', 'Réservation de la salle et du cocktail', "Collecte pour le cadeau d'équipe", 'Invitations des équipes'],
    embellish: ['Décoration sobre et élégante', 'Mise en valeur de la carrière : photos, frise, objets', 'Table du cocktail', 'Signalétique'],
    terrain: ['Accueil des participants', 'Animation de la cérémonie', 'Gestion du temps de parole', 'Remise des cadeaux'],
    digital: ["Livre d'or en ligne, un groupe par service ou par site", "Chaque responsable ne voit que son groupe", 'Photos et messages modérés', 'Livre souvenir PDF A4'],
    faq: [
      { q: "Chaque service peut-il avoir son propre espace ?", a: "Oui. Les groupes sont cloisonnés : chaque responsable gère les messages de son groupe, et l'administrateur voit l'ensemble avant de composer le livre." },
    ],
  },
];

export const serviceBySlug = (slug: string) => SERVICE_PAGES.find((s) => s.slug === slug);

export const faq = (brand: string) => [
  { q: `Qu'est-ce que ${brand} ?`, a: "Une agence d'événementiels qui organise vos cérémonies (mariage, deuil et hommage, anniversaire, baptême, départ à la retraite et autres occasions), les embellit, les met en œuvre sur le terrain et les prolonge en numérique : invitations, programme, billets QR, livre d'or." },
  { q: "Intervenez-vous seulement en ligne ?", a: "Non. Nous intervenons physiquement sur le terrain (décoration, accueil, coordination le jour J, logistique) et numériquement (invitations, réponses des invités, programme, convois, dons, livre d'or)." },
  { q: 'Pour quels types de cérémonies ?', a: "Mariage, deuil et hommage, anniversaire, baptême et communion, départ à la retraite, ainsi que d'autres occasions : écrivez-nous pour en parler." },
  { q: 'Mes invités doivent-ils créer un compte ?', a: "Non. Ils reçoivent un lien personnel ou scannent un QR code : aucun compte, aucun mot de passe." },
  { q: 'Qui peut voir les messages et les informations ?', a: "Les pages d'invitation sont privées et non référencées. Chaque groupe est cloisonné : un responsable ne voit que son groupe, l'administrateur voit l'ensemble." },
  { q: 'Puis-je garder un souvenir de la cérémonie ?', a: "Oui. Les messages et photos des proches sont réunis dans un livre souvenir PDF au format A4, en haute définition, prêt à imprimer." },
];
