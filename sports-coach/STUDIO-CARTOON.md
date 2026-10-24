# Studio Cartoon (remplace l'interface Cadenzo)

Le site web (GitHub Pages, `packages/frontend`) vend désormais la formation **Studio Cartoon**
(sketchs animés pour TikTok, Shorts et YouTube). Le serveur (`packages/backend`, Railway) garde sa
configuration : Stripe, Resend, base de données.

## Pages du site

| Adresse | Rôle |
|---|---|
| `/` | Page de vente, aperçu gratuit contre email, achat Stripe |
| `/apercu` | Aperçu gratuit (modules 0 et 1, inclus dans le site) |
| `/merci` | Retour de Stripe : vérifie le paiement, affiche le lien d'accès |
| `/formation?acces=…` | Formation complète, chargée depuis le serveur (jamais incluse dans le site public) |
| `/mentions-legales`, `/cgv`, `/confidentialite` | À compléter avant la mise en vente |

## Serveur : `/api/formation`

- `GET /status`, `POST /create-checkout-session` (case de renonciation obligatoire), `GET /confirm?session_id=`,
  `GET /content?acces=`, `GET /pdf?acces=`.
- Le lien d'accès est l'ID de session Stripe signé avec `JWT_SECRET` : ne change pas `JWT_SECRET`
  après les premières ventes, sinon les anciens liens ne marchent plus.
- L'achat est enregistré dans `ebook_purchases` (produit `studio-cartoon`) et l'email (lien + PDF) part
  une seule fois, depuis le webhook Stripe existant ou depuis la page `/merci`.
- Aperçu gratuit : `POST /api/leads/capture` avec la source `studio-cartoon-apercu`. Les relances
  automatiques ne concernent que ces contacts (les anciens contacts sport ne reçoivent plus rien).

## Variables d'environnement (Railway)

- `FORMATION_PRICE_CENTS` : prix en centimes (2900 = 29 € par défaut).
- `EBOOK_SENDER_EMAIL` : expéditeur des emails, par exemple `Studio Cartoon <formation@ton-domaine.fr>`.
- Inchangées : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FRONTEND_ORIGIN`, `JWT_SECRET`.

## Mettre à jour le contenu

Le contenu vient de `cartoon-train/formation/contenu.py` (branche `ccr-461cd52d-nskjen`). Après une
modification, régénérer `packages/backend/formation-assets/formation-content.json`,
`packages/frontend/src/features/formation/preview.json` et le PDF avec `formation/build.py` (`export_json`).

## Ce qui reste en place côté serveur

Les anciennes routes de l'application Cadenzo (comptes, coach, ebooks…) restent actives pour ne pas
casser l'application Android déjà installée, mais le site web ne les utilise plus.
