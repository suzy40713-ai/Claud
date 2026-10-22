# Mettre LaunchPilot en ligne — guide pas à pas

Durée estimée : 1 à 2 heures. Coût de départ : 0 € (offres gratuites) + quelques euros de crédits IA.

Ordre conseillé : **Supabase → Clé IA → Vercel → Stripe → Test final**.

---

## Étape 0 — Prérequis administratifs (France)

Pour encaisser de l'argent réel avec Stripe, il faut une structure légale. Le plus simple :
**micro-entreprise** (gratuite, en ligne sur [formalites.entreprises.gouv.fr](https://formalites.entreprises.gouv.fr)).
Tu obtiens un SIRET en 1 à 2 semaines. En attendant, tu peux tout déployer et tester Stripe en **mode test**.

Pense aussi à ajouter sur le site : mentions légales, CGV et politique de confidentialité (obligatoires).

---

## Étape 1 — Supabase (base de données + comptes utilisateurs)

1. Crée un compte sur [supabase.com](https://supabase.com) → **New project** (région : Europe, ex. Paris/Frankfurt). Note bien le mot de passe de la base.
2. Menu **SQL Editor** → colle et exécute le contenu de `supabase/migrations/0001_init.sql`, puis celui de `supabase/migrations/0002_pay_per_plan.sql`.
3. Menu **Project Settings → API** : copie
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secrète, ne la partage jamais)

(On reviendra à Supabase à l'étape 3 pour les URL de redirection.)

---

## Étape 2 — Clé IA (Anthropic)

1. Crée un compte sur [platform.claude.com](https://platform.claude.com), ajoute un moyen de paiement et 5 à 10 € de crédits.
2. **API Keys → Create Key** → copie la clé (`sk-ant-...`) → `ANTHROPIC_API_KEY`.
3. Dans **Limits**, fixe une limite de dépense mensuelle (ex. 20 €) pour éviter toute surprise.

Un plan généré coûte environ quelques centimes d'API, vendu 14,99 €.

---

## Étape 3 — Vercel (hébergement du site)

1. Crée un compte sur [vercel.com](https://vercel.com) avec ton compte GitHub.
2. **Add New → Project** → importe le dépôt `Claud`.
3. **Root Directory** : clique sur *Edit* et choisis `launchpilot` (important !). Framework : Next.js (détecté automatiquement).
4. **Environment Variables** — ajoute :

   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | étape 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | étape 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | étape 1 |
   | `AI_PROVIDER` | `anthropic` |
   | `ANTHROPIC_API_KEY` | étape 2 |
   | `NEXT_PUBLIC_APP_URL` | l'adresse du site, ex. `https://launchpilot.vercel.app` (à corriger après le 1er déploiement si besoin) |

5. **Deploy**. Note l'adresse obtenue (ex. `https://launchpilot-xxx.vercel.app`). Si elle diffère de `NEXT_PUBLIC_APP_URL`, corrige la variable puis **Redeploy**.
6. Retour dans Supabase → **Authentication → URL Configuration** :
   - **Site URL** : ton adresse Vercel
   - **Redirect URLs** : ajoute `https://TON-ADRESSE/auth/callback`

À ce stade, l'inscription et la connexion fonctionnent. Le bouton d'achat affiche « paiement pas encore disponible » tant que Stripe n'est pas configuré (protection : aucun plan n'est offert gratuitement en production).

---

## Étape 4 — Stripe (paiements)

Commence en **mode test** (interrupteur « Test mode » en haut du tableau de bord), passe en mode réel une fois le SIRET obtenu — les étapes sont identiques, avec les clés « live ».

1. Crée un compte sur [stripe.com](https://stripe.com).
2. **Product catalog → Add product** : nom « Plan LaunchPilot », prix **14,99 EUR**, type **One-off** (pas récurrent). Copie l'ID du prix (`price_...`) → `STRIPE_PRICE_ID_PLAN`.
3. **Developers → API keys** :
   - `Secret key` (`sk_...`) → `STRIPE_SECRET_KEY`
   - `Publishable key` (`pk_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. **Developers → Webhooks → Add endpoint** :
   - URL : `https://TON-ADRESSE/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Copie le **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`
5. Ajoute ces 4 variables dans Vercel (**Settings → Environment Variables**) puis **Deployments → Redeploy**.

---

## Étape 5 — Test final

1. Ouvre le site, crée un compte, confirme l'email.
2. Remplis l'onboarding, clique sur acheter.
3. En mode test, paie avec la carte `4242 4242 4242 4242`, date future, CVC quelconque.
4. Vérifie : le crédit apparaît, le plan se génère, et le paiement est visible dans Stripe.

Si tout marche : passe Stripe en mode réel (étape 4 avec les clés live), et LaunchPilot est officiellement en vente.

---

## Ensuite (optionnel)

- **Nom de domaine** : achète `launchpilot.fr` (ou autre) ~10 €/an, ajoute-le dans Vercel → **Settings → Domains**, puis mets à jour `NEXT_PUBLIC_APP_URL`, Supabase (Site URL / Redirect URLs) et l'URL du webhook Stripe.
- **Emails** : par défaut Supabase limite les emails envoyés. Pour un vrai lancement, configure un SMTP (ex. Resend, Brevo) dans **Authentication → SMTP Settings**.

## En cas de problème

- **Erreur au build sur Vercel** : vérifie que le *Root Directory* est bien `launchpilot`.
- **Le lien de confirmation d'email ne marche pas** : vérifie les Redirect URLs Supabase (étape 3.6).
- **Paiement OK mais pas de crédit** : vérifie l'URL et le secret du webhook Stripe, et regarde les logs dans Stripe → Webhooks.
