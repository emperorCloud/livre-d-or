# Livre d'Or & Hommage Numérique — Jean-Michel Edimo

Version **Next.js** (App Router) de l'application, prête à déployer sur
**Vercel**, avec **Vercel Postgres** (base de données) et **Vercel Blob**
(photos des invités).

## Ce qui a changé par rapport à la version d'origine (Vite + Express)

- Le fichier `data/guestbook_entries.json` est remplacé par une vraie base
  **Postgres** (`lib/db.ts`) — indispensable car Vercel ne permet pas
  d'écrire durablement sur le disque en production.
- Les photos ne sont plus stockées en base64 dans les données : elles sont
  uploadées sur **Vercel Blob** (`lib/blob.ts`), seule l'URL est conservée.
- L'authentification admin utilise désormais un **cookie de session signé**
  (`lib/auth.ts`) au lieu d'un jeton constant en dur dans le code source
  (faille corrigée : dans l'original, n'importe qui lisant le code pouvait
  se faire passer pour l'administrateur).
- Le mot de passe admin (`ADMIN_PASSCODE`) est en variable d'environnement,
  modifiable à tout moment depuis le dashboard Vercel sans toucher au code.
- `/api/admin/stats` exige maintenant une authentification (l'original ne
  vérifiait rien du tout sur cette route).
- Le générateur de PDF (`lib/generatePdfBook.ts`) fonctionne à l'identique :
  100% côté navigateur, aucun changement de logique.
- La dépendance `@google/genai` (présente mais jamais utilisée dans le code
  d'origine) a été retirée.

## Déploiement — étape par étape

### 1. Pousser le code sur GitHub

Créez un nouveau dépôt GitHub et poussez-y tout le contenu de ce dossier
(sans le dossier `node_modules` s'il existe — il est déjà exclu par
`.gitignore`).

### 2. Importer le projet sur Vercel

Sur [vercel.com](https://vercel.com) → **Add New Project** → sélectionnez
votre dépôt GitHub. Vercel détecte automatiquement Next.js, aucune
configuration de build à changer.

**Ne déployez pas encore** — configurez d'abord la base de données et le
stockage (étapes 3 et 4), sinon le premier déploiement plantera faute de
variables d'environnement.

### 3. Créer la base de données (Vercel Postgres)

Dans votre projet Vercel → onglet **Storage** → **Create Database** →
**Postgres** (propulsé par Neon). Connectez-la à ce projet : Vercel injecte
automatiquement `POSTGRES_URL` (et variantes) dans vos variables
d'environnement — vous n'avez rien à copier manuellement.

Ensuite, exécutez le schéma une seule fois : dans l'onglet **Storage** de
votre base → **Query** (éditeur SQL intégré), collez le contenu du fichier
[`lib/schema.sql`](./lib/schema.sql) et exécutez-le. Ça crée les tables
`entries` et `entry_photos`.

### 4. Créer le stockage photos (Vercel Blob)

Toujours dans l'onglet **Storage** → **Create Database** → **Blob**.
Connectez-le à ce projet : Vercel injecte automatiquement
`BLOB_READ_WRITE_TOKEN`.

### 5. Variables d'environnement restantes

Dans **Settings → Environment Variables**, ajoutez :

| Variable | Valeur |
|---|---|
| `ADMIN_PASSCODE` | Le mot de passe de votre choix pour l'espace admin |
| `SESSION_SECRET` | Une chaîne aléatoire longue — générez-la avec `openssl rand -base64 32` |

Voir [`.env.example`](./.env.example) pour le détail de chaque variable.

### 6. Déployer

Lancez (ou relancez) le déploiement depuis Vercel. C'est en ligne.

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseignez vos vraies valeurs
npm run dev
```

Pour le développement local, connectez-vous quand même à la base Postgres et
au Blob store Vercel (copiez les valeurs depuis le dashboard Vercel dans
`.env.local`) — il n'y a pas de mode "hors-ligne" avec base locale dans
cette version.

## Note sur les données existantes

Le fichier `data/guestbook_entries.json` de la version d'origine contenait
une entrée de test. Elle n'est **pas** migrée automatiquement (le but de
cette conversion est justement d'abandonner ce fichier). Dites-le-moi si
vous voulez que je l'importe dans la nouvelle base.

## Structure du projet

```
app/
  layout.tsx              # remplace index.html + main.tsx
  page.tsx                # remplace App.tsx
  globals.css             # remplace index.css
  api/                    # remplace server.ts (routes Express -> Route Handlers)
components/                # composants UI (quasi inchangés, juste "use client" + imports ajustés)
lib/
  types.ts                 # inchangé
  db.ts                    # NOUVEAU - remplace la lecture/écriture du fichier JSON
  auth.ts                  # NOUVEAU - session admin signée
  blob.ts                  # NOUVEAU - upload photos vers Vercel Blob
  schema.sql                # NOUVEAU - schéma Postgres à exécuter une fois
  generatePdfBook.ts        # inchangé (génération PDF 100% client)
```
