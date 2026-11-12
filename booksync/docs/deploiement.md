# Mettre BookSync en ligne

Ce guide part de zéro. Comptez environ une heure. Les étapes signalées **(gratuit)** n'engagent aucune dépense.

## 1. Base de données — Supabase (gratuit)

1. Sur [supabase.com](https://supabase.com), créez un projet nommé `booksync`, région **Europe (Frankfurt ou Paris)**.
2. _Project Settings → Database → Connection string_ : copiez l'URL **Session pooler** (port 5432)
   et ajoutez `?sslmode=require` à la fin. C'est votre `DATABASE_URL`.
3. Rien d'autre à faire : les tables, index, contraintes et politiques RLS sont créés automatiquement
   par les migrations au premier démarrage de l'application.

> L'API REST publique de Supabase n'a accès à aucune donnée : la RLS est activée sans politique
> sur toutes les tables et les droits des rôles `anon`/`authenticated` sont révoqués.

## 2. Hébergement — Render (gratuit pendant le développement)

1. Sur [render.com](https://render.com) : _New → Blueprint_, choisissez ce dépôt.
   Render lit `render.yaml` et crée le service `booksync` (Docker, région Francfort).
2. Renseignez les variables demandées (voir le tableau ci-dessous). `BETTER_AUTH_SECRET` et
   `CRON_SECRET` sont générés automatiquement par Render.
3. Déployez. Vérifiez `https://<votre-service>.onrender.com/api/health` → `{"status":"ok"}`.

> Le plan gratuit de Render se met en veille après 15 minutes sans visite (premier chargement lent).
> Passez au plan **Starter (7 $/mois)** avant d'ouvrir l'application à vos clients — **dépense à valider**.

## 3. Rappels automatiques — Supabase pg_cron (gratuit)

Les rappels 24 h / 2 h et les nouvelles tentatives d'envoi sont traités par `/api/cron/notifications`.
Dans Supabase : _Database → Extensions_, activez **pg_cron** et **pg_net**, puis dans le _SQL Editor_ :

```sql
select cron.schedule(
  'booksync-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://VOTRE-DOMAINE/api/cron/notifications',
    headers := jsonb_build_object('Authorization', 'Bearer VOTRE_CRON_SECRET'),
    timeout_milliseconds := 30000
  );
  $$
);
```

Remplacez `VOTRE-DOMAINE` et `VOTRE_CRON_SECRET` (valeur visible dans Render → Environment).
L'appel toutes les 5 minutes réveille aussi le service s'il est en veille.

## 4. Emails — Resend (gratuit jusqu'à 3 000 emails/mois)

1. Créez un compte sur [resend.com](https://resend.com), ajoutez votre domaine et publiez les
   enregistrements DNS (SPF, DKIM) indiqués.
2. Créez une clé API → `RESEND_API_KEY`. Définissez `EMAIL_FROM`, par ex. `BookSync <rdv@votre-domaine.fr>`.

Sans clé, les emails sont enregistrés dans la table `email_message` mais **ne sont pas envoyés**
(les comptes ne pourraient pas confirmer leur adresse) : cette étape est indispensable.

## 5. Abonnements — Stripe Billing (commission par paiement, sans abonnement)

1. Dans le tableau de bord Stripe, passez en **mode test** et copiez la clé secrète `sk_test_…`.
2. Créez produits, prix et webhook en une commande :
   ```bash
   STRIPE_SECRET_KEY=sk_test_... pnpm tsx scripts/stripe-setup.ts https://VOTRE-DOMAINE/api/stripe/webhook
   ```
   Le script refuse les clés de production et affiche `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
   et `STRIPE_WEBHOOK_SECRET` à reporter dans Render.
3. _Settings → Billing → Customer portal_ : enregistrez une configuration (obligatoire pour le
   bouton « Moyen de paiement et factures »).
4. Testez avec la carte `4242 4242 4242 4242`, date future, CVC quelconque.
5. Pour la production : refaites les étapes 1 à 3 en mode live (après activation du compte Stripe).

## 6. Connexion avec Google (gratuit, facultatif)

1. [console.cloud.google.com](https://console.cloud.google.com) → _API et services → Identifiants_
   → _Créer un ID client OAuth_ (application Web).
2. URI de redirection autorisée : `https://VOTRE-DOMAINE/api/auth/callback/google`.
3. Reportez `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans Render. Le bouton « Continuer avec
   Google » apparaît automatiquement.

## 7. Assistant BookSync — Claude Haiku (payant à l'usage, facultatif)

L'assistant du forfait Pro reste **désactivé** tant que `ANTHROPIC_API_KEY` est absente : aucune
dépense possible. Pour l'activer (décision du propriétaire du compte) :

1. Sur [console.anthropic.com](https://console.anthropic.com), ajoutez un crédit prépayé (5 $ minimum)
   et, dans _Limits_, fixez une **limite de dépense mensuelle** côté Anthropic.
2. Créez une clé API → `ANTHROPIC_API_KEY` dans Render.
3. Ajustez `ASSISTANT_MONTHLY_BUDGET_USD` (5 $ par défaut) : au-delà, l'assistant se coupe jusqu'au
   mois suivant, toutes entreprises confondues.

Garde-fous intégrés : modèle `claude-haiku-5-5` (0,10 $ / 0,50 $ par million de jetons), effort de
réflexion bas, 1 500 jetons de sortie et 5 appels au plus par question, 300 questions par mois et par
entreprise, 40 par jour et par utilisateur, 6 par minute. Le coût réel de chaque appel est enregistré
(table `assistant_usage`). Ordre de grandeur : 0,1 à 0,3 centime par question.

## 8. Mentions légales

Renseignez les variables `NEXT_PUBLIC_LEGAL_*` (raison sociale, adresse, SIREN, TVA, directeur de
la publication) puis redéployez. Faites relire les conditions générales et la politique de
confidentialité par un juriste avant l'ouverture commerciale.

## Variables d'environnement

| Variable                                                                                 |     Obligatoire      | Où la trouver                                                      |
| ---------------------------------------------------------------------------------------- | :------------------: | ------------------------------------------------------------------ |
| `DATABASE_URL`                                                                           |          ✅          | Supabase → Connection string (Session pooler) + `?sslmode=require` |
| `NEXT_PUBLIC_APP_URL`                                                                    |          ✅          | URL publique, sans `/` final (ex. `https://booksync.fr`)           |
| `BETTER_AUTH_SECRET`                                                                     |          ✅          | Généré par Render                                                  |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                           |    ✅ en pratique    | Resend                                                             |
| `CRON_SECRET`                                                                            | ✅ pour les rappels  | Généré par Render, recopié dans pg_cron                            |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` | pour les abonnements | Stripe + `scripts/stripe-setup.ts`                                 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                               |      facultatif      | Google Cloud Console                                               |
| `NEXT_PUBLIC_LEGAL_*`                                                                    |  ✅ avant ouverture  | Vos informations de société                                        |
| `ANTHROPIC_API_KEY`                                                                      | facultatif (payant)  | Console Anthropic, après accord                                    |
| `ASSISTANT_MONTHLY_BUDGET_USD`                                                           |          —           | Plafond mensuel de l'assistant (5 par défaut)                      |
| `AUTH_RATE_LIMIT`                                                                        |          —           | Laisser `on`                                                       |

## Domaine personnalisé

Render → _Settings → Custom Domains_ : ajoutez `booksync.fr` (ou votre domaine) et créez
l'enregistrement DNS indiqué ; le certificat HTTPS est automatique. Mettez ensuite à jour
`NEXT_PUBLIC_APP_URL`, l'URL du webhook Stripe, l'URI Google et l'URL pg_cron.
