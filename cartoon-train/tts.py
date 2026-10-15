# -*- coding: utf-8 -*-
"""Génère les voix (Piper, hors-ligne) + l'ambiance sonore du train."""
import os
import subprocess
import tarfile
import urllib.request
import wave

import numpy as np

from script import LINES

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
VOICES = os.path.join(BUILD, "voices")
SR = 22050

RELEASE = "https://github.com/rhasspy/piper/releases/download/v0.0.2/"
VOICE_FILES = {
    "siwis": "fr-siwis-medium",   # voix féminine
    "gilles": "fr-gilles-low",    # voix masculine
    "mls": "fr-mls_1840-low",     # seconde voix masculine
}

# personnage -> (voix, vitesse (length_scale), décalage de hauteur en demi-tons)
CAST = {
    "G": ("gilles", 0.92, -1.0),
    "I": ("siwis", 0.95, 0.0),
    "L": ("siwis", 0.9, 5.0),
    "C": ("mls", 0.6, -2.0),
}


def ensure_voice(key):
    name = VOICE_FILES[key]
    d = os.path.join(VOICES, name)
    onnx = os.path.join(d, name + ".onnx")
    if not os.path.exists(onnx):
        os.makedirs(d, exist_ok=True)
        tgz = os.path.join(VOICES, "voice-%s.tar.gz" % name)
        urllib.request.urlretrieve(RELEASE + "voice-%s.tar.gz" % name, tgz)
        with tarfile.open(tgz) as t:
            t.extractall(d, filter="data")
        os.remove(tgz)
    return onnx


def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return x, w.getframerate()


def to_sr(path_in, path_out, semitones):
    """Rééchantillonne à SR et applique un éventuel décalage de hauteur (ffmpeg)."""
    af = []
    if semitones:
        f = 2 ** (semitones / 12.0)
        with wave.open(path_in) as w:
            sr = w.getframerate()
        af.append("asetrate=%d,atempo=%.5f" % (int(sr * f), 1 / f))
    af.append("aresample=%d" % SR)
    af.append("silenceremove=start_periods=1:start_threshold=-45dB")
    af.append("areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse")
    # raccourcit les pauses internes trop longues (garde 0,22 s)
    af.append("silenceremove=stop_periods=-1:stop_duration=0.45:stop_threshold=-42dB:stop_silence=0.35")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path_in, "-af", ",".join(af),
                    "-ac", "1", path_out], check=True)


def synth_lines():
    from piper import PiperVoice, SynthesisConfig

    os.makedirs(os.path.join(BUILD, "lines"), exist_ok=True)
    loaded = {}
    out = []
    for i, (who, text, _, _) in enumerate(LINES):
        if who.startswith("@"):
            out.append(None)
            continue
        voice_key, speed, semis = CAST[who]
        final = os.path.join(BUILD, "lines", "%02d_%s.wav" % (i, who))
        if not os.path.exists(final):
            if voice_key not in loaded:
                loaded[voice_key] = PiperVoice.load(ensure_voice(voice_key))
            raw = final.replace(".wav", "_raw.wav")
            with wave.open(raw, "wb") as w:
                loaded[voice_key].synthesize_wav(
                    text.replace("...", ","), w,
                    syn_config=SynthesisConfig(length_scale=speed, noise_scale=0.6, noise_w_scale=0.7))
            to_sr(raw, final, semis)
            os.remove(raw)
        out.append(final)
    return out


def train_ambience(seconds, seed=1):
    """Roulement grave + « tac-tac » des joints de rails."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    white = rng.standard_normal(n).astype(np.float32)
    # bruit brun (roulement)
    brown = np.cumsum(white)
    brown -= np.convolve(brown, np.ones(2000) / 2000, mode="same")
    brown /= np.abs(brown).max() + 1e-9
    rumble = brown * 0.10
    # légère modulation
    t = np.arange(n) / SR
    rumble *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.23 * t)
    # clac-clac périodiques
    clacks = np.zeros(n, dtype=np.float32)
    k = np.arange(int(0.05 * SR))
    click = np.exp(-k / (0.008 * SR)) * np.sin(2 * np.pi * 95 * k / SR)
    period = 1.55
    for start in np.arange(0.4, seconds, period):
        for off in (0.0, 0.16):
            i0 = int((start + off) * SR)
            if i0 + len(click) < n:
                clacks[i0:i0 + len(click)] += click * 0.09
    return (rumble + clacks).astype(np.float32)


def footsteps(times, n):
    out = np.zeros(n, dtype=np.float32)
    k = np.arange(int(0.06 * SR))
    step = np.exp(-k / (0.012 * SR)) * np.random.default_rng(3).standard_normal(len(k)) * 0.12
    for t in times:
        i0 = int(t * SR)
        if 0 <= i0 and i0 + len(step) < n:
            out[i0:i0 + len(step)] += step
    return out


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
