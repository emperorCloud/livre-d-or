# Lot 3 — Accueil agence + SEO, programme de deuil, invitation de mariage

**Aucune migration SQL dans ce lot.** À copier APRÈS les zips « programme de deuil » puis « correctifs mariage » (mêmes chemins ; il écrase certains de leurs fichiers par une version plus récente).

## 1. Accueil de CardEvents : agence d'événementiels
- Nouvelle page d'accueil rose poudré avec fleurs : métier (organiser, embellir, mettre en œuvre sur le terrain, prolonger en numérique), événements, outils numériques, méthode, contact, FAQ. Les textes d'accroche restent pilotés par « Paramètres du site » (admin).
- Nouveaux champs dans « Paramètres du site » : **WhatsApp de l'agence**, **e-mail**, **zone d'intervention** (bouton de contact, référencement local).
- En-tête et pied de page clairs pour le visiteur (l'espace connecté garde l'en-tête sombre).
- **SEO** : 5 pages dédiées `/evenements/<type>` (mariage, deuil-hommage, anniversaire, bapteme-communion, depart-retraite) avec titre, description, canonique, fil d'Ariane, FAQ et données structurées ; données structurées de l'agence (Organization + ProfessionalService + catalogue d'offres + FAQ) ; sitemap ; image d'aperçu rose ; marque et mots-clés mis à jour ; maillage interne (pied de page, « Découvrez aussi »).
- Bibliothèque de fleurs en SVG pur (`components/decor/Flowers.tsx`) : aucune image à héberger.

## 2. Programme de deuil
- **Itinéraires en images** (jusqu'à 6, titre + précisions, réordonnables). Image conseillée **1600×1200 px** (paysage) ou **1200×1600 px** (portrait) ; **minimum 900×600 px** ; JPEG/PNG ≤ 40 Mo ; réduite à 2000 px sur le grand côté. Affichés dans l'onglet Programme (agrandissement + ouverture plein format) et dans le livret imprimable.
- **Faire-part en liste** : un nom par ligne (page publique et livret).
- **Bouton « Livre d'or » retiré** de la page programme.
- **Couleur du fond réglable** par le responsable (onglet Identité) : 6 teintes ou couleur libre (foncée : le texte reste lisible). S'applique à la page publique, au panneau du responsable et à l'aperçu de partage.

## 3. Page d'invitation de mariage
Refonte épurée en rose doux : accueil centré avec portrait en arche, noms en écriture manuscrite, fleurs aux quatre coins, compte à rebours « J-… », onglets sans numérotation, carte « Rien que pour vous » avec la réponse en premier, billet et formulaire de réponse assortis.
