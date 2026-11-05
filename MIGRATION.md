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

# Mariage — étape 1 : formule Livre d'or / Invitation / Les deux

## Base de données
Exécuter dans Neon **avant** de déployer : `lib/migrations/006_mariage_invitations.sql` (additive, rejouable).

## Ce qui est livré
- **Formulaire de création/modification d'une cérémonie** : pour le type *Mariage*, choix de la formule **Livre d'or / Invitation / Les deux**
  (les autres types gardent le livre d'or). La carte admin indique la formule.
- **1 mariage = 1 responsable.** Le « dossier du mariage » (le groupe créé avec la cérémonie) porte le code du responsable, attribué par l'admin.
- **Espace responsable** : onglets *Livre d'or* et *Invitations* selon la formule. La photo à la une est commune.
- **Invitations** : le responsable ajoute ses invités (nom d'invitation, catégorie libre, nombre de personnes prévues, table, téléphone, e-mail),
  suit les réponses, copie le **lien personnel** (`/inv/<jeton>`) ou l'envoie par WhatsApp. L'admin peut faire de même depuis « Gérer ».
- **Page personnelle de l'invité** : le grand jour (photo à la une, date, lieu), sa réponse (présent / peut-être / absent, nombre de personnes,
  régime, allergies, petit mot), son **billet QR** (activé quand il répond « oui »).
- **Deux liens séparés** : lien du livre d'or unique pour tous (celui du groupe), lien d'invitation personnel par invité.
  Un mariage en « Invitation » seule n'a pas de page livre d'or ; en « Livre d'or » seul, les liens personnels cessent de fonctionner.

## Sécurité
- Jeton personnel : 144 bits aléatoires. Le serveur ne renvoie à l'invité que **sa** fiche (jamais la liste, ni d'e-mail, ni de jeton d'autrui).
- Le code du billet (QR) est distinct du jeton du lien : une capture du billet ne révèle pas le lien.
- Un responsable ne peut lire ni modifier que les invités de **son** mariage (contrôlé côté serveur à chaque requête).
- Réponses validées côté serveur : jamais plus de personnes que prévu. Limites de débit sur la consultation et les réponses.
- Pages personnelles : `noindex`, pas de transmission du jeton aux sites externes.

## À vérifier chez vous
`npm install`, `npm run lint`, `npm run test:logic`. Puis : créer un mariage « Les deux » → récupérer le code responsable → se connecter → onglet Invitations → ajouter un invité → ouvrir son lien → répondre → voir le billet.

## Prochaines étapes
2. Import CSV, statistiques détaillées, **émargement par caméra** (code du billet), exports et feuille imprimable.
3. Contenu de l'invitation : programme par événement, histoire, cadeaux, dress code, contacts, compte à rebours, musique, anglais.
4. Annonces, messages, plan de table, liste de cadeaux.
