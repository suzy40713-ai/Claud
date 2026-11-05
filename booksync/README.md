# BookSync

Logiciel SaaS de gestion et de réservation de rendez-vous pour les professionnels.
Interface entièrement en français.

## Stack

| Domaine     | Choix                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Application | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict                               |
| UI          | Tailwind CSS 4, composants Radix (style shadcn/ui), police Geist, thème clair/sombre                 |
| Données     | PostgreSQL (Supabase en production), Drizzle ORM, migrations SQL versionnées                         |
| Validation  | Zod (variables d'environnement, formulaires, API)                                                    |
| Tests       | Vitest (unitaires + intégration sur un vrai PostgreSQL), Playwright (desktop + mobile)               |
| Hébergement | Render (Docker, région Francfort), CI GitHub Actions                                                 |
| Paiements   | Stripe Billing pour les abonnements Starter / Pro (étape 8). Architecture prête pour Stripe Connect. |

## Démarrage local

Prérequis : Node 22+, pnpm 10+, PostgreSQL 16+.

```bash
scripts/dev-db.sh              # PostgreSQL local sans Docker (facultatif)
cp .env.example .env.local     # puis ajuster DATABASE_URL et BETTER_AUTH_SECRET
cp .env.local .env             # lu par drizzle-kit
createdb booksync_dev && createdb booksync_test
pnpm install
pnpm db:migrate
pnpm dev                       # http://localhost:3000
```

## Commandes

| Commande                    | Rôle                                                      |
| --------------------------- | --------------------------------------------------------- |
| `pnpm dev`                  | Serveur de développement                                  |
| `pnpm build` / `pnpm start` | Build de production / démarrage (applique les migrations) |
| `pnpm check`                | Types + lint + tests unitaires et d'intégration           |
| `pnpm test:e2e`             | Tests Playwright (nécessite `pnpm build` au préalable)    |
| `pnpm db:generate`          | Génère une migration à partir du schéma Drizzle           |
| `pnpm db:migrate`           | Applique les migrations                                   |

Les tests d'intégration **réinitialisent** la base `TEST_DATABASE_URL`
(par défaut `postgres://postgres@localhost:5432/booksync_test`).

## Authentification (étape 1)

- Better Auth : email + mot de passe, confirmation obligatoire de l'email, mot de passe oublié,
  sessions de 30 jours, limitation des tentatives (5/min sur la connexion et l'inscription).
- Protection contre l'énumération des comptes : une inscription avec un email déjà utilisé
  répond comme un succès et prévient le titulaire par email.
- Entreprise (organisation) créée à l'onboarding : nom, adresse publique unique, fuseau horaire.
  Le créateur est `owner`. L'appartenance est toujours revérifiée en base (`requireOrganization`).
- Emails : chaque envoi est journalisé dans `email_message`. Sans `RESEND_API_KEY`, rien n'est
  envoyé ; en développement, les emails sont consultables sur `/dev/emails`.

| Page                                                  | Rôle                                     |
| ----------------------------------------------------- | ---------------------------------------- |
| `/inscription`, `/connexion`                          | Création de compte, connexion            |
| `/verifier-email`                                     | Attente / renvoi du lien de confirmation |
| `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` | Réinitialisation                         |
| `/onboarding`                                         | Création de l'entreprise                 |
| `/tableau-de-bord`                                    | Espace professionnel (protégé)           |

## Structure

```
src/
├─ app/                 routes Next.js (pages, API, webhooks)
├─ components/ui/       design system
├─ components/brand/    logo
├─ db/                  connexion, schéma Drizzle, migrations
├─ domain/              logique métier pure (disponibilités, réservations…), sans I/O
├─ server/              services : accès aux données, autorisations, intégrations
├─ jobs/                tâches de fond (rappels, emails)
├─ emails/              modèles d'emails
└─ lib/                 configuration, utilitaires
tests/
├─ unit/  integration/  e2e/
```

## Principes d'architecture

- **Multi-tenant** : chaque donnée métier appartient à une organisation (`organization_id`) ;
  tout accès passe par la couche `server/`, qui impose ce filtre.
- **Anti-double réservation garanti par la base** : contrainte d'exclusion
  PostgreSQL (`EXCLUDE USING gist`, extension `btree_gist`).
- **UTC partout en base**, fuseaux horaires gérés explicitement dans `domain/`.
- **RLS activée sur toutes les tables `public`** : l'API REST de Supabase reste fermée ;
  l'application accède à la base uniquement côté serveur. Un test le vérifie.
- **Paiements** : la facturation des abonnements (Stripe Billing) est isolée dans
  `server/billing/`. Les futurs paiements clients (Stripe Connect) y seront ajoutés
  sans toucher au cœur réservation.

## Déploiement (Render)

Le service `booksync` est déclaré dans `render.yaml` à la racine du dépôt.
Variables à renseigner dans Render : `DATABASE_URL` (Supabase, _Session pooler_,
`?sslmode=require`) et `NEXT_PUBLIC_APP_URL`. Les migrations sont appliquées
automatiquement au démarrage du conteneur. Sonde de santé : `/api/health`.
