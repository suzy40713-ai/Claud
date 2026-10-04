"""Generate the French voice-over clips for the TikTok video.

Reads src/script.json, synthesizes every "...Say" line with Kokoro
(voice ff_siwis), writes public/voiceover/<id>.wav and the clip lengths
(in seconds) to src/voiceover.json, which the composition uses for timing.

Setup (once):
  pip install kokoro-onnx soundfile
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Usage:
  python3 scripts/voiceover.py --models <dir containing the two files>
"""

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent


def lines(script):
    yield "hook_title", script["hook"]["titleSay"]
    yield "hook_sub", script["hook"]["subSay"]
    for i, fact in enumerate(script["facts"]):
        yield f"fact{i}_title", fact["titleSay"]
        yield f"fact{i}_text", fact["textSay"]
    for key in ("question", "comment", "follow"):
        yield f"outro_{key}", script["outro"][f"{key}Say"]


def trim(audio, threshold=0.01, pad=800):
    loud = np.where(np.abs(audio) > threshold)[0]
    if len(loud) == 0:
        return audio
    return audio[max(loud[0] - pad, 0) : loud[-1] + pad]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", default=str(Path.home() / "kokoro"))
    args = parser.parse_args()

    script = json.loads((ROOT / "src/script.json").read_text())
    models = Path(args.models)
    kokoro = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))

    out_dir = ROOT / "public/voiceover"
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}
    for clip_id, text in lines(script):
        audio, sr = kokoro.create(
            text, voice=script["voice"], speed=script["speed"], lang="fr-fr"
        )
        audio = trim(audio)
        audio = audio / max(np.abs(audio).max(), 1e-6) * 0.89
        sf.write(out_dir / f"{clip_id}.wav", audio, sr)
        durations[clip_id] = round(len(audio) / sr, 3)
        print(f"{clip_id}: {durations[clip_id]}s")

    (ROOT / "src/voiceover.json").write_text(json.dumps(durations, indent=2) + "\n")
    print(f"total speech: {sum(durations.values()):.1f}s")


if __name__ == "__main__":
    main()
