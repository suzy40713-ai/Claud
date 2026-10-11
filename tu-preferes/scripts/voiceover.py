"""Génère la voix off (FR, hors-ligne) + les bruitages pour chaque épisode.

    pip install sherpa-onnx soundfile numpy
    python3 scripts/voiceover.py            # tous les épisodes
    python3 scripts/voiceover.py TuPreferes-Partie1
    python3 scripts/voiceover.py --voice tom      # autre voix d'homme

Écrit public/voice/<episode>/<ligne>.wav, public/sfx/*.wav et
src/voice-manifest.json (durées, utilisées pour caler les timings).
La voix (Piper, ~65 Mo) est téléchargée une fois dans .tts/.
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
# nom -> (modèle Piper, id du locuteur)
VOICES = {
    "tom": ("fr_FR-tom-medium", 0),  # homme
    "pierre": ("fr_FR-upmc-medium", 1),  # homme (par défaut)
    "jessica": ("fr_FR-upmc-medium", 0),  # femme
    "siwis": ("fr_FR-siwis-medium", 0),  # femme
}
DEFAULT_VOICE = "pierre"
VOICES_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/"
SPEED = 1.05  # trop rapide = son plus robotique

REVEAL_LINES = [
    "{p} pour cent !",
    "Et c'est {p} pour cent !",
    "{p} pour cent ! T'es d'accord ?",
]

ORDINALS = {
    "2": "deuxième", "3": "troisième", "4": "quatrième", "5": "cinquième",
    "6": "sixième", "7": "septième", "8": "huitième", "9": "neuvième",
    "10": "dixième",
}

EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]+"
)


def speakable(text: str) -> str:
    t = EMOJI_RE.sub("", text).replace("\n", " ")
    t = re.sub(r"(\d)[   ](\d{3})", r"\1\2", t)  # 10 000 -> 10000
    t = re.sub(r"\b1\s*€", "un euro", t)
    t = re.sub(r"\b1\s*h\b", "une heure", t)
    t = re.sub(r"\b(\d+)\s*h\b", r"\1 heures", t)
    t = re.sub(r"\b(\d+)e\b", lambda m: ORDINALS.get(m.group(1), m.group(0)), t)
    t = t.replace("€", " euros").replace("%", " pour cent")
    return re.sub(r"\s+", " ", t).strip()


def ensure_model(model: str) -> Path:
    name = f"vits-piper-{model}"
    model_dir = ROOT / ".tts" / name
    if (model_dir / "tokens.txt").exists():
        return model_dir
    model_dir.parent.mkdir(parents=True, exist_ok=True)
    archive = model_dir.parent / f"{name}.tar.bz2"
    print(f"Téléchargement de la voix : {VOICES_URL}{name}.tar.bz2")
    urllib.request.urlretrieve(f"{VOICES_URL}{name}.tar.bz2", archive)
    with tarfile.open(archive) as tar:
        tar.extractall(model_dir.parent, filter="data")
    archive.unlink()
    return model_dir


def load_tts(model: str):
    import sherpa_onnx

    model_dir = ensure_model(model)
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(model_dir / f"{model}.onnx"),
                tokens=str(model_dir / "tokens.txt"),
                data_dir=str(model_dir / "espeak-ng-data"),
            ),
            num_threads=4,
        )
    )
    return sherpa_onnx.OfflineTts(config)


def lower_first(text: str) -> str:
    return text[:1].lower() + text[1:]


def episode_lines(ep: dict) -> dict:
    qs = ep["questions"]
    lines = {"hook": speakable(ep["hook"]) + " !"}
    for i, q in enumerate(qs):
        text = q.get("voice") or (
            f"Tu préfères {lower_first(speakable(q['a']['text']))}… "
            f"ou {lower_first(speakable(q['b']['text']))} ?"
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
    args = sys.argv[1:]
    voice = DEFAULT_VOICE
    if "--voice" in args:
        i = args.index("--voice")
        voice = args[i + 1]
        del args[i : i + 2]
    if voice not in VOICES:
        sys.exit(f"Voix inconnue : {voice} (choix : {', '.join(VOICES)})")
    model, speaker = VOICES[voice]

    episodes = json.loads((ROOT / "src" / "episodes.json").read_text())
    only = set(args)
    manifest_path = ROOT / "src" / "voice-manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    write_sfx()
    tts = load_tts(model)
    for ep in episodes:
        if only and ep["id"] not in only:
            continue
        out = ROOT / "public" / "voice" / ep["id"]
        out.mkdir(parents=True, exist_ok=True)
        durations = {}
        for key, text in episode_lines(ep).items():
            audio = tts.generate(text, sid=speaker, speed=SPEED)
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
