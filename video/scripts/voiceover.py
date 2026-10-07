"""Generate the French voice-over clips for the TikTok video.

Reads src/topics/<topic>/script.json, synthesizes every "...Say" line with
the voice it names, writes public/voiceover/<topic>/<id>.wav, the clip
lengths (in seconds) to src/topics/<topic>/voiceover.json, which the video
uses for timing, and a per-frame loudness envelope of each clip to
src/topics/<topic>/mouth.json, which drives the scientist's lip-sync.

The "voice" field of script.json picks the engine:
  - "ff_siwis" (female): Kokoro. Setup, in ~/kokoro:
      pip install kokoro-onnx soundfile
      curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
      curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
  - "piper:fr_FR-tom-medium" (male): Piper voice run with sherpa-onnx. Setup:
      pip install sherpa-onnx soundfile
      curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-tom-medium.tar.bz2
      tar xjf vits-piper-fr_FR-tom-medium.tar.bz2 -C ~/tts

Usage:
  python3 scripts/voiceover.py <topic> [--models ~/kokoro] [--piper ~/tts]
"""

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent


def lines(script):
    yield "hook_intro", script["hook"]["introSay"]
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


FPS = 30


def envelope(audio, sr):
    """Mouth openness (0..1) for each video frame of the clip."""
    hop = sr // FPS
    frames = int(np.ceil(len(audio) / hop))
    rms = np.array(
        [np.sqrt(np.mean(audio[i * hop : (i + 1) * hop] ** 2)) for i in range(frames)]
    )
    rms = np.clip(rms / max(np.percentile(rms, 95), 1e-6), 0, 1)
    rms[rms < 0.12] = 0
    return [round(float(v), 2) for v in rms]


def make_synth(voice, speed, args):
    """Returns text -> (samples, sample_rate) for the voice named in script.json."""
    if voice.startswith("piper:"):
        import sherpa_onnx

        name = voice.split(":", 1)[1]
        d = Path(args.piper).expanduser() / f"vits-piper-{name}"
        tts = sherpa_onnx.OfflineTts(
            sherpa_onnx.OfflineTtsConfig(
                model=sherpa_onnx.OfflineTtsModelConfig(
                    vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                        model=str(d / f"{name}.onnx"),
                        tokens=str(d / "tokens.txt"),
                        data_dir=str(d / "espeak-ng-data"),
                    ),
                    num_threads=4,
                )
            )
        )

        def synth(text):
            out = tts.generate(text, sid=0, speed=speed)
            return np.array(out.samples, dtype=np.float32), out.sample_rate

        return synth

    from kokoro_onnx import Kokoro

    models = Path(args.models).expanduser()
    kokoro = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))
    return lambda text: kokoro.create(text, voice=voice, speed=speed, lang="fr-fr")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("topic", help="folder name in src/topics, e.g. animaux")
    parser.add_argument("--models", default="~/kokoro", help="Kokoro model files")
    parser.add_argument("--piper", default="~/tts", help="sherpa-onnx Piper voices")
    args = parser.parse_args()

    topic_dir = ROOT / "src/topics" / args.topic
    script = json.loads((topic_dir / "script.json").read_text())
    synth = make_synth(script["voice"], script["speed"], args)

    out_dir = ROOT / "public/voiceover" / args.topic
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}
    mouth = {}
    for clip_id, text in lines(script):
        audio, sr = synth(text)
        audio = trim(audio)
        audio = audio / max(np.abs(audio).max(), 1e-6) * 0.89
        sf.write(out_dir / f"{clip_id}.wav", audio, sr)
        durations[clip_id] = round(len(audio) / sr, 3)
        mouth[clip_id] = envelope(audio, sr)
        print(f"{clip_id}: {durations[clip_id]}s")

    (topic_dir / "voiceover.json").write_text(json.dumps(durations, indent=2) + "\n")
    (topic_dir / "mouth.json").write_text(json.dumps(mouth) + "\n")
    print(f"total speech: {sum(durations.values()):.1f}s")


if __name__ == "__main__":
    main()
