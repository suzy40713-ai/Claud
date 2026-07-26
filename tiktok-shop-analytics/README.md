# TikTok Shop Analytics

SaaS d'analytics unifiées pour les vendeurs TikTok Shop : centralise ventes,
frais de plateforme, dépenses publicitaires et retours produits pour afficher
la marge nette réelle par produit, par campagne et globale.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript strict
- [Supabase](https://supabase.com/) (Postgres + Auth)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Recharts](https://recharts.org/) pour les visualisations
- Déploiement cible : [Vercel](https://vercel.com/)

## Lancer le projet en local

### 1. Prérequis

- Node.js ≥ 18.18
- Un projet Supabase (gratuit) — [créez-en un ici](https://supabase.com/dashboard)

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Renseignez dans `.env.local` les valeurs trouvées dans votre projet Supabase
sous **Project Settings > API** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement, ne jamais exposer au navigateur)

### 4. Appliquer les migrations de base de données

Les migrations SQL vivent dans `supabase/migrations/`. Avec la
[Supabase CLI](https://supabase.com/docs/guides/cli) :

```bash
npx supabase link --project-ref <votre-project-ref>
npx supabase db push
```

Ou collez le contenu des fichiers de migration dans le SQL Editor du
dashboard Supabase, dans l'ordre chronologique.

### 5. Activer la confirmation d'email (optionnel en dev)

Dans **Authentication > URL Configuration** du dashboard Supabase, ajoutez
`http://localhost:3000/auth/callback` aux Redirect URLs.

### 6. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/                  Routes (App Router)
  (app)/              Routes authentifiées (dashboard, import, products)
  login/, signup/     Pages d'authentification
  auth/callback/      Échange du code Supabase contre une session
components/           Composants React réutilisables
  auth/               Formulaires de connexion/inscription
  layout/             NavBar, etc.
lib/
  supabase/           Clients Supabase (browser, server, middleware)
  data-sources/       Couche d'abstraction pour l'ingestion de données
                       (CSV aujourd'hui, API TikTok Shop Partner plus tard)
types/                Types partagés, dont les types générés de la DB
supabase/migrations/  Schéma SQL versionné
```

## Schéma de données

Toutes les tables métier remontent à `stores`, rattachée à un `user_id`
(Supabase Auth). La Row Level Security est activée sur chaque table : un
utilisateur ne peut lire/écrire que les lignes liées à ses propres
boutiques (via une policy `exists (... stores.user_id = auth.uid())`).

| Table            | Rattachement                        | Rôle |
| ---------------- | ------------------------------------ | ---- |
| `stores`         | `user_id → auth.users`               | Boutique TikTok Shop d'un utilisateur |
| `products`       | `store_id → stores`                  | Nom, SKU, prix de vente, coût de revient |
| `orders`         | `store_id`, `product_id`             | Commande : quantité, prix de vente réel, date, statut |
| `returns`        | `order_id → orders`                  | Retour lié à une commande : date, raison, montant remboursé |
| `ad_spend`       | `store_id`, `product_id` (optionnel) | Dépense pub par campagne/période, éventuellement liée à un produit |
| `platform_fees`  | `store_id`, `order_id` (optionnel)   | Frais de plateforme liés à une commande ou à une période |

Les migrations SQL (`supabase/migrations/`) ont été testées de bout en bout
sur un Postgres local (contraintes, clés étrangères, et policies RLS
vérifiées avec deux utilisateurs distincts).

Les types TypeScript correspondants sont dans `types/database.ts`. Une fois
le projet Supabase lié, régénérez-les avec :

```bash
npx supabase gen types typescript --project-id <votre-project-ref> > types/database.ts
```

## Import CSV (/import)

MVP sans API TikTok Shop Partner : chaque type de donnée (commandes,
retours, dépenses pub, frais de plateforme) s'importe via un fichier CSV.

1. Si l'utilisateur n'a pas encore de boutique, un formulaire de création
   s'affiche en premier (`components/import/CreateStoreForm.tsx`).
2. L'utilisateur choisit un type de données, upload son CSV (parsé côté
   navigateur avec `papaparse`), puis mappe les colonnes du fichier vers les
   champs attendus (`lib/import/entities.ts` définit les champs par entité).
   Un modèle CSV téléchargeable est proposé pour chaque type.
3. La validation de format (champs requis, nombres, dates `AAAA-MM-JJ` ou
   `JJ/MM/AAAA`, valeurs autorisées) s'exécute côté client
   (`lib/import/validate.ts`) et affiche un rapport ligne par ligne avant
   toute écriture en base.
4. Seules les lignes valides sont envoyées à un Server Action
   (`lib/import/actions.ts`) qui résout les références (SKU → produit, n° de
   commande TikTok → commande) puis insère les lignes en une seule requête
   atomique. Les commandes dont le SKU est inconnu peuvent créer le produit
   à la volée si un nom et un coût de revient sont fournis dans le CSV.

Les retours et les frais de plateforme se rattachent aux commandes via la
colonne "N° de commande TikTok" (`external_order_id`) : importez d'abord vos
commandes avec cette colonne renseignée.

## Calcul de la marge nette (/dashboard et /products/[id])

`lib/margin/compute.ts` contient des fonctions pures (testées indépendamment
de la base et de l'UI) qui calculent, pour une période donnée :

- **Marge nette globale** = CA − coût produit − frais de plateforme − pub − retours.
  Une commande `cancelled` ne compte ni dans le CA ni dans le coût ; une
  commande `refunded` compte normalement et le retour associé vient
  soustraire son montant remboursé séparément.
- **Marge par produit**, en n'attribuant les dépenses pub / frais de
  plateforme au produit que lorsqu'ils sont explicitement liés à un SKU ou
  une commande. Les dépenses non rattachées à un produit n'apparaissent que
  dans le total global (c'est pourquoi la somme des marges produits peut
  différer de la marge globale).
- **Taux de retour par produit** = nombre de commandes retournées / nombre
  de commandes, sur la période.
- **Évolution temporelle** (jour par jour) de la marge, dont la somme sur la
  période reconstitue exactement la marge globale — vérifié avec un jeu de
  données de test.

`lib/margin/queries.ts` récupère l'historique complet d'une boutique
(commandes jointes aux produits, retours joints aux commandes, dépenses pub,
frais de plateforme) et le normalise pour ces fonctions ; le filtrage par
période se fait ensuite en mémoire. Adapté au volume d'un import CSV manuel
— à revoir avec une agrégation SQL si le nombre de lignes grossit beaucoup.

Le sélecteur de période (`components/dashboard/DateRangePicker.tsx`) pilote
tout via les paramètres d'URL (`?preset=30d` ou `?from=...&to=...`), donc
`/dashboard` et `/products/[id]` restent des Server Components.

## Déploiement sur Vercel

Le repo GitHub contient plusieurs projets à sa racine ; celui-ci vit dans
`tiktok-shop-analytics/`. Sur Vercel, chaque app se déploie comme un projet
distinct avec son propre **Root Directory**.

### 1. Importer le projet

1. Sur [vercel.com/new](https://vercel.com/new), importez le repo GitHub.
2. Dans **Root Directory**, sélectionnez `tiktok-shop-analytics` (pas la
   racine du repo).
3. Vercel détecte automatiquement le framework Next.js
   (`vercel.json` le précise aussi explicitement) — aucune commande de build
   à changer.

### 2. Renseigner les variables d'environnement

Dans **Project Settings > Environment Variables**, ajoutez pour
Production, Preview et Development :

| Variable                        | Valeur                                   | Visibilité |
| -------------------------------- | ----------------------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | URL de votre projet Supabase              | Publique (exposée au navigateur) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Clé anonyme (Project Settings > API)      | Publique (exposée au navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY`      | Clé service role (Project Settings > API) | **Secrète** — ne jamais préfixer par `NEXT_PUBLIC_` ; réservée à un futur usage serveur (opérations admin contournant la RLS), non utilisée par le code actuel |

Utilisez de préférence un **projet Supabase distinct pour Preview/dev** afin
de ne pas mélanger des données de test avec la production.

### 3. Mettre à jour les Redirect URLs Supabase

Dans le dashboard Supabase, **Authentication > URL Configuration**, ajoutez
l'URL de callback de votre domaine Vercel :

- `https://<votre-domaine>.vercel.app/auth/callback`
- Si vous utilisez les Preview Deployments, ajoutez aussi un pattern
  générique (`https://*-<votre-org>.vercel.app/auth/callback`) ou l'URL de
  chaque preview au fur et à mesure.

### 4. Déployer

Chaque push sur la branche de production déclenche un déploiement ; chaque
PR obtient une Preview Deployment. Aucune configuration `vercel.json`
supplémentaire n'est nécessaire (Server Components, Server Actions et le
middleware d'auth fonctionnent nativement sur l'Edge/Node runtime de
Vercel).

## Feuille de route

- [x] Étape 1 — Scaffold Next.js + Supabase Auth
- [x] Étape 2 — Schéma Postgres (stores, products, orders, returns, ad_spend, platform_fees) + RLS
- [x] Étape 3 — Import CSV avec mapping de colonnes
- [x] Étape 4 — Dashboard (marge nette, graphique, tableau produits, taux de retour)
- [x] Étape 5 — Vue détaillée par produit
