// Contenu de la page d'accueil, partagé par l'affichage (Welcome) ET les données structurées (JSON-LD FAQ) :
// Google exige que le balisage corresponde au contenu visible.
export const faq = (brand: string) => [
  { q: `Qu'est-ce que ${brand} ?`, a: "Une plateforme de livres d'or en ligne pour les cérémonies : deuil, mariage, anniversaire, retraite. Les proches laissent un message et des photos depuis un simple lien ou un QR code, puis le responsable génère un livre PDF." },
  { q: 'Mes invités doivent-ils créer un compte ?', a: "Non. Ils ouvrent le lien ou scannent le QR code, écrivent leur message, ajoutent jusqu'à 6 photos et envoient. Ils peuvent ensuite modifier ou supprimer leur message depuis le même appareil." },
  { q: 'Qui peut voir les messages ?', a: "Les pages d'invitation ne sont pas référencées par les moteurs de recherche et chaque groupe est cloisonné : un responsable ne voit que les messages de son groupe. L'administrateur voit l'ensemble." },
  { q: 'Puis-je retirer un message du livre ?', a: "Oui. Le responsable peut masquer, épingler ou supprimer n'importe quel message avant de générer le livre PDF." },
  { q: 'Dans quel format est le livre ?', a: "Un PDF au format A4, haute définition, avec couverture, messages et photos mis en page, prêt à être imprimé ou conservé." },
];

export const steps = [
  { title: 'Créez la cérémonie', text: "Choisissez le type de cérémonie, ajoutez la photo du concerné et créez un ou plusieurs groupes (famille, amis, collègues…)." },
  { title: 'Partagez le lien ou le QR code', text: "Chaque groupe a son lien privé et son QR code à afficher ou à envoyer. Aucun compte à créer pour les invités." },
  { title: 'Modérez puis générez le livre', text: "Relisez les messages, masquez ou épinglez, puis téléchargez le livre PDF A4 haute définition." },
];
