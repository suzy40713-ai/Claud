# video-processor (à venir)

Worker Python qui consommera la queue BullMQ (Upstash Redis) pour le traitement vidéo :
transcription (Groq Whisper), analyse audio, scoring des moments forts, découpage ffmpeg,
sous-titres animés, upload vers Cloudflare R2.

Pas encore implémenté — prochaine étape après le pipeline d'upload.
