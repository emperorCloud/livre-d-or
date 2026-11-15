# Livre d'or v2 — Phase 1 (socle serveur)

Phase 1 = modèle de données (cérémonies → groupes → témoignages), 3 rôles
(invité / responsable / admin), API sécurisée. **L'ancienne interface continue de
fonctionner** (repli temporaire sur un groupe « historique », voir `TRANSITION`
dans `app/api/upload` et `app/api/entries`). La phase 2 portera l'interface.

## Avant de déployer
1. **Neon** : changer le mot de passe du rôle `neondb_owner`, puis mettre à jour `POSTGRES_URL` dans Vercel.
2. **Vercel** : remplacer `ADMIN_PASSCODE` par une vraie phrase de passe. Les autres variables ne changent pas
   (`POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `SESSION_SECRET`) : **aucune nouvelle variable**.
3. **Neon → SQL Editor** : exécuter `lib/migrations/002_ceremonies_groups.sql` (additif, rejouable,
   rattache tes témoignages existants à une cérémonie et un groupe neutres que tu renommeras depuis l'administration).
4. Pousser le code et déployer.

## Vérifications après déploiement
- Le site actuel affiche et enregistre toujours des témoignages.
- Connexion admin (la session précédente est invalidée : reconnecte-toi).
- Bouton « Nouveau code responsable » (clé) d'un groupe → code affiché une seule fois.
- `POST /api/manager/login {"code":"XXXXXX-XXXXXXXXXX"}` → session responsable, limitée à son groupe.
- `GET /api/invite/<inviteSlug>` → données publiques du groupe (aucun e-mail ni code).

## Nouveautés d'API
| Route | Accès |
|---|---|
| `GET/POST /api/ceremonies`, `PATCH/DELETE /api/ceremonies/[id]` | admin |
| `POST /api/groups`, `DELETE /api/groups/[id]`, `POST /api/groups/[id]/reset-code` | admin |
| `PATCH /api/groups/[id]` | admin (tout) ou responsable du groupe (intro, consigne, photos, clôture) |
| `POST /api/manager/login` | public, limité (10 essais / 15 min) |
| `GET /api/invite/[slug]` | public, données non sensibles |
| `GET /api/entries` | admin (tout), responsable (son groupe), invité (son jeton) |
| `PATCH/DELETE /api/admin/entries/[id]` | admin, ou responsable pour épingler/approuver/supprimer dans son groupe |

---

# Phase 2a — PDF professionnel, photos, stockage interchangeable

## Ordre à respecter
1. **Neon → SQL Editor** : exécuter `lib/migrations/003_photos_storage.sql` (additif, rejouable) **AVANT** de déployer :
   le nouveau code lit les colonnes `thumb_url`, `width`, `height`.
2. En local : `npm install` (nouvelles dépendances : `@react-pdf/renderer`, SDK S3 pour R2, `tsx`), puis
   `npm run lint`, `npm run test:logic` et **`npm run pdf:sample`** → ouvrir `sample-livre-dor.pdf` et juger la mise en page
   (messages courts/longs, emoji, 1 à 6 photos, portraits/paysages/panoramas, photo indisponible).
3. *(Recommandé)* déposer les 4 polices dans `public/fonts/` (voir `public/fonts/README.md`). Sans elles : Times, sans erreur.
4. Déployer. **Le modal PDF existant utilise automatiquement le nouveau moteur** (même signature `generateGoldenBookPdf`).

## Stockage : Vercel Blob maintenant, Cloudflare R2 plus tard
- Défaut : `STORAGE_DRIVER="blob"`. Les photos partent **directement du navigateur** vers le stockage (plus de base64, plus de limite de 4,5 Mo).
- Pour passer à R2 sans changer le code :
  1. Cloudflare → R2 → créer un bucket ; lui attacher un **domaine personnalisé** (ex. `photos.votre-domaine.com`) ;
     créer une clé API (Object Read & Write) limitée à ce bucket.
  2. CORS du bucket :
     ```json
     [{ "AllowedOrigins": ["https://VOTRE-SITE.vercel.app"], "AllowedMethods": ["GET", "HEAD", "PUT"],
        "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
     ```
  3. Renseigner `R2_*` dans `.env.local` puis `npm run migrate:storage -- --dry-run`, puis sans `--dry-run`.
     Le script **copie** (n'efface rien dans Blob), met à jour les URL en base, et peut être relancé.
  4. Vercel : `STORAGE_DRIVER=r2` + variables `R2_*`, redéployer, vérifier le site et un PDF.

## Limites des photos
- 6 par invité (`MAX_PHOTOS_PER_ENTRY`, `lib/storage/index.ts`). Chaque photo est réduite à 1600 px (JPEG ~0,4 Mo) + vignette 480 px.
- Photo à la une : minimum 1600×900 (16:9), 1080×1350 (4:5) ou 1080×1080 (1:1) ; idéal 2400×1350 / 1600×2000 / 1800×1800.

---

# Mariage — formule Livre d'or / Invitation / Les deux + gestionnaire d'invitations complet

## Base de données
Exécuter dans Neon **avant** de déployer : `lib/migrations/006_mariage.sql` (additive, rejouable).
Elle ajoute la colonne `ceremonies.mode` et 5 tables : `wedding_config`, `wedding_guests`, `wedding_announcements`, `wedding_messages`, `wedding_gift_pledges`.
Si une version précédente de cette migration avait créé `invitation_guests`, cette table n'est plus utilisée (`DROP TABLE IF EXISTS invitation_guests;`).

## Formule
Pour le type *Mariage*, le formulaire de cérémonie propose **Livre d'or / Invitation / Les deux**. Un mariage = un responsable (le « dossier du mariage »).
L'espace responsable affiche les onglets correspondants ; la photo à la une est commune. Deux liens séparés : livre d'or (unique) et invitation (personnel).

## Gestionnaire d'invitations (repris du projet modèle, écran par écran)
Onglet *Invitations* de l'espace responsable (et de « Gérer » côté admin) :
**Invités** (liste, ajout, modification, statistiques, filtres, plan de tables, liens personnels, WhatsApp) · **Personnalisation** (couple, lieu, programme,
histoire et photos, cadeaux et liste de cadeaux, dress code, contacts, tables, musique, apparence) · **Émargement** (scan caméra ou saisie du code, annulation) ·
**Annonces** · **Discussions** (général, covoiturage, logement, témoins) · **Exports** (CSV, feuille d'émargement imprimable) · actualisation automatique.
Côté invité (`/inv/<jeton>`) : le grand jour, programme, histoire, cadeaux, infos, réponse (par événement, accompagnant, enfants, régime, allergies, représentant),
billet QR, annonces, discussions, musique.

## Ce qui diffère du projet modèle (sécurité et configuration)
- Authentification et droits par mariage : le responsable ne voit et ne modifie que SON mariage ; l'admin précise lequel.
- L'invité ne reçoit que SA fiche (jamais la liste), via un jeton de 144 bits ; le code du billet (QR) est distinct du lien personnel.
- Toutes les données entrantes sont validées (listes blanches, longueurs, liens http(s), images de notre stockage uniquement).
- Base Neon à la place d'un fichier JSON ; images sur Blob/R2 à la place du base64 ; actualisation régulière à la place du WebSocket.
- Catégories libres et **présence par événement liée au programme configuré** (plus de liste figée) ; aucun nom, lieu, date ou numéro d'exemple.
- Émargement atomique : deux scanners ne peuvent pas valider le même billet deux fois.

## Limites connues
- **Envoi d'un fichier audio** pour la musique : pas encore disponible (choisir un morceau de la liste ou coller un lien https).
- **Scan caméra** : utilise le détecteur natif du navigateur (Chrome, Android). Sur iPhone/Safari, utiliser la saisie du code ; un décodeur de secours (`jsqr`) peut être ajouté.
- Actualisation toutes les 5 s (responsable) / 10 s (invité), pas de WebSocket.
- La date de la fête est lue depuis la cérémonie si elle est au format reconnu, sinon une date provisoire est utilisée : à régler dans *Personnalisation*.

## À vérifier chez vous
`npm install`, `npm run lint`, `npm run test:logic`. Puis : créer un mariage « Les deux » → code du responsable → onglet *Invitations* → *Personnalisation* (couple, programme)
→ ajouter un invité → ouvrir son lien → répondre → voir le billet → *Émargement* : saisir le code du billet.

---

# Deuil — formule « Programme » (migration 007)

Un deuil peut désormais avoir la même formule qu'un mariage : **Livre d'or**, **Programme** ou **Les deux**.
Le **même responsable** (même code d'accès) gère le livre d'or et le programme, dans deux onglets.

## Avant de déployer
1. **Neon → SQL Editor** : exécuter `lib/migrations/007_deuil_programme.sql` (additif, rejouable). Aucune nouvelle variable d'environnement.
2. Pousser le code et déployer. Les deuils existants restent en « Livre d'or » : rien ne change pour eux.
3. Administration → modifier un deuil → choisir la formule « Programme » ou « Les deux ».

## Ce que le public voit : `/p/<lien du groupe>`
Fond violet profond. Onglets : **Programme** (par jour, itinéraire, ajout à l'agenda, livret imprimable), **Faire-part**,
**Convois** (places restantes, réservation avec preuve de paiement en image), **Soutien** (moyens de paiement, déclaration de don).
Avec la formule « Les deux », la page livre d'or (`/i/<lien>`) affiche un bouton vers le programme.

## Sécurité
| Sujet | Règle |
|---|---|
| Gestion | Responsable : uniquement son deuil. Admin : tout. Jamais pour un mariage (`/api/wedding/*` refuse désormais un deuil). |
| Réservations | Capacité vérifiée dans la requête SQL + `UNIQUE (bus_id, order_number)` : pas de sur-réservation, même à deux. |
| Dons | Un don déclaré par un visiteur est « en attente » : il n'entre dans le total public qu'après confirmation du responsable. |
| Données publiques | Jamais le nom d'un passager, le téléphone du chauffeur, ni le téléphone/montant d'un donateur. |
| Preuves de paiement | JPEG uniquement (réduit dans le navigateur), dossier `proofs/`, URL non devinable. Les PDF ne sont pas acceptés. |

## SEO
- Titre, description, URL canonique, aperçu WhatsApp/Facebook (photo du défunt, sinon carte violette `opengraph-image`), données structurées schema.org (Person + Event).
- `sitemap.xml` inclut les programmes dont la famille a laissé cochée « Référencement Google » (onglet Identité). Décochée : `noindex` + absent du sitemap.
- Les livres d'or (`/i/…`) et invitations de mariage (`/inv/…`) restent `noindex`.

## Routes ajoutées
| Route | Accès |
|---|---|
| `GET /api/funeral/state`, `PUT /api/funeral/config` | responsable / admin |
| `POST /api/funeral/buses`, `DELETE /api/funeral/buses/[id]` | responsable / admin |
| `PATCH/DELETE /api/funeral/reservations/[id]` | responsable / admin |
| `POST /api/funeral/donations`, `PATCH/DELETE /api/funeral/donations/[id]` | responsable / admin |
| `GET /api/programme/[slug]` | public (données non sensibles) |
| `POST /api/programme/[slug]/reserve`, `POST /api/programme/[slug]/donate` | public, limité par IP et par lien |

---

# Mariage — réponse par personne, billet sous condition, discussions, gestion des invités (migration 008)

## Avant de déployer
1. **Neon → SQL Editor** : exécuter `lib/migrations/008_rsvp_couple.sql` (additif, rejouable). À passer **après** la 006 (et la 007 si vous déployez aussi le deuil).
   Elle ajoute `guest_rsvp` et `partner_rsvp` et reprend les réponses déjà données : un invité couple qui avait confirmé « une seule personne » devient « conjoint absent », un couple confirmé « tous les deux » devient « les deux présents ».
2. Déployer. Aucune variable d'environnement nouvelle.

## Règles
| Sujet | Règle |
|---|---|
| Invitation couple (`plusOneAllowed`) | Chaque personne répond (présent / absent) dans le même formulaire ; envoi impossible tant qu'une réponse manque. |
| Réponse de l'invitation (`rsvp_status`) | Calculée : confirmée si au moins une personne vient, déclinée si toutes déclinent, sinon en attente. Stats, émargement et exports n'ont pas changé de logique. |
| Billet | Réservé à ceux qui ont confirmé : le serveur n'envoie **pas** le code QR tant qu'aucune personne ne vient. |
| Lien d'invitation | Ouvre la page d'invitation, plus directement le billet (liens copiés, WhatsApp, export CSV). |
| Salon « Témoins & surprises » | Invisible et inaccessible (lecture et écriture) pour les invités qui ne sont pas de catégorie « Témoins ». |
