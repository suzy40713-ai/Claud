# ClipAI — Architecture

## Stack

- **Mobile** : Expo (React Native) + TypeScript, expo-router, Clerk (auth)
- **API** : Node.js + TypeScript, Fastify, Drizzle ORM, PostgreSQL
- **Worker vidéo/IA** : Python (ffmpeg, Groq Whisper API pour la transcription, librosa
  pour l'analyse audio, scoring LLM via Groq)
- **Queue** : Redis (Upstash) + BullMQ
- **Stockage** : Cloudflare R2 (vidéos + clips, zéro frais de sortie)
- **Paiement** : RevenueCat (+ Stripe si besoin web)
- **Hébergement** : Render (tier gratuit) pour commencer

## Schéma global

```
App Mobile (Expo/RN)
  -> API Node/TS (Fastify) -- Postgres (users, subscriptions, usage, videos, clips)
       -> Redis/BullMQ
            -> Worker Python (transcription, scoring, découpage, sous-titres)
                 -> Cloudflare R2 (stockage vidéos/clips)
                 -> Groq API (Whisper + scoring LLM)
```

## Flux d'un upload

1. Mobile : `POST /api/videos` → l'API vérifie le quota, crée la ligne `videos`, renvoie une
   URL présignée R2 (PUT direct depuis le téléphone, la vidéo ne transite jamais par l'API)
2. Mobile : upload direct vers R2, puis `POST /api/videos/:id/process` → statut `queued`,
   job ajouté à la queue BullMQ `video-processing`
3. Worker : consomme le job, télécharge la vidéo depuis R2, `ffprobe` pour la durée réelle,
   réserve le quota via `POST /internal/videos/:id/duration` (rejette si dépassement)
4. Worker : transcription (Groq Whisper, mots horodatés) + analyse d'énergie audio (librosa)
   → fenêtres candidates (15–90s) scorées par heuristique (énergie + ponctuation/mots-clés)
   → reclassement des meilleures par LLM (Groq Llama), repli sur l'heuristique si l'appel échoue
5. Worker : pour chaque clip retenu — découpage + recadrage 9:16 (ffmpeg), sous-titres
   animés mot par mot (ASS/libass), miniature, upload vers R2, puis
   `POST /internal/videos/:id/clips` pour créer la ligne en base
6. Worker : `PATCH /internal/videos/:id/status` → `completed` (ou `failed` avec le message
   d'erreur). Le mobile poll `GET /api/videos/:id` pendant le traitement.

Les routes `/internal/*` ne sont accessibles qu'avec le header `x-internal-secret` (valeur
partagée entre l'API et le worker, jamais exposée au mobile).

## Base de données

Voir `apps/api/src/db/schema.ts` pour la source de vérité (Drizzle).

- `users` — profil utilisateur, lié à Clerk via `external_auth_id`
- `subscriptions` — plan (free/pro/business), quota de minutes, statut RevenueCat
- `usage` — minutes consommées par période
- `videos` — vidéos uploadées, statut de traitement
- `clips` — clips générés à partir d'une vidéo
- `processing_jobs` — suivi des jobs BullMQ (statut, progression, erreurs)

## Décisions actées

- **Budget 0€** : uniquement des tiers gratuits (Clerk, Neon, Upstash, R2, Groq, Render).
  Contrainte acceptée : traitement plus lent, cold starts, durée de vidéo limitée en phase
  de test. On repasse sur des tiers payants seulement au moment de vrais utilisateurs.
- **Transcription** : Groq API (Whisper large-v3) plutôt qu'OpenAI — gratuit, pas de CB.
- **Sous-titres animés** : ffmpeg + ASS/libass (karaoke word-by-word), pas Remotion, pour
  rester léger sur du compute gratuit.
- **Publication stores** : différée. Apple Developer (99$/an) et Google Play (25$) ne
  sont nécessaires qu'au moment de publier réellement — dev/test via Expo Go et builds
  partagés directement.

## Statut actuel

MVP fonctionnellement complet : auth, upload, pipeline de traitement (transcription,
scoring, découpage, sous-titres), résultats, quota/paywall. Vérifié localement avec un
Postgres/Redis réels et une vidéo de test (le pipeline ffmpeg tourne de bout en bout) ;
pas encore vérifié avec de vrais comptes Clerk/Groq/R2 puisqu'ils n'ont pas encore été créés.
Reste à faire avant un lancement public : voir la section correspondante dans le README.
