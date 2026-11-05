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

## Fonctionnalités

| Domaine              | Contenu                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comptes              | Inscription / connexion email, Google (si configuré), vérification de l'email, mot de passe oublié, CGU obligatoires, sessions de 30 jours, limitation des tentatives                     |
| Entreprise           | Création guidée (activité, adresse publique, fuseau), assistant d'installation, paramètres (coordonnées, logo, règles de réservation, personnalisation Pro)                               |
| Équipe               | Rôles propriétaire / administrateur / employé, invitations par email (lien signé, 7 jours, usage unique), profils, services autorisés, horaires, pauses, absences                         |
| Agenda               | Calendrier jour / semaine / mois, filtre par employé, création, déplacement, annulation, présence / absence, notes internes                                                               |
| Réservation publique | `/{adresse}` : prestation → employé → créneau → coordonnées, sans compte ; lien signé `/rdv/…` pour modifier, annuler, ajouter à l'agenda (.ics)                                          |
| Disponibilités       | Moteur pur (`src/domain/availability`) : horaires, pauses, fermetures, battement, délais, fuseaux et changements d'heure ; contrainte d'exclusion PostgreSQL contre la double réservation |
| Clients              | Liste, recherche, fiche, historique, notes, suppression (RGPD)                                                                                                                            |
| Notifications        | File dédupliquée (`notification`), confirmation / modification / annulation, rappels 24 h et 2 h (Pro), alertes équipe, nouvelles tentatives, prêt pour les SMS                           |
| Statistiques         | Vue générale et page analytique calculées depuis les rendez-vous réels ; avancées en Pro                                                                                                  |
| Abonnements          | Stripe Checkout, changement d'offre au prorata, résiliation, portail, factures, webhooks idempotents, limites appliquées côté serveur                                                     |
| RGPD                 | Export JSON des données, suppression du compte, hébergement UE                                                                                                                            |

Mise en ligne : voir [`docs/deploiement.md`](docs/deploiement.md). Cahier des charges : [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md).

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
