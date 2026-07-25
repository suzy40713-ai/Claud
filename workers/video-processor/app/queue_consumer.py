import asyncio
import logging

from bullmq import Worker

from app import api_client
from app.config import CONCURRENCY, REDIS_URL
from app.pipeline.pipeline import process_video

logger = logging.getLogger(__name__)

QUEUE_NAME = "video-processing"


async def _process(job, _token):
    data = job.data
    video_id = data["videoId"]

    api_client.report_job(video_id, str(job.id), "active", 5)

    try:
        await asyncio.to_thread(
            process_video,
            video_id,
            data["userId"],
            data["storageKey"],
            data["originalFilename"],
        )
    except Exception as exc:
        api_client.report_job(video_id, str(job.id), "failed", 100, str(exc))
        raise

    api_client.report_job(video_id, str(job.id), "completed", 100)
    return {"ok": True}


async def run_worker() -> None:
    logging.basicConfig(level=logging.INFO)
    worker = Worker(QUEUE_NAME, _process, {"connection": REDIS_URL, "concurrency": CONCURRENCY})
    logger.info("ClipAI video-processor listening on queue '%s'", QUEUE_NAME)

    stop_event = asyncio.Event()
    try:
        await stop_event.wait()
    finally:
        await worker.close()
