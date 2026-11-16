# Lot 4 — Paramètres du site, livret des obsèques, invitation de mariage

**Aucune migration obligatoire.** À copier après les zips précédents (même arborescence).

## 1. Erreur « relation site_settings does not exist »
Cause : la migration `004_site_settings.sql` n'avait pas été exécutée dans Neon (la lecture retombait silencieusement sur les valeurs par défaut, seul l'enregistrement échouait).
Correctif : `lib/settingsDb.ts` crée la table automatiquement au premier enregistrement. Vous pouvez aussi simplement exécuter `004_site_settings.sql`.

## 2. Livret des obsèques (PDF)
`lib/funeral/booklet.ts` remplace l'ancien livret : **2 feuilles A4 paysage, chacune coupée en deux** (format de vos programmes) :
- Feuille 1 : plans de localisation (vos images d'itinéraires) | couverture (portrait ovale doré, nom, dates, verset/épitaphe), bande centrale façon tissu traditionnel.
- Feuille 2 : faire-part (une personne par ligne, 2 colonnes automatiques si la liste est longue) | programme par jour, QR code de la page en ligne.
- Le texte s'ajuste tout seul pour tenir sur la page (réduit si long, agrandi si court). Sans plans, le panneau devient « Hommage » ; sans photo, des initiales dans le médaillon.
- Les couleurs des titres suivent la couleur choisie par le responsable.
- Dans la fenêtre d'impression : format A4, **orientation paysage**, marges **aucune**, puis « Enregistrer au format PDF ».

## 3. Invitation de mariage
- **Musique automatique** : écran d'ouverture « Ouvrir mon invitation » (le toucher débloque le son : démarrage garanti sur téléphone) ; le lancement direct est aussi tenté dès l'arrivée. La musique choisie par les mariés (morceau ou fichier envoyé) n'était jamais appliquée côté invité : corrigé. Le bouton affiche désormais l'état réel (plus de « Pause » trompeur quand le navigateur bloque le son).
- Photo des mariés plein cadre en haut, fondue dans le rose, avec les fleurs ; compte à rebours en direct (jours, heures, minutes, secondes).
- En-tête allégé : noms des mariés en écriture manuscrite, annonces, discussions ; onglets en pastilles qui ne se coupent plus (le cadre noir/texte tronqué est corrigé).
- Barre fixe en bas : nom de l'invité, « Répondre » (puis « Ma réponse »), « Mon billet · QR » (verrouillé avant confirmation).
- Pastille musique compacte, placée au-dessus de la barre pour ne plus cacher le contenu.
