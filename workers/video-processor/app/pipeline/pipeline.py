import logging
import os
import shutil
import uuid

from app import api_client, storage
from app.config import WORK_DIR
from app.pipeline import clip as clip_module
from app.pipeline import subtitles as subtitles_module
from app.pipeline.audio_energy import extract_energy_curve
from app.pipeline.ffmpeg_utils import extract_audio, get_duration_seconds
from app.pipeline.scoring import build_candidate_windows, rerank_with_llm
from app.pipeline.transcribe import transcribe

logger = logging.getLogger(__name__)


def process_video(video_id: str, user_id: str, storage_key: str, original_filename: str) -> None:
    job_dir = os.path.join(WORK_DIR, video_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        api_client.set_video_status(video_id, "processing")

        source_path = os.path.join(job_dir, f"source{os.path.splitext(original_filename)[1] or '.mp4'}")
        storage.download(storage_key, source_path)

        duration = get_duration_seconds(source_path)
        allowed = api_client.report_duration(video_id, duration)
        if not allowed:
            logger.info("video %s exceeds remaining quota, aborting", video_id)
            return

        audio_path = os.path.join(job_dir, "audio.wav")
        extract_audio(source_path, audio_path)

        transcript = transcribe(audio_path)
        times, energy = extract_energy_curve(audio_path)

        candidates = build_candidate_windows(transcript["segments"], times, energy)
        ranked_clips = rerank_with_llm(candidates)

        for ranked in ranked_clips:
            clip_id = str(uuid.uuid4())
            _produce_clip(job_dir, source_path, transcript["words"], ranked, video_id, user_id, clip_id)

        api_client.set_video_status(video_id, "completed")
    except Exception as exc:
        logger.exception("processing failed for video %s", video_id)
        api_client.set_video_status(video_id, "failed", str(exc))
        raise
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


def _produce_clip(
    job_dir: str,
    source_path: str,
    words: list[dict],
    ranked: dict,
    video_id: str,
    user_id: str,
    clip_id: str,
) -> None:
    cropped_path = os.path.join(job_dir, f"{clip_id}-cropped.mp4")
    final_path = os.path.join(job_dir, f"{clip_id}.mp4")
    ass_path = os.path.join(job_dir, f"{clip_id}.ass")
    thumbnail_path = os.path.join(job_dir, f"{clip_id}-thumb.jpg")

    clip_module.cut_and_crop_vertical(source_path, ranked["start"], ranked["end"], cropped_path)
    subtitles_module.build_ass_file(words, ranked["start"], ranked["end"], ass_path)
    subtitles_module.burn_subtitles(cropped_path, ass_path, final_path)
    clip_module.extract_thumbnail(final_path, thumbnail_path)

    clip_key = storage.build_clip_key(user_id, video_id, clip_id)
    thumb_key = storage.build_thumbnail_key(user_id, video_id, clip_id)

    storage.upload(final_path, clip_key, "video/mp4")
    storage.upload(thumbnail_path, thumb_key, "image/jpeg")

    api_client.create_clip(
        video_id,
        start_time=ranked["start"],
        end_time=ranked["end"],
        duration_seconds=ranked["end"] - ranked["start"],
        score=ranked["score"],
        caption_text=ranked["caption"],
        storage_key=clip_key,
        thumbnail_key=thumb_key,
    )
