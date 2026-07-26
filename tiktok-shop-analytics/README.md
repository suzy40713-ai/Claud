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

## Feuille de route

- [x] Étape 1 — Scaffold Next.js + Supabase Auth
- [x] Étape 2 — Schéma Postgres (stores, products, orders, returns, ad_spend, platform_fees) + RLS
- [ ] Étape 3 — Import CSV avec mapping de colonnes
- [ ] Étape 4 — Dashboard (marge nette, graphique, tableau produits, taux de retour)
- [ ] Étape 5 — Vue détaillée par produit
