# CardEvents — livres d'or cérémoniels

Next.js (App Router) · Postgres (Neon) · Vercel Blob ou Cloudflare R2 · PDF A4 côté navigateur.
Aucun nom de personne ni de cérémonie dans le code : tout est saisi par l'administrateur (cérémonies, groupes, textes du site).

## Déploiement (dans cet ordre)
1. **GitHub** : poussez TOUT le dossier (sans `node_modules`). Vérifiez ensuite sur Vercel que le dernier commit est le bon.
2. **Vercel** : *Add New Project* → ce dépôt. Dans *Storage* : créez/connectez **Postgres (Neon)** et **Blob**.
3. **Neon → SQL Editor**, exécutez dans l'ordre : `lib/schema.sql`, puis `lib/migrations/002_ceremonies_groups.sql`, `003_photos_storage.sql`, `004_site_settings.sql` (tous rejouables).
4. **Variables d'environnement** (voir `.env.example`) : `ADMIN_PASSCODE` (longue phrase de passe), `SESSION_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_SITE_URL` (votre domaine), `BLOB_PUBLIC_HOST` (recommandé).
5. **Déployez**, puis connectez-vous (*Connexion → Administrateur*) : créez une cérémonie, un groupe, et copiez le **code responsable** (affiché une seule fois).

Contrôle : le build doit lister `/i/[slug]`, `/api/manager/login`, `/api/settings`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`.

## Référencement (SEO)
En place : titre/description dynamiques, Open Graph + Twitter, image d'aperçu générée, favicon + icône Apple + manifest, `sitemap.xml`, `robots.txt`, données structurées (Organization, WebSite, FAQ), page d'accueil rendue côté serveur.
Les pages d'invitation `/i/…` sont en `noindex` (livres d'or privés). **À faire une fois** : brancher votre domaine, renseigner `NEXT_PUBLIC_SITE_URL`, ajouter le site dans Google Search Console et soumettre `/sitemap.xml`.

## Cloudflare R2 (quand vous en avez besoin)
1. Cloudflare → R2 → créez un bucket, attachez-lui un **domaine personnalisé** (ex. `photos.votre-domaine.com`).
2. Créez une clé API R2 (*Object Read & Write*) limitée à ce bucket. CORS du bucket :
   `[{"AllowedOrigins":["https://VOTRE-DOMAINE"],"AllowedMethods":["GET","HEAD","PUT"],"AllowedHeaders":["Content-Type"],"MaxAgeSeconds":3600}]`
3. Renseignez `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (Vercel + `.env.local`).
4. *Paramètres du site* (admin) affiche l'état : « R2 prêt (connexion vérifiée) ».
5. Migrez les photos existantes : `npm run migrate:storage -- --dry-run`, puis sans `--dry-run` (copie, n'efface rien, relançable).
6. Passez `STORAGE_DRIVER="r2"` dans Vercel et redéployez.

## Sécurité
Sessions JWT `httpOnly` · codes responsables hachés (scrypt) · limitation de débit en base · envoi des photos direct vers le stockage avec jeton borné (JPEG, 2,5 Mo) · liens d'invitation non devinables.
Si un secret a été partagé (mot de passe Neon, passcode…), changez-le.

## Développement local
`npm install` · `cp .env.example .env.local` · `npm run dev` · contrôles : `npm run lint`, `npm run test:logic`, `npm run pdf:sample`.
