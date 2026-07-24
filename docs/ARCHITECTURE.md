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

Squelette : auth (Clerk, email + Google/Apple) + navigation mobile, API de base avec
`/health` et `/api/me`, schéma DB + migration générée. Pipeline vidéo pas encore implémenté.
