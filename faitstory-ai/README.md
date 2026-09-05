# FAITSTORY AI

Application web qui genere automatiquement des videos TikTok verticales (1080x1920) a partir d'un simple sujet : faits pratiques, astuces, science, insolite. Le pipeline ecrit un script optimise pour TikTok, illustre chaque scene, genere la narration et les sous-titres, puis monte la video finale avec FFmpeg — le tout avec des services **gratuits et sans cle API** par defaut.

## Fonctionnement du pipeline

Pour un sujet donne, l'app enchaine automatiquement :

1. **Recherche** (`src/lib/pipeline/research.ts`) — cherche des sources fiables et citables via l'API publique gratuite **Wikipedia** (sans cle). Si rien de fiable n'est trouve, la video est generee quand meme mais clairement marquee comme non verifiee (banniere d'avertissement dans l'UI).
2. **Script** (`script.ts`) — construit un script HOOK / INTRO / DEVELOPPEMENT / SUSPENSE / CONCLUSION a partir des vraies phrases sourcees (pas d'invention de faits), calibre sur la duree choisie.
3. **Scenes** (`scenes.ts`) — decoupe le script en 6 a 10 scenes (texte de narration, texte affiche a l'ecran, transition).
4. **Visuels** (`visualPrompts.ts`) — genere un prompt d'illustration par scene et l'image correspondante via **Pollinations.ai** (gratuit, sans cle), en evitant les visuels de personnes reelles ou choquants.
5. **Voix** (`voice.ts`) — synthese vocale par scene via **espeak-ng** (gratuit, offline, aucune cle), avec une voix homme ou femme ; la duree reelle de chaque narration est mesuree et pilote le montage.
6. **Sous-titres** (`subtitles.ts`) — genere un fichier `.srt` telechargeable et un `.ass` stylise (gros texte, 2 lignes max, bas de l'ecran) synchronise sur la duree reelle de chaque narration.
7. **Montage** (`montage.ts`) — assemble tout avec **FFmpeg** : effet Ken Burns (zoom avant/arriere alterne), narration, musique de fond synthetisee (donc 100% libre de droits, aucun telechargement), sous-titres incrustes. Sortie : MP4 1080x1920, H.264/AAC, 30 fps.

Chaque etape met a jour le statut de la video en base (visible dans l'UI via une barre de progression qui interroge l'API toutes les 2 secondes).

Le bouton **"Generation automatique"** lance exactement la meme chaine avec des reglages par defaut sensés (45s, style Insolite, voix Femme, suspense Moyen) — il n'y a qu'un seul pipeline, juste deux facons de le declencher.

## Stack technique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend** : Route Handlers Next.js (`src/app/api/**`)
- **Base de donnees** : PostgreSQL + Prisma 7 (via `@prisma/adapter-pg`)
- **Video** : FFmpeg (montage) + espeak-ng (voix)
- **IA/pipeline** : fonctions separees et remplacables dans `src/lib/pipeline/` (voir ci-dessus)

Chaque fournisseur (image, voix) est **abstrait derriere une interface** (`ImageProvider`, `VoiceProvider`) et selectionnable via une variable d'environnement, pour pouvoir brancher une API payante plus tard sans toucher au reste du pipeline.

## Prerequis

- [Node.js](https://nodejs.org) >= 20
- [ffmpeg](https://ffmpeg.org/download.html) installe (`ffmpeg -version` doit fonctionner)
- [espeak-ng](https://github.com/espeak-ng/espeak-ng) installe (`espeak-ng --version` doit fonctionner)
- [Docker](https://www.docker.com/) (pour lancer une base Postgres locale facilement) — ou une base Postgres deja existante

Sur Ubuntu/Debian : `sudo apt-get install ffmpeg espeak-ng`.

## Lancer le projet en local

```bash
cd faitstory-ai
npm install

# 1. Base de donnees Postgres locale (gratuite, via Docker)
npm run db:up

# 2. Variables d'environnement
cp .env.example .env
# La valeur par defaut de DATABASE_URL correspond deja au docker-compose fourni.

# 3. Generation du client Prisma + migrations
npm run setup

# 4. Lancement
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

Pour un test en mode production (identique a ce qui tourne en deploiement) :

```bash
npm run build
npm run start
```

## Variables d'environnement (`.env`)

| Variable | Obligatoire | Description |
| --- | --- | --- |
| `DATABASE_URL` | oui | Chaine de connexion PostgreSQL. |
| `TTS_PROVIDER` | non (defaut `espeak`) | Fournisseur de voix. Seul `espeak` (gratuit, local) est cable pour l'instant ; l'interface `VoiceProvider` dans `voice.ts` permet d'en ajouter un autre (ex: ElevenLabs) sans toucher au reste. |
| `IMAGE_PROVIDER` | non (defaut `pollinations`) | Fournisseur d'images. `pollinations` = gratuit via l'API publique. `local` = image de test generee sans reseau (utile en dev, ou si Pollinations est indisponible) : c'est le mode **DEMO** de l'app. |

Aucune cle API n'est necessaire pour faire fonctionner l'application avec les valeurs par defaut.

## Deployer gratuitement (Render)

L'app est prete pour [Render](https://render.com) : `render.yaml` (a la racine du repo) decrit a la fois le service web (Docker, plan gratuit) et une base Postgres gratuite, relies automatiquement.

1. Compte gratuit sur [render.com](https://render.com).
2. Dashboard Render → **New > Blueprint**, pointer sur ce repo.
3. Render detecte `render.yaml`, cree le service `faitstory-ai` et la base `faitstory-db`, et relie `DATABASE_URL` automatiquement. Clique sur **Apply**.
4. Au premier demarrage, le conteneur execute `prisma migrate deploy` puis lance le serveur.

**A savoir sur le plan gratuit Render** :
- Le service s'endort apres ~15 minutes sans visite ; la premiere requete suivante prend 30-60s.
- Le stockage est ephemere : les videos generees (`public/generated/`) disparaissent a chaque redeploiement/redemarrage — la base de donnees Postgres, elle, est persistante.
- Contrairement a l'environnement de developpement de cette session, un serveur Render a un acces internet normal (Wikipedia et Pollinations.ai sont joignables sans restriction).

## Securite et limites deja en place

- Validation stricte des entrees (`src/lib/validation.ts`, Zod) : sujet 5-200 caracteres, enums verrouilles pour style/voix/suspense/duree.
- Limitation de requetes (`src/lib/rateLimit.ts`) : 5 generations de video par heure et par IP (la generation est couteuse en CPU/temps).
- Aucune cle API cote client : tout appel a Pollinations/Wikipedia/espeak-ng se fait uniquement depuis le serveur.
- Nettoyage automatique des fichiers temporaires (images/audio intermediaires) apres chaque generation, reussie ou non (`orchestrator.ts`, `montage.ts`).
- En cas d'echec a n'importe quelle etape, la video est marquee `FAILED` avec un message d'erreur clair plutot que de rester bloquee.

## Limites connues (version actuelle)

- La generation est **synchrone en arriere-plan** dans le processus Node (pas de file de jobs externe) : ca suppose un serveur qui tourne en continu (Docker/Render), pas une fonction serverless qui se coupe apres la reponse HTTP.
- espeak-ng donne une voix de synthese clairement robotique (mais gratuite et fonctionnelle). Brancher un vrai fournisseur TTS (ElevenLabs, etc.) ne demande de modifier que `voice.ts`.
- Pas de generation video par IA (type Sora) : les visuels sont des illustrations Pollinations.ai montees en slideshow anime (zoom Ken Burns), ce qui reste gratuit et bien adapte a un format TikTok.
- Le decoupage sous-titres/scenes est base sur la ponctuation du texte source (Wikipedia) plutot que sur un alignement audio mot-a-mot ; la synchronisation reste correcte car chaque scene a sa propre narration audio mesuree independamment.

## Structure du projet

```
faitstory-ai/
├── prisma/
│   └── schema.prisma        # Modele Video (sujet, parametres, statut, sorties JSON, chemins fichiers)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Page d'accueil (formulaire de generation)
│   │   ├── videos/page.tsx       # Page "Mes videos"
│   │   ├── videos/[id]/page.tsx  # Detail d'une video (player, script, scenes, edition, suppression)
│   │   └── api/videos/**         # Routes API (POST/GET/PATCH/DELETE)
│   ├── components/               # UI (formulaire, stepper de progression, panneau de resultat, ...)
│   └── lib/
│       ├── db.ts                  # Client Prisma (adapter Postgres)
│       ├── validation.ts          # Schemas Zod
│       ├── rateLimit.ts           # Limitation de requetes en memoire
│       └── pipeline/
│           ├── research.ts        # Recherche Wikipedia
│           ├── script.ts          # Generation du script
│           ├── scenes.ts          # Decoupage en scenes
│           ├── visualPrompts.ts   # Prompts + generation d'images (Pollinations / local)
│           ├── voice.ts           # Synthese vocale (espeak-ng)
│           ├── subtitles.ts       # Sous-titres SRT/ASS
│           ├── montage.ts         # Assemblage FFmpeg
│           └── orchestrator.ts    # Enchaine tout le pipeline, met a jour le statut en base
├── docker-compose.yml        # Postgres local gratuit pour le dev
└── Dockerfile                # Image de production (ffmpeg + espeak-ng + Node)
```
