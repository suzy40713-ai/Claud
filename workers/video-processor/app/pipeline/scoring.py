import json
import logging

import numpy as np

from app.config import MAX_CLIP_SECONDS, MAX_CLIPS_PER_VIDEO, MIN_CLIP_SECONDS
from app.pipeline.audio_energy import average_energy
from app.pipeline.groq_client import client

logger = logging.getLogger(__name__)

KEYWORDS = [
    "incroyable",
    "dingue",
    "grave",
    "sérieux",
    "punchline",
    "attends",
    "genre",
    "oh my god",
    "wow",
    "haha",
    "mdr",
    "lol",
    "wtf",
    "no way",
]

RERANK_PROMPT = """Tu sélectionnes les meilleurs extraits d'une vidéo pour en faire des clips courts \
viraux (TikTok/Reels/Shorts). Voici des extraits candidats avec leur transcription. Note chaque \
extrait de 0 à 10 selon son potentiel viral (punchline, moment drôle, révélation, tension, \
rebondissement) et donne une légende courte et accrocheuse (max 60 caractères).

Réponds uniquement en JSON strict de la forme :
{{"clips": [{{"index": 0, "score": 8.5, "caption": "..."}}]}}

Extraits :
{extracts}
"""


def _text_heuristic_score(text: str) -> float:
    lowered = text.lower()
    score = lowered.count("!") * 0.15 + lowered.count("?") * 0.05
    score += sum(0.2 for keyword in KEYWORDS if keyword in lowered)
    caps_words = [w for w in text.split() if len(w) > 2 and w.isupper()]
    score += len(caps_words) * 0.1
    return min(score, 1.0)


def _score_segment(segment: dict, times: np.ndarray, energy: np.ndarray) -> float:
    audio_score = average_energy(times, energy, segment["start"], segment["end"])
    text_score = _text_heuristic_score(segment["text"])
    return 0.5 * audio_score + 0.5 * text_score


def _overlaps(window: dict, used_ranges: list[tuple[float, float]]) -> bool:
    for used_start, used_end in used_ranges:
        overlap = min(window["end"], used_end) - max(window["start"], used_start)
        span = min(window["end"] - window["start"], used_end - used_start)
        if span > 0 and overlap / span > 0.3:
            return True
    return False


def _expand_window(segments: list[dict], seed_idx: int) -> dict | None:
    start_idx = end_idx = seed_idx
    duration = segments[seed_idx]["end"] - segments[seed_idx]["start"]

    while duration < MIN_CLIP_SECONDS:
        grow_start = (
            segments[end_idx]["end"] - segments[start_idx - 1]["start"] if start_idx > 0 else None
        )
        grow_end = (
            segments[end_idx + 1]["end"] - segments[start_idx]["start"]
            if end_idx < len(segments) - 1
            else None
        )
        if grow_start is not None and grow_start > MAX_CLIP_SECONDS:
            grow_start = None
        if grow_end is not None and grow_end > MAX_CLIP_SECONDS:
            grow_end = None

        if grow_start is None and grow_end is None:
            break

        # grow whichever side adds the least extra duration, to stay tight around MIN_CLIP_SECONDS
        if grow_end is None or (grow_start is not None and grow_start <= grow_end):
            start_idx -= 1
        else:
            end_idx += 1

        duration = segments[end_idx]["end"] - segments[start_idx]["start"]

    if duration < MIN_CLIP_SECONDS or duration > MAX_CLIP_SECONDS:
        return None

    text = " ".join(segments[i]["text"] for i in range(start_idx, end_idx + 1))
    return {"start": segments[start_idx]["start"], "end": segments[end_idx]["end"], "text": text}


def build_candidate_windows(
    segments: list[dict], times: np.ndarray, energy: np.ndarray, max_candidates: int = 16
) -> list[dict]:
    if not segments:
        return []

    scores = [_score_segment(seg, times, energy) for seg in segments]
    order = sorted(range(len(segments)), key=lambda i: scores[i], reverse=True)

    selected: list[dict] = []
    used_ranges: list[tuple[float, float]] = []

    for seed_idx in order:
        if len(selected) >= max_candidates:
            break
        window = _expand_window(segments, seed_idx)
        if window is None or _overlaps(window, used_ranges):
            continue
        used_ranges.append((window["start"], window["end"]))
        selected.append({**window, "heuristic_score": scores[seed_idx]})

    selected.sort(key=lambda w: w["start"])
    return selected


def rerank_with_llm(candidates: list[dict]) -> list[dict]:
    if not candidates:
        return []

    try:
        extracts_text = "\n\n".join(
            f"[{i}] ({c['end'] - c['start']:.0f}s) {c['text']}" for i, c in enumerate(candidates)
        )
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": RERANK_PROMPT.format(extracts=extracts_text)}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content)
        ranked = sorted(parsed["clips"], key=lambda c: c["score"], reverse=True)

        results = []
        for entry in ranked[:MAX_CLIPS_PER_VIDEO]:
            candidate = candidates[entry["index"]]
            results.append({**candidate, "score": float(entry["score"]) / 10, "caption": entry["caption"]})
        return results
    except Exception:
        logger.exception("LLM rerank failed, falling back to heuristic scores")
        fallback = sorted(candidates, key=lambda c: c["heuristic_score"], reverse=True)[:MAX_CLIPS_PER_VIDEO]
        return [{**c, "score": c["heuristic_score"], "caption": c["text"][:60]} for c in fallback]
