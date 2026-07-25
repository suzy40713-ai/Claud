# ClipAI

Transforme tes lives/vidéos longues en clips courts prêts à poster (TikTok, Reels, Shorts).

Voir `docs/ARCHITECTURE.md` pour l'architecture complète et les décisions techniques.

## Structure

```
apps/
  mobile/   Expo (React Native) + TypeScript
  api/      Node.js + TypeScript (Fastify) + Postgres + Redis/BullMQ
workers/
  video-processor/   Worker Python (transcription, découpage, sous-titres)
infra/
  docker-compose.yml   Postgres + Redis en local
docs/
```

## Démarrer en local

### 1. Base de données et Redis (local, gratuit)

```bash
cd infra && docker compose up -d
```

(Alternative sans Docker : `apt install postgresql redis-server` fonctionne aussi bien en dev.)

### 2. API

```bash
cd apps/api
cp .env.example .env   # renseigner DATABASE_URL, CLERK_SECRET_KEY, REDIS_URL, R2_*, INTERNAL_API_SECRET
npm install
npm run db:migrate
npm run dev
```

### 3. Worker vidéo (Python)

```bash
cd workers/video-processor
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # mêmes REDIS_URL/R2_*/INTERNAL_API_SECRET que l'API, + GROQ_API_KEY
python -m app.main
```

Nécessite `ffmpeg` installé localement (`apt install ffmpeg` sur Debian/Ubuntu).

### 4. Mobile

```bash
cd apps/mobile
cp .env.example .env   # renseigner EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL
npm install
npm run start
```

Ouvre l'app dans Expo Go sur ton téléphone (scan du QR code). Le téléphone doit pouvoir
joindre l'API — en dev local, utilise l'IP locale de ta machine dans `EXPO_PUBLIC_API_URL`
plutôt que `localhost`.

## Comptes externes nécessaires (tous gratuits pour démarrer)

- [Clerk](https://clerk.com) — auth (récupérer `CLERK_SECRET_KEY` et `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`),
  activer Google + Apple Sign-In dans le dashboard
- [Neon](https://neon.tech) — PostgreSQL gratuit (`DATABASE_URL`)
- [Upstash](https://upstash.com) — Redis gratuit (`REDIS_URL`, format `rediss://...`)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — stockage vidéos/clips : créer un bucket,
  un jeton API R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)
- [Groq](https://console.groq.com) — transcription Whisper + scoring LLM, gratuit avec limites de
  débit (`GROQ_API_KEY`)
- [RevenueCat](https://revenuecat.com) — optionnel pour l'instant, uniquement nécessaire pour activer
  les vrais paiements (le paywall fonctionne sans, en mode "bientôt disponible")

`INTERNAL_API_SECRET` n'est pas un compte externe — c'est une valeur que tu inventes toi-même
(chaîne aléatoire), à mettre à l'identique dans `apps/api/.env` et `workers/video-processor/.env`.

Apple Developer (99$/an) et Google Play Console (25$) ne sont nécessaires **que** pour publier
réellement sur les stores — pas requis pour le développement (Expo Go suffit).

## État actuel

- ✅ Auth (email + Google/Apple via Clerk), navigation (upload / résultats / compte)
- ✅ Upload de vidéo (galerie → URL présignée R2 → mise en file d'attente)
- ✅ Pipeline de traitement complet : transcription (Groq Whisper), analyse audio (énergie),
  scoring des moments forts (heuristique + reclassement LLM), découpage 9:16, sous-titres
  animés mot par mot, miniatures — testé de bout en bout avec une vidéo synthétique
- ✅ Écran de résultats connecté aux vraies données (liste, export/partage, suppression)
- ✅ Compteur d'usage + paywall (quota appliqué côté serveur, écran d'upsell mobile),
  RevenueCat câblé mais nécessite un compte pour activer les vrais paiements

Testé localement (Postgres + Redis réels) : migrations, endpoints API (auth, quotas, upload,
callbacks internes du worker), pipeline ffmpeg complet (découpage, recadrage, sous-titres,
miniature). **Pas encore testé avec un vrai compte Groq/Clerk/R2** — c'est la prochaine chose à
faire une fois ces comptes créés.

## Prêt pour de vrais utilisateurs ?

Pas encore. Ce qui reste avant un lancement public :

- Test de bout en bout avec de vrais comptes externes (Clerk, Neon, Upstash, R2, Groq)
- Webhook RevenueCat → API pour mettre à jour `subscriptions.plan` après un vrai paiement
  (le paywall déclenche l'achat côté app, mais rien ne met encore à jour la base derrière)
- Tests automatisés (API + logique de scoring)
- Monitoring des erreurs (ex: Sentry) et des temps de traitement
- Passage sur des tiers payants pour l'hébergement (le tier gratuit a des cold starts et
  des limites de ressources incompatibles avec de vrais utilisateurs simultanés)
- Comptes Apple Developer / Google Play + review store
- Politique de confidentialité / CGU (obligatoire pour la collecte de données utilisateur
  et la publication sur les stores)
- Nettoyage des fichiers R2 orphelins (vidéo source supprimée après traitement, clips
  supprimés par l'utilisateur ne libèrent pas encore le stockage)
