# AdHunter

> Trouve les publicités gagnantes. Crée des campagnes plus intelligentes.

AdHunter est un SaaS qui aide les e-commerçants, dropshippers et agences à explorer les **bibliothèques publicitaires officielles** (Meta Ad Library, TikTok Commercial Content API), à **analyser les publicités avec l'IA**, à **générer leurs propres campagnes** et à suivre les **tendances** observées — sans jamais inventer de chiffres de ventes, de budgets ou de conversions.

## Fonctionnalités

| Module | Route | Formule | Contrôle côté serveur |
|---|---|---|---|
| Landing, fonctionnalités, tarifs, blog, FAQ, pages légales, contact | `/`, `/fonctionnalites`, `/tarifs`, `/blog`, `/legal/*`, `/contact` | Public | — |
| Authentification (inscription, connexion, déconnexion, mot de passe oublié/réinitialisation) | `/signup`, `/login`, `/forgot-password`, `/reset-password` | — | Supabase Auth |
| Tableau de bord (stats, consultées récemment, favoris, tendances, historique, suggestions, raccourcis) | `/app` | Tous | RLS |
| Ad Library (niche, plateforme, pays, langue, format, mot-clé, période ; avancé : annonceur, statut, dates) | `/app/library` | Tous (avancé : Business) | quota `searches_per_month`, `results_per_search`, filtres avancés retirés hors Business |
| AI Ad Analyzer | `/app/ads/[id]#analyse`, `/app/analyzer` | Tous | quota `ai_analyses_per_month` (atomique, remboursé en cas d'échec) |
| Ad Creator (copier / modifier / enregistrer) | `/app/creator` | Pro, Business | feature `ad_creator` + quota `ai_creations_per_month` |
| Trend Radar (graphiques, taille d'échantillon, seuil « données insuffisantes ») | `/app/trends` | Pro, Business | feature `trend_radar` |
| Favoris + notes, collections, organisation par niche | `/app/favorites`, `/app/collections` | Tous (1 collection en Free) | RLS + limite `collections_max` |
| Historique des recherches | `/app/history` | Pro, Business | feature `search_history` |
| Équipe (10 membres, collections partagées) | `/app/team` | Business | feature `teams` + RLS `is_team_member` |
| Exports CSV / JSON | `/api/export/collection/[id]` | Business | feature `exports` + quota `exports_per_month` |
| Abonnement (paiement, changement de formule, résiliation, réactivation, factures, portail Stripe) | `/app/billing` | Tous | Stripe + webhook |
| Paramètres (profil, mot de passe, tutoriel, export RGPD, suppression du compte) | `/app/settings`, `/api/export/account` | Tous | RLS |
| Administration (stats, utilisateurs, rôles, formules manuelles, abonnements, offres et limites, interrupteurs de fonctionnalités, erreurs, messages) | `/admin/*` | Admins | `profiles.role = 'admin'` ou `ADMIN_EMAILS`, revérifié dans chaque action |

UX : tutoriel interactif au premier lancement, infobulles, états vides avec conseils, squelettes de chargement, notifications (toasts), messages d'erreur en français, navigation mobile, bandeau d'information cookies.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + TypeScript + Tailwind CSS, composants Radix/shadcn
- **Supabase** : Postgres + Auth, **Row Level Security** sur toutes les tables
- **Stripe** : Checkout (abonnements), API d'abonnement (changement/résiliation), Customer Portal, webhook
- **Claude (Anthropic)** via le SDK officiel `@anthropic-ai/sdk`, sorties structurées validées par Zod
- **Recharts** pour les graphiques

## Démarrage rapide

```bash
cd adhunter
npm install
cp .env.example .env.local   # puis remplis les variables
npm run dev
```

### 1. Supabase (obligatoire)

1. Crée un projet sur [supabase.com](https://supabase.com) (région UE recommandée pour le RGPD).
2. **SQL Editor** → exécute [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
3. **Authentication → URL Configuration** : `Site URL` = ton domaine ; ajoute `https://ton-domaine/auth/callback` aux *Redirect URLs*.
4. **Authentication → Providers → Email** : laisse **« Confirm email » activé** en production, et configure un SMTP (Resend, Postmark…) pour les emails de confirmation et de réinitialisation.
5. Renseigne `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
6. Premier administrateur : ajoute ton email à `ADMIN_EMAILS` (ou `update profiles set role = 'admin' where email = '…'`).

### 2. Stripe (abonnements)

1. Crée deux produits avec un **prix récurrent mensuel** : Pro 19,99 € TTC et Business 49,99 € TTC. Copie leurs `price_…` dans `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` (ou dans **Admin → Offres & limites**).
2. **Webhook** → endpoint `https://ton-domaine/api/stripe/webhook`, événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.payment_failed`. Copie le secret dans `STRIPE_WEBHOOK_SECRET`.
3. **Customer Portal** (Settings → Billing → Customer portal) : active la gestion des moyens de paiement et l'historique des factures.
4. Facultatif : Stripe Tax → `STRIPE_AUTOMATIC_TAX=true`.
5. En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Le plan d'un utilisateur est **toujours** dérivé de la table `subscriptions`, écrite uniquement par le webhook (clé service) ou par un administrateur. Le navigateur ne voit jamais la clé secrète Stripe.

### 3. IA (AI Analyzer, Ad Creator)

`ANTHROPIC_API_KEY` (côté serveur uniquement). Modèle par défaut : `claude-opus-5-5`, configurable avec `ANTHROPIC_MODEL` ; `ANTHROPIC_EFFORT` (`low` | `medium` | `high`) règle le compromis qualité/coût. Pour réduire les coûts, `ANTHROPIC_MODEL=claude-sonnet-5-5` et/ou `ANTHROPIC_EFFORT=low`. Les quotas mensuels par formule plafonnent la dépense par utilisateur ; une génération échouée est remboursée sur le quota. Le repli serveur (`fallbacks: "default"`) prend le relais si le modèle principal décline une requête.

### 4. Sources publicitaires (API officielles uniquement)

- **Meta Ad Library API** — [facebook.com/ads/library/api](https://www.facebook.com/ads/library/api) : app Meta for Developers, confirmation d'identité, jeton d'accès → `META_ACCESS_TOKEN` (`META_GRAPH_VERSION` facultatif). Les publicités **commerciales** ne sont exposées que pour les pays **UE/EEE** (DSA) ; l'interface le signale. L'API ne fournit pas les fichiers visuels : chaque publicité renvoie vers sa page officielle.
- **TikTok Commercial Content API** — [developers.tiktok.com](https://developers.tiktok.com/products/commercial-content-api) : accès soumis à approbation → `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. Les noms de champs sont centralisés dans `src/lib/ads/sources/tiktok.ts` : vérifie-les avec la documentation fournie lors de l'approbation.
- **TikTok Creative Center** n'a pas d'API publique : il n'est pas intégré (pas de scraping).

Les résultats sont mis en cache 6 h (`search_cache`, données publiques partagées) pour limiter les appels API ; relancer la même recherche dans les 30 min et paginer ne consomment pas de quota.

### 5. Mode démo

`DEMO_MODE=true` active une source de **publicités fictives** (marques inventées, badge « DÉMO ») et, sans clé IA, des **résultats d'analyse/création modèles** clairement étiquetés « Résultat de démonstration — non généré par l'IA ». À désactiver en production. Sans mode démo, une intégration non configurée affiche « en préparation » au lieu de simuler un résultat.

### 6. Informations légales

Avant la mise en ligne, renseigne les variables `NEXT_PUBLIC_LEGAL_*` (raison sociale, adresse, RCS, TVA, directeur de publication, hébergeur, **médiateur de la consommation**) et `NEXT_PUBLIC_CONTACT_EMAIL`. Fais relire les CGU/CGV/politique de confidentialité par un professionnel du droit.

## Intégrations nécessitant encore des clés ou une configuration externe

| Intégration | Variables | Sans configuration |
|---|---|---|
| Supabase (obligatoire) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Pages publiques OK ; espace connecté inaccessible |
| SMTP (dans Supabase) | — | Emails de confirmation/réinitialisation limités par Supabase |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS` | « Paiements en préparation », boutons d'achat désactivés |
| IA Anthropic | `ANTHROPIC_API_KEY` | « Analyse IA en préparation » |
| Meta Ad Library API | `META_ACCESS_TOKEN` | Source « en préparation » |
| TikTok Commercial Content API | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | Source « en préparation » |
| Identité légale | `NEXT_PUBLIC_LEGAL_*`, `NEXT_PUBLIC_CONTACT_EMAIL` | Placeholders `[… à compléter]` affichés |

## Sécurité

- **RLS partout** : chaque utilisateur ne lit/modifie que ses lignes ; les collections d'équipe sont visibles par les seuls membres.
- **Écritures sensibles réservées au serveur** : `subscriptions`, `usage_events`, `ads`, `plans`, `feature_flags`, `app_errors`, création de collections (limite de formule) — aucune policy d'écriture pour `authenticated`.
- `profiles.role` non modifiable par l'utilisateur (droits par colonne).
- Quotas consommés **atomiquement** via `consume_quota` (verrou consultatif, exécutable uniquement par la clé service).
- Toutes les Server Actions revérifient la session, la formule et les feature flags ; les actions admin revérifient le rôle.
- Clés Stripe/IA/Meta/TikTok et `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (`server-only`).
- Webhook Stripe signé et idempotent (`stripe_events`).
- Redirections post-connexion limitées aux chemins internes ; export CSV protégé contre l'injection de formules ; en-têtes de sécurité (HSTS, X-Frame-Options, nosniff…).

## RGPD

Case CGU/confidentialité obligatoire à l'inscription (horodatée), opt-in marketing séparé, export JSON de toutes les données (`/api/export/account`), suppression du compte en self-service (cascade + résiliation Stripe), uniquement des cookies strictement nécessaires, tendances calculées sur des agrégats anonymes, case de demande d'exécution immédiate avant paiement (art. L221-25 C. conso), résiliation en ligne en quelques clics.

## Tests

```bash
npm run typecheck && npm run lint
npm test                                   # tests unitaires (plans, droits, sources, CSV, schémas IA)
# tests de sécurité RLS sur un Postgres jetable (le stub recrée les objets Supabase nécessaires) :
psql "$DB_URL" -f supabase/tests/supabase-stub.sql -f supabase/migrations/0001_init.sql -f supabase/tests/rls.test.sql
node e2e/smoke.mjs                         # parcours complet dans Chromium (app lancée, DEMO_MODE=true,
                                           # auto-confirmation email, ADMIN_EMAILS=admin@test.dev)
```

Le test E2E couvre : landing/SEO/pages légales, redirection des pages privées, inscription, tutoriel, recherche, favoris, collections et limite Free, analyse IA et quota, verrous des fonctionnalités payantes, page d'abonnement non configurée, accès admin refusé/autorisé, attribution manuelle d'une formule, Ad Creator (génération + modification), Trend Radar, exports, historique, équipe, recherche avancée, rendu mobile sans défilement horizontal, suppression du compte.

La CI GitHub Actions (`.github/workflows/adhunter-ci.yml`) exécute lint, typecheck, tests unitaires, build, migration et tests RLS à chaque push touchant `adhunter/`.

## Déploiement

Vercel (recommandé) : *Root Directory* = `adhunter`, variables d'environnement ci-dessus, `NEXT_PUBLIC_APP_URL` = domaine de production. Les pages marketing sont statiques (le middleware ne s'exécute que sur `/app`, `/admin`, `/api/export` et les pages d'authentification).

## Structure

```
src/
  app/(marketing)/      landing, fonctionnalités, tarifs, blog, contact, légal
  app/(auth)/           inscription, connexion, mot de passe
  app/app/              espace client (dashboard, library, analyzer, creator, trends…)
  app/admin/            administration
  app/api/              webhook Stripe, exports
  lib/account.ts        session, formule effective, quotas, feature flags
  lib/plans.ts          catalogue des formules et règles d'accès (pur, testé)
  lib/ads/              sources officielles (Meta, TikTok, démo) + orchestration/cache
  lib/ai/               client Claude, prompts, schémas Zod
  lib/stripe/           client Stripe + synchronisation des abonnements
  lib/actions/          Server Actions (toutes revérifient les droits)
supabase/migrations/    schéma + RLS
supabase/tests/         tests de sécurité SQL
```
