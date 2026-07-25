import json
import subprocess


class FfmpegError(RuntimeError):
    pass


def run(args: list[str], timeout: int = 600) -> None:
    try:
        subprocess.run(args, check=True, capture_output=True, timeout=timeout, text=True)
    except subprocess.CalledProcessError as exc:
        raise FfmpegError(f"ffmpeg a échoué: {exc.stderr[-2000:]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise FfmpegError(f"ffmpeg a dépassé le timeout de {timeout}s") from exc


def probe(input_path: str) -> dict:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                input_path,
            ],
            check=True,
            capture_output=True,
            timeout=60,
            text=True,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise FfmpegError("Fichier vidéo illisible (format non supporté ou corrompu)") from exc

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise FfmpegError("Impossible d'analyser les métadonnées vidéo") from exc


def get_duration_seconds(input_path: str) -> float:
    info = probe(input_path)
    try:
        return float(info["format"]["duration"])
    except (KeyError, ValueError) as exc:
        raise FfmpegError("Durée de la vidéo introuvable") from exc


def get_video_dimensions(input_path: str) -> tuple[int, int]:
    info = probe(input_path)
    for stream in info.get("streams", []):
        if stream.get("codec_type") == "video":
            return int(stream["width"]), int(stream["height"])
    raise FfmpegError("Aucun flux vidéo trouvé dans le fichier")


def extract_audio(input_path: str, output_wav_path: str) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            output_wav_path,
        ],
        timeout=300,
    )
