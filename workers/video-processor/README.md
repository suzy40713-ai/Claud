# video-processor

Worker Python qui consomme la queue BullMQ `video-processing` (Redis/Upstash) et transforme
une vidéo longue en clips courts prêts à poster.

## Pipeline

1. Téléchargement de la vidéo source depuis Cloudflare R2
2. `ffprobe` pour la durée réelle → vérification/réservation du quota auprès de l'API
3. Extraction audio (mono 16kHz) via ffmpeg
4. Transcription avec timestamps mot par mot (Groq Whisper `whisper-large-v3-turbo`)
5. Analyse de l'énergie audio (`librosa`) pour repérer les pics (rires, exclamations)
6. Génération de fenêtres candidates (15–90s) combinant score audio + heuristiques texte
7. Reclassement des meilleurs moments par LLM (Groq `llama-3.3-70b-versatile`), avec repli
   sur le score heuristique si l'appel LLM échoue
8. Pour chaque clip retenu : découpage + recadrage 9:16 (ffmpeg), sous-titres animés mot par
   mot (ASS/libass), miniature, upload vers R2
9. Callback vers l'API (`/internal/...`) pour créer les clips et mettre à jour le statut

## Lancer en local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # renseigner REDIS_URL, R2_*, GROQ_API_KEY, INTERNAL_API_SECRET
python -m app.main
```

Nécessite `ffmpeg` installé sur la machine (avec support `libass` pour les sous-titres).

## Notes coûts (budget 0€)

- Résolution de sortie limitée à 720×1280 pour rester rapide sur du compute gratuit.
- Transcription et scoring LLM via l'API gratuite Groq (limites de débit, pas de carte
  bancaire requise).
