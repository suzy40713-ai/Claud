import requests

from app.config import API_BASE_URL, INTERNAL_API_SECRET

_session = requests.Session()
_session.headers.update({"x-internal-secret": INTERNAL_API_SECRET})


def set_video_status(video_id: str, status: str, error_message: str | None = None) -> None:
    body = {"status": status}
    if error_message:
        body["errorMessage"] = error_message
    response = _session.patch(f"{API_BASE_URL}/internal/videos/{video_id}/status", json=body, timeout=15)
    response.raise_for_status()


def report_duration(video_id: str, duration_seconds: float) -> bool:
    response = _session.post(
        f"{API_BASE_URL}/internal/videos/{video_id}/duration",
        json={"durationSeconds": duration_seconds},
        timeout=15,
    )
    response.raise_for_status()
    return bool(response.json()["allowed"])


def create_clip(
    video_id: str,
    *,
    start_time: float,
    end_time: float,
    duration_seconds: float,
    score: float,
    caption_text: str,
    storage_key: str,
    thumbnail_key: str,
) -> dict:
    response = _session.post(
        f"{API_BASE_URL}/internal/videos/{video_id}/clips",
        json={
            "startTime": start_time,
            "endTime": end_time,
            "durationSeconds": duration_seconds,
            "score": score,
            "captionText": caption_text,
            "storageKey": storage_key,
            "thumbnailKey": thumbnail_key,
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def report_job(video_id: str, bullmq_job_id: str, status: str, progress: int, error_message: str | None = None) -> None:
    body = {"videoId": video_id, "bullmqJobId": bullmq_job_id, "status": status, "progress": progress}
    if error_message:
        body["errorMessage"] = error_message
    response = _session.patch(f"{API_BASE_URL}/internal/jobs", json=body, timeout=15)
    response.raise_for_status()
