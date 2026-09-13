# LaunchPilot

> Donne-nous ton produit. LaunchPilot te donne le plan pour obtenir tes premiers clients.

LaunchPilot transforme la description d'un produit en un plan marketing concret et exécutable : score de préparation marketing, persona, positionnement, offre, stratégies d'acquisition, 30 idées de contenu, calendrier d'actions sur 30 jours, emails et concepts publicitaires.

## Stack

- **Framework** : Next.js 15 (App Router) + TypeScript
- **UI** : Tailwind CSS + composants shadcn/ui (copiés à la main, voir `src/components/ui`)
- **Base de données / Auth** : Supabase (Postgres + Supabase Auth via `@supabase/ssr`)
- **IA** : architecture agnostique du fournisseur (Anthropic ou OpenAI), avec repli hors-ligne déterministe si aucune clé n'est configurée — voir `src/lib/ai`
- **Paiements** : Stripe (Checkout + Customer Portal + webhook), avec mode développement quand les clés Stripe ne sont pas configurées
- **Déploiement cible** : Vercel

## Pourquoi Next.js 15 (et pas 16) ?

Ce projet cible délibérément Next.js 15.x (dernière version stable patchée pour la sécurité, `15.5.25`) plutôt que la toute dernière 16.x. Next 16 introduit des changements très récents et significatifs (renommage de `middleware.ts` en `proxy.ts`, nouveau modèle de cache `cacheComponents`, etc.) qui ajoutent du risque sans bénéfice pour ce projet. Next 15 conserve les patterns App Router classiques (params/searchParams asynchrones, Server Actions, `middleware.ts`) tout en intégrant les correctifs de sécurité critiques publiés après la branche 14.

## Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute dans l'ordre le contenu de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) puis [`supabase/migrations/0002_pay_per_plan.sql`](./supabase/migrations/0002_pay_per_plan.sql). Ils créent toutes les tables, les policies RLS (chaque utilisateur ne voit que ses propres données), les triggers (création automatique du profil à l'inscription) et le système de crédits pay-per-generation.
3. Récupère l'URL du projet, la clé anonyme et la clé `service_role` depuis **Project Settings > API**.

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis au minimum les variables Supabase. Tout le reste (IA, Stripe) fonctionne en mode dégradé/développement si non configuré :

- **Sans clé IA** (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) : la génération utilise un moteur déterministe hors-ligne (`src/lib/ai/providers/mock.ts`) qui produit un plan complet et personnalisé à partir des informations du produit — utile pour développer et tester sans dépenser de crédits API.
- **Sans clés Stripe** : l'action "Acheter un plan — 14,99€" (`src/lib/actions/billing.ts`) crédite directement le compte de l'utilisateur en base de données, sans appeler Stripe, pour que le parcours d'achat reste testable de bout en bout.

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Configurer l'IA (optionnel mais recommandé pour la production)

Dans `.env.local` :

```bash
AI_PROVIDER=anthropic        # ou "openai"
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5
```

L'architecture est volontairement agnostique (`src/lib/ai/providers/*`) : ajouter un nouveau fournisseur revient à implémenter l'interface `LlmProvider` (`src/lib/ai/providers/types.ts`) et l'enregistrer dans `resolveProvider()` (`src/lib/ai/providers/resolve.ts`).

## Configurer Stripe (optionnel)

LaunchPilot est en **pay-per-generation** : 14,99€ par plan généré, sans abonnement.

1. Crée un produit avec un prix **unique/non récurrent** de 14,99€ dans le [Dashboard Stripe](https://dashboard.stripe.com/products) (mode "One time", pas "Recurring").
2. Renseigne `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PLAN` (l'ID du prix créé) et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Crée un webhook pointant vers `https://<ton-domaine>/api/stripe/webhook` écoutant au minimum `checkout.session.completed`.
4. Renseigne `STRIPE_WEBHOOK_SECRET` avec le secret de signature du webhook.

## Système de crédits

Chaque utilisateur a un simple solde de crédits (`usage_credits.credits_balance`) — un crédit = un plan marketing complet généré. Il n'y a pas de palier Free/Pro : chaque achat de 14,99€ (Stripe ou mode développement) ajoute un crédit, consommé au moment de la génération. La vérification et la décrémentation se font exclusivement côté serveur ([`src/lib/credits.ts`](./src/lib/credits.ts), appelé depuis les Server Actions), donc un rechargement de page ne permet pas de générer un plan gratuitement. Le prix (14,99€) est centralisé dans `PLAN_PRICE_EUR`/`PLAN_PRICE_CENTS` en haut de ce même fichier.

## Structure du projet

```
src/
  app/                    Routes App Router (landing, auth, onboarding, dashboard, API)
  components/
    ui/                   Composants shadcn/ui (écrits à la main, pas de CLI réseau requis)
    dashboard/            Sidebar, shell, empty states, page headers
    landing/               Sections de la landing page
    onboarding/            Formulaire multi-étapes
    reports/, calendar/, product/, settings/   Composants spécifiques à chaque section
  lib/
    ai/                   Prompt, schémas Zod, fournisseurs (Anthropic/OpenAI/mock), orchestration
    actions/              Server Actions (auth, produits, génération, calendrier, facturation, compte)
    supabase/             Clients Supabase (navigateur, serveur, admin/service-role)
    stripe/               Client Stripe
    data/                 Requêtes de lecture partagées (rapports, bundles complets)
    credits.ts            Solde de crédits pay-per-generation + prix (server-only)
    fetch-public-page.ts  Récupération sécurisée d'une page produit publique (analyse d'URL)
  middleware.ts           Rafraîchissement de session Supabase + protection des routes privées
supabase/migrations/      Schéma SQL (tables, RLS, triggers, système de crédits)
```

## Notes de sécurité

- Toutes les clés secrètes (Supabase service role, IA, Stripe) sont lues depuis des variables d'environnement serveur uniquement, jamais exposées au client.
- RLS activé sur toutes les tables : un utilisateur ne peut lire/écrire que ses propres lignes. Les tables `usage_credits` et `credit_purchases` n'acceptent des écritures que via la clé `service_role` (webhook Stripe, logique de crédits) — un utilisateur ne peut donc jamais s'auto-créditer.
- L'analyse de page produit (`src/lib/fetch-public-page.ts`) valide le protocole (http/https uniquement) et bloque les hôtes privés/locaux (loopback, RFC1918, etc.) pour limiter le risque de SSRF ; c'est une protection best-effort au niveau applicatif, pas un remplacement d'un pare-feu réseau sortant.
- Le webhook Stripe vérifie la signature de chaque requête avant tout traitement.

## Limites connues du MVP

- Les écritures multi-tables lors de la génération d'un plan (`src/lib/actions/generation.ts`) sont séquentielles, pas transactionnelles (pas d'API de transaction multi-table côté client Supabase JS sans fonction RPC dédiée). Le rapport principal est toujours écrit en premier ; l'UI traite une section enfant manquante comme un état vide plutôt que de planter.
- Le générateur IA "mock" (utilisé quand aucune clé n'est configurée) est déterministe et suffisant pour développer/tester, mais ne remplace pas un vrai modèle pour la qualité éditoriale en production.
