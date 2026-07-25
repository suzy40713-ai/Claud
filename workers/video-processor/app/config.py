import os

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


REDIS_URL = _require("REDIS_URL")
API_BASE_URL = _require("API_BASE_URL")
INTERNAL_API_SECRET = _require("INTERNAL_API_SECRET")

R2_ACCOUNT_ID = _require("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = _require("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = _require("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = _require("R2_BUCKET_NAME")

GROQ_API_KEY = _require("GROQ_API_KEY")

CONCURRENCY = int(os.environ.get("WORKER_CONCURRENCY", "1"))
WORK_DIR = os.environ.get("WORK_DIR", "/tmp/clipai-worker")

MIN_CLIP_SECONDS = 15
MAX_CLIP_SECONDS = 90
MAX_CLIPS_PER_VIDEO = 8
