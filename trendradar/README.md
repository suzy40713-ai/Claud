# TrendRadar

« Ne cherche plus quoi publier. TrendRadar trouve tes prochaines idées. »

TrendRadar aide les créateurs TikTok, Instagram Reels et YouTube Shorts à trouver rapidement des
idées de contenu adaptées à leur niche, grâce à l'IA (Gemini).

## Stack

- **Frontend** : Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend** : Next.js Route Handlers
- **Base de données & Auth** : Supabase (PostgreSQL + Supabase Auth)
- **Paiements** : Stripe (Checkout, Customer Portal, Webhooks)
- **IA** : Gemini API (`@google/genai`, modèle `gemini-2.5-flash`)

## Fonctionnalités

- Landing page premium (sombre, violet/bleu, responsive)
- Génération d'idées de contenu (titre, hook, concept, format, durée, audience, CTA, hashtags,
  Opportunity Score /100 avec disclaimer)
- Génération de scripts complets (hook, intro, développement, conclusion, CTA, narration, texte à
  l'écran, idées visuelles) avec variations ("plus captivant", "raccourcir", "suspense", "autre
  version")
- Variantes d'idées (5 angles différents à partir d'une idée)
- Analyse d'une idée fournie par l'utilisateur (score détaillé + points forts/à améliorer + 3
  versions améliorées)
- Radar de tendances (estimations IA qualitatives, clairement identifiées comme telles — voir
  section Radar ci-dessous)
- Calendrier de contenu (planification des publications)
- Système de crédits (recherches/mois, idées par recherche) piloté par un seul fichier
  (`lib/plans.ts`)
- Facturation Stripe (Free / Creator 14,99€ / Pro 29,99€) avec Customer Portal

## Système de crédits

Toute la logique de limites (nombre de recherches par mois, idées par recherche, fonctionnalités
débloquées par plan) est centralisée dans `lib/plans.ts`. Pour changer les limites plus tard, il
suffit de modifier les valeurs de cet objet — aucune autre partie du code n'a besoin d'être
touchée. Le solde de crédits de chaque utilisateur est stocké dans `profiles.search_credits` et se
réinitialise automatiquement tous les 30 jours (`lib/credits.ts`).

## Radar : transparence sur les données

Le Radar affiche des signaux classés en 4 catégories (Trending, En progression, À surveiller,
Opportunités). **Ces signaux sont des estimations qualitatives générées par IA**, pas des données
de tendances en temps réel — un bandeau d'avertissement le rappelle explicitement dans l'UI.

La table `radar_signals` a un champ `source` (`ai_estimate`, `google_trends`, `social_api`,
`manual`) prêt à recevoir de vraies données dès qu'une intégration est branchée. Pour connecter
Google Trends ou une API sociale plus tard, il suffit d'ajouter une nouvelle fonction dans
`lib/gemini.ts`-like module (ou un nouveau fichier `lib/trends.ts`) qui insère des lignes dans
`radar_signals` avec la bonne valeur de `source`, sans changer l'API `/api/radar` ni l'UI.

## Mise en place

### 1. Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir :

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (publique, safe côté client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (**secrète**, serveur uniquement) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook Stripe |
| `STRIPE_PRICE_CREATOR` | ID du prix Stripe pour le plan Creator (14,99€/mois) |
| `STRIPE_PRICE_PRO` | ID du prix Stripe pour le plan Pro (29,99€/mois) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (si besoin côté client) |
| `GEMINI_API_KEY` | Clé API Gemini (**secrète**, serveur uniquement) |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (ex: `https://trendradar.app`) |

Aucune clé secrète n'est jamais exposée au frontend : `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `GEMINI_API_KEY` ne sont utilisées que dans des
Route Handlers / composants serveur (jamais préfixées `NEXT_PUBLIC_`).

### 2. Base de données Supabase

Créer un projet sur [supabase.com](https://supabase.com). Le schéma vit dans
`supabase/migrations/20260101000000_init_schema.sql` et crée :

- `profiles` (plan, crédits, infos Stripe)
- `credit_transactions` (journal des crédits consommés)
- `searches`, `ideas`, `scripts`, `idea_analyses`
- `calendar_entries`
- `radar_signals`
- Les policies RLS nécessaires + un trigger qui crée automatiquement un `profile` à l'inscription

Deux façons de l'appliquer :

**Option A — Intégration GitHub (recommandée)** : Project Settings → Integrations → GitHub →
connecter le repo. Comme ce dépôt est un monorepo, indiquer `trendradar` comme **Supabase
directory**. Supabase applique alors automatiquement les fichiers de `supabase/migrations/` à
chaque merge sur la branche de production.

**Option B — Manuelle** : copier le contenu du fichier de migration dans **SQL Editor → New
query** du dashboard Supabase et cliquer **Run**.

Dans Supabase Auth, activer la méthode Email/Password. Configurer l'URL de redirection
`https://<votre-domaine>/auth/callback`.

### 3. Stripe

1. Créer deux produits récurrents mensuels : **Creator** (14,99€) et **Pro** (29,99€).
2. Récupérer les Price IDs et les mettre dans `STRIPE_PRICE_CREATOR` / `STRIPE_PRICE_PRO`.
3. Créer un webhook pointant vers `https://<votre-domaine>/api/stripe/webhook`, écoutant :
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`.
4. Copier le secret de signature dans `STRIPE_WEBHOOK_SECRET`.
5. Activer le Customer Portal Stripe (Dashboard → Settings → Billing → Customer portal).

### 4. Gemini

Créer une clé API sur [Google AI Studio](https://aistudio.google.com/) et la placer dans
`GEMINI_API_KEY`.

### 5. Lancer en local

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:3000`.

### 6. Déploiement

Le projet est prêt pour un déploiement Vercel (ou tout hébergeur Next.js) :

1. Connecter le repo à Vercel.
2. Renseigner toutes les variables d'environnement listées ci-dessus.
3. Mettre à jour `NEXT_PUBLIC_APP_URL` avec le domaine final, et l'URL de redirection Supabase +
   les URLs de webhook Stripe en conséquence.

## Structure du projet

```
app/                    Routes (App Router) : landing, auth, dashboard, API routes
components/             Composants React (landing, dashboard, auth)
lib/                    Logique métier (plans, crédits, Gemini, Stripe, Supabase clients)
supabase/migrations/    Schéma complet de la base de données + RLS
```
