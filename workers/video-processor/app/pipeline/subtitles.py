from app.pipeline.ffmpeg_utils import run

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,Arial Black,72,&H00FFFFFF,&H000000FF,&H00202020,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,2,40,40,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def _seconds_to_ass_time(seconds: float) -> str:
    seconds = max(seconds, 0)
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:01d}:{minutes:02d}:{secs:05.2f}"


def build_ass_file(words: list[dict], clip_start: float, clip_end: float, output_path: str) -> None:
    lines = [ASS_HEADER]

    for word in words:
        if word["start"] < clip_start or word["end"] > clip_end:
            continue
        start = _seconds_to_ass_time(word["start"] - clip_start)
        end = _seconds_to_ass_time(word["end"] - clip_start)
        text = word["word"].strip().upper().replace("{", "").replace("}", "")
        if not text:
            continue
        lines.append(f"Dialogue: 0,{start},{end},Pop,,0,0,0,,{text}")

    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def burn_subtitles(input_path: str, ass_path: str, output_path: str) -> None:
    escaped_path = ass_path.replace("\\", "/").replace(":", "\\:")
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-vf",
            f"ass={escaped_path}",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "26",
            "-c:a",
            "copy",
            output_path,
        ],
        timeout=600,
    )
