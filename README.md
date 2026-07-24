# ClipAI

Transforme tes lives/vidéos longues en clips courts prêts à poster (TikTok, Reels, Shorts).

Voir `docs/ARCHITECTURE.md` pour l'architecture complète et les décisions techniques.

## Structure

```
apps/
  mobile/   Expo (React Native) + TypeScript
  api/      Node.js + TypeScript (Fastify) + Postgres
workers/
  video-processor/   Worker Python (à venir)
infra/
  docker-compose.yml   Postgres + Redis en local
docs/
```

## Démarrer en local

### 1. Base de données et Redis (local, gratuit)

```bash
cd infra && docker compose up -d
```

### 2. API

```bash
cd apps/api
cp .env.example .env   # renseigner DATABASE_URL et CLERK_SECRET_KEY
npm install
npm run db:migrate
npm run dev
```

### 3. Mobile

```bash
cd apps/mobile
cp .env.example .env   # renseigner EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
npm install
npm run start
```

Ouvre l'app dans Expo Go sur ton téléphone (scan du QR code).

## Comptes externes nécessaires (tous gratuits pour démarrer)

- [Clerk](https://clerk.com) — auth (récupérer `CLERK_SECRET_KEY` et `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`),
  activer Google + Apple Sign-In dans le dashboard
- [Neon](https://neon.tech) — PostgreSQL gratuit (`DATABASE_URL`)
- [Upstash](https://upstash.com) — Redis gratuit (queue BullMQ, à connecter à l'étape pipeline)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — stockage vidéos/clips (à connecter à l'étape pipeline)
- [Groq](https://console.groq.com) — transcription Whisper + scoring LLM, gratuit avec limites de débit (à connecter à l'étape pipeline)

Apple Developer (99$/an) et Google Play Console (25$) ne sont nécessaires **que** pour publier
réellement sur les stores — pas requis pour le développement (Expo Go suffit).

## État actuel

- ✅ Auth (email + Google/Apple via Clerk), navigation (upload / résultats / compte)
- ✅ API de base (`/health`, `/api/me`), schéma DB, migration générée
- ⬜ Upload de vidéo (prochaine étape)
- ⬜ Pipeline de traitement (transcription, découpage, sous-titres)
- ⬜ Écran de résultats connecté aux vraies données
- ⬜ Abonnement / paywall (RevenueCat)

## Prêt pour de vrais utilisateurs ?

Pas encore. Ce qui reste avant un lancement public, en plus des étapes ci-dessus :

- Tests automatisés (API + logique de scoring)
- Monitoring des erreurs (ex: Sentry) et des temps de traitement
- Passage sur des tiers payants pour l'hébergement (le tier gratuit a des cold starts et
  des limites de ressources incompatibles avec de vrais utilisateurs simultanés)
- Comptes Apple Developer / Google Play + review store
- Politique de confidentialité / CGU (obligatoire pour la collecte de données utilisateur
  et la publication sur les stores)
