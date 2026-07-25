import os

from app.pipeline.groq_client import client


def transcribe(audio_path: str) -> dict:
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), audio_file.read()),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["segment", "word"],
        )

    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
        for seg in transcription.segments
    ]
    words = [
        {"word": w["word"].strip(), "start": w["start"], "end": w["end"]}
        for w in (transcription.words or [])
    ]

    return {"segments": segments, "words": words}
