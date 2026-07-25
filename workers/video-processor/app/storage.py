import boto3

from app.config import R2_ACCESS_KEY_ID, R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_SECRET_ACCESS_KEY

_client = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
)


def download(storage_key: str, local_path: str) -> None:
    _client.download_file(R2_BUCKET_NAME, storage_key, local_path)


def upload(local_path: str, storage_key: str, content_type: str) -> None:
    _client.upload_file(
        local_path,
        R2_BUCKET_NAME,
        storage_key,
        ExtraArgs={"ContentType": content_type},
    )


def build_clip_key(user_id: str, video_id: str, clip_id: str) -> str:
    return f"clips/{user_id}/{video_id}/{clip_id}.mp4"


def build_thumbnail_key(user_id: str, video_id: str, clip_id: str) -> str:
    return f"clips/{user_id}/{video_id}/{clip_id}-thumb.jpg"
