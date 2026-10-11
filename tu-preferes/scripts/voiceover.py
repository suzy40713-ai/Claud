"""Génère la voix off (FR, hors-ligne) + les bruitages pour chaque épisode.

    pip install sherpa-onnx soundfile numpy
    python3 scripts/voiceover.py            # tous les épisodes
    python3 scripts/voiceover.py TuPreferes-Partie1

Écrit public/voice/<episode>/<ligne>.wav, public/sfx/*.wav et
src/voice-manifest.json (durées, utilisées pour caler les timings).
La voix (Piper « siwis », ~67 Mo) est téléchargée une fois dans .tts/.
"""

import json
import re
import sys
import tarfile
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VOICE_NAME = "vits-piper-fr_FR-siwis-medium"
VOICE_URL = (
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/"
    f"{VOICE_NAME}.tar.bz2"
)
MODEL_DIR = ROOT / ".tts" / VOICE_NAME
SPEED = 1.15  # un peu plus rapide que nature = plus dynamique

REVEAL_LINES = [
    "{p} pour cent !",
    "Et c'est {p} pour cent !",
    "{p} pour cent ! T'es d'accord ?",
]

EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]+"
)


def speakable(text: str) -> str:
    t = EMOJI_RE.sub("", text).replace("\n", " ")
    t = re.sub(r"(\d)[   ](\d{3})", r"\1\2", t)  # 10 000 -> 10000
    t = re.sub(r"\b1\s*€", "un euro", t)
    t = t.replace("€", " euros").replace("%", " pour cent")
    return re.sub(r"\s+", " ", t).strip()


def ensure_model() -> None:
    if (MODEL_DIR / "tokens.txt").exists():
        return
    MODEL_DIR.parent.mkdir(parents=True, exist_ok=True)
    archive = MODEL_DIR.parent / f"{VOICE_NAME}.tar.bz2"
    print(f"Téléchargement de la voix : {VOICE_URL}")
    urllib.request.urlretrieve(VOICE_URL, archive)
    with tarfile.open(archive) as tar:
        tar.extractall(MODEL_DIR.parent, filter="data")
    archive.unlink()


def load_tts():
    import sherpa_onnx

    ensure_model()
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(MODEL_DIR / "fr_FR-siwis-medium.onnx"),
                tokens=str(MODEL_DIR / "tokens.txt"),
                data_dir=str(MODEL_DIR / "espeak-ng-data"),
            ),
            num_threads=4,
        )
    )
    return sherpa_onnx.OfflineTts(config)


def episode_lines(ep: dict) -> dict:
    qs = ep["questions"]
    lines = {"hook": speakable(ep["hook"]) + " !"}
    for i, q in enumerate(qs):
        text = q.get("voice") or (
            f"Tu préfères {speakable(q['a']['text'])}… "
            f"ou {speakable(q['b']['text'])} ?"
        )
        if i == len(qs) - 1:
            text = "Dernière question, la plus dure. " + text
        lines[f"q{i}"] = text
        winner = max(q["percentA"], 100 - q["percentA"])
        lines[f"r{i}"] = REVEAL_LINES[i % len(REVEAL_LINES)].format(p=winner)
    nxt = ep["part"] + 1
    lines["cta"] = f"Abonne-toi pour la partie {nxt} !"
    lines["outro"] = (
        f"La partie {nxt} arrive demain ! Abonne-toi, "
        "et dis-moi ton score en commentaire !"
    )
    return lines


def write_sfx() -> None:
    sr = 44100
    out = ROOT / "public" / "sfx"
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(0)

    def t(sec):
        return np.arange(int(sr * sec)) / sr

    def save(name, x):
        x = x / (np.abs(x).max() + 1e-9) * 0.8
        sf.write(out / f"{name}.wav", x.astype(np.float32), sr)

    # Whoosh : bruit filtré avec enveloppe en cloche
    x = t(0.35)
    noise = np.convolve(rng.standard_normal(len(x)), np.ones(12) / 12, "same")
    save("whoosh", noise * np.sin(np.pi * x / x[-1]) ** 2)
    # Tick d'horloge
    x = t(0.05)
    save("tick", np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 120))
    # Ding de révélation
    x = t(0.8)
    save("ding", (np.sin(2 * np.pi * 1320 * x) + 0.5 * np.sin(2 * np.pi * 1980 * x))
         * np.exp(-x * 5))
    # Pop (clic sur S'abonner)
    x = t(0.12)
    save("pop", np.sin(2 * np.pi * (300 + 900 * x / x[-1]) * x) * np.exp(-x * 30))


def main() -> None:
    episodes = json.loads((ROOT / "src" / "episodes.json").read_text())
    only = set(sys.argv[1:])
    manifest_path = ROOT / "src" / "voice-manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    write_sfx()
    tts = load_tts()
    for ep in episodes:
        if only and ep["id"] not in only:
            continue
        out = ROOT / "public" / "voice" / ep["id"]
        out.mkdir(parents=True, exist_ok=True)
        durations = {}
        for key, text in episode_lines(ep).items():
            audio = tts.generate(text, sid=0, speed=SPEED)
            samples = np.asarray(audio.samples, dtype=np.float32)
            # Volume homogène d'une phrase à l'autre, et bien fort
            samples = samples / (np.abs(samples).max() + 1e-9) * 0.95
            sf.write(out / f"{key}.wav", samples, audio.sample_rate)
            durations[key] = round(len(samples) / audio.sample_rate, 3)
            print(f"{ep['id']}/{key} ({durations[key]}s) : {text}")
        manifest[ep["id"]] = durations

    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
