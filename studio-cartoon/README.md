# Studio Cartoon — site de la formation

Site de vente et d'accès à la formation « Studio Cartoon » (sketchs animés pour TikTok, Shorts et YouTube),
sur le même principe que les ebooks Cadenzo : page de vente, paiement Stripe Checkout, accès livré par email.

## Pages

| Adresse | Rôle |
|---|---|
| `/` | Page de vente, aperçu gratuit contre email, bouton d'achat |
| `/apercu` | Aperçu gratuit (modules 0 et 1) |
| `/merci` | Retour de Stripe : vérifie le paiement, envoie l'email, donne le lien d'accès |
| `/formation?acces=…` | Formation complète (13 modules, 59 leçons), réservée aux acheteurs |
| `/telecharger?acces=…` | Cahier PDF |
| `/mentions-legales`, `/cgv` | Modèles à compléter |

Le lien d'accès est l'identifiant de la session Stripe signé avec `ACCESS_SECRET` : pas de base de données.
Ne change jamais `ACCESS_SECRET` après les premières ventes, sinon les anciens liens ne marchent plus.

## Configuration

Copie `.env.example` et remplis les variables (voir les commentaires). Sans `STRIPE_SECRET_KEY`, le site
s'affiche mais le bouton d'achat indique que le paiement n'est pas activé. Sans `RESEND_API_KEY`, l'accès
est donné sur la page `/merci` mais aucun email n'est envoyé.

## Mettre à jour le contenu

Le contenu vient de `cartoon-train/formation/contenu.py`. Après une modification :

```bash
cd cartoon-train && python3 formation/build.py
cp formation/studio-cartoon-formation.pdf ../studio-cartoon/assets/
```

## Lancer en local

```bash
npm install
npm run dev
```

## Déployer

Le service `studio-cartoon` est déclaré dans `render.yaml` (Docker, plan gratuit). Sur Render :
renseigne `STRIPE_SECRET_KEY`, `PUBLIC_ORIGIN` (l'adresse du site), `RESEND_API_KEY` et `SENDER_EMAIL`.
