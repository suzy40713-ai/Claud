from app.pipeline.ffmpeg_utils import get_video_dimensions, run

OUTPUT_WIDTH = 720
OUTPUT_HEIGHT = 1280


def cut_and_crop_vertical(input_path: str, start: float, end: float, output_path: str) -> None:
    width, height = get_video_dimensions(input_path)
    target_ratio = OUTPUT_WIDTH / OUTPUT_HEIGHT
    source_ratio = width / height

    if source_ratio > target_ratio:
        crop_filter = f"crop=ih*{OUTPUT_WIDTH}/{OUTPUT_HEIGHT}:ih"
    else:
        crop_filter = f"crop=iw:iw*{OUTPUT_HEIGHT}/{OUTPUT_WIDTH}"

    vf = f"{crop_filter},scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}"

    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(start),
            "-to",
            str(end),
            "-i",
            input_path,
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "26",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            output_path,
        ],
        timeout=600,
    )


def extract_thumbnail(clip_path: str, output_path: str, at_seconds: float = 0.3) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(at_seconds),
            "-i",
            clip_path,
            "-frames:v",
            "1",
            "-q:v",
            "3",
            output_path,
        ],
        timeout=60,
    )
