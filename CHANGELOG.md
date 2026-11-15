# Greffe « Programme de deuil » → CardEvents

Zip allégé : uniquement les fichiers nouveaux ou modifiés (à copier dans le projet, mêmes chemins).
**Avant de déployer : exécuter `lib/migrations/007_deuil_programme.sql` dans Neon.** Aucune nouvelle variable d'environnement.

## Fichiers modifiés
| Fichier | Changement |
|---|---|
| `lib/types.ts` | `PublicInvite.hasProgramme` ; commentaire de la formule (mariage **et deuil**) |
| `lib/ceremonies.ts` | Formule `guestbook / invitation / both` acceptée pour le deuil ; `hasProgramme` |
| `components/CeremonyFormModal.tsx` | Choix « Livre d'or / Programme / Les deux » pour un deuil |
| `components/GroupManagerView.tsx` | Onglet « Programme » (deuil) à côté du livre d'or, même responsable |
| `components/AdminView.tsx` | Libellé de la formule d'un deuil |
| `components/GuestSignView.tsx` | Bouton vers le programme (deuil « Les deux ») |
| `lib/wedding/access.ts` | `/api/wedding/*` refuse désormais tout ce qui n'est pas un mariage |
| `lib/storage/index.ts`, `lib/uploadAuth.ts`, `app/api/upload/blob/route.ts`, `app/api/upload/r2/route.ts`, `lib/client/upload.ts` | Téléversement des preuves de paiement (`proofs/`, JPEG, sans session) |
| `app/sitemap.ts` | Ajoute les programmes dont la famille autorise Google |
| `MIGRATION.md` | Section « Deuil — formule Programme » |

## Fichiers nouveaux
| Dossier | Contenu |
|---|---|
| `lib/migrations/` | `007_deuil_programme.sql` (4 tables) |
| `lib/funeral/` | types, validation, base de données, accès, limites, SEO (méta + JSON-LD), impression/agenda, client API |
| `app/api/funeral/**` | API responsable : état, config, bus, réservations, dons |
| `app/api/programme/[slug]/**` | API publique : lecture, réservation, déclaration de don |
| `app/p/[slug]/` | Page publique + image d'aperçu `opengraph-image.tsx` |
| `components/funeral/**` | Page publique violette, panneau du responsable (5 onglets) |

## Reste à faire (lot suivant)
Invités & RSVP du deuil, reçus PDF, notifications SMS/WhatsApp des rappels.
