#!/usr/bin/env python3
"""Football Facts — générateur automatique de vidéos TikTok verticales (1080x1920).

Usage :
    python3 generate.py projects/ronaldo.json            # vidéo complète
    python3 generate.py projects/ronaldo.json --preview  # quelques images PNG seulement
    python3 generate.py projects/ronaldo.json --engine espeak

Tout est généré localement : voix (edge-tts ou espeak-ng), musique et effets
sonores synthétisés, animations dessinées par le code, sous-titres incrustés.
Aucune image ou vidéo externe n'est utilisée.
"""
import argparse
import asyncio
import ctypes
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, SR = 1080, 1920, 30, 44100

BG = (11, 15, 20)        # #0B0F14
NEON = (0, 255, 126)     # #00FF7E
WHITE = (255, 255, 255)
DIM = (120, 135, 150)

FONT_XB = os.path.join(ROOT, "assets/fonts/Montserrat-ExtraBold.woff")
FONT_BLACK = os.path.join(ROOT, "assets/fonts/Montserrat-Black.woff")
EMOJI_FONTS = [
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    "/system/fonts/NotoColorEmoji.ttf",  # Android / Termux
]

# --------------------------------------------------------------------------
# Utilitaires
# --------------------------------------------------------------------------

def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_cubic(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out_back(x, s=1.9):
    x = clamp(x)
    x -= 1
    return 1 + x * x * ((s + 1) * x + s)


def lerp(a, b, x):
    return a + (b - a) * x


def strip_marks(s):
    return s.replace("*", "")


def run(cmd):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        sys.exit("Commande échouée : %s\n%s" % (" ".join(cmd), r.stderr.decode()[-2000:]))
    return r.stdout


def load_audio(path, tempo=1.0):
    """Lit n'importe quel fichier audio en mono float32 44.1 kHz (via ffmpeg)."""
    af = ["-af", "atempo=%.4f" % tempo] if abs(tempo - 1) > 1e-3 else []
    raw = run(["ffmpeg", "-v", "error", "-i", path, *af, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim_silence(a, thr=0.012, pad=0.03):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): min(len(a), idx[-1] + p)]


# --------------------------------------------------------------------------
# Voix off
# --------------------------------------------------------------------------

class EspeakTTS:
    """espeak-ng hors ligne via le paquet pip `espeakng-loader` (ou libespeak-ng système)."""

    name = "espeak-ng"

    def __init__(self, voice="fr", rate=180):
        try:
            import espeakng_loader as E
            lib_path, data_path = E.get_library_path(), E.get_data_path()
        except ImportError:
            lib_path, data_path = "libespeak-ng.so.1", None
        self.lib = ctypes.cdll.LoadLibrary(lib_path)
        self.sr = self.lib.espeak_Initialize(1, 0, data_path.encode() if data_path else None, 0)
        if self.sr <= 0:
            raise RuntimeError("espeak-ng n'a pas pu s'initialiser")
        self.buf = bytearray()
        CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)

        def cb(wav, n, _ev):
            if n > 0:
                self.buf.extend(ctypes.string_at(wav, n * 2))
            return 0

        self._cb = CB(cb)
        self.lib.espeak_SetSynthCallback(self._cb)
        self.lib.espeak_SetVoiceByName(voice.encode())
        self.lib.espeak_SetParameter(1, int(rate), 0)  # vitesse (mots/min)
        self.lib.espeak_SetParameter(3, 58, 0)         # hauteur
        self.lib.espeak_SetParameter(4, 70, 0)         # intonation

    def synth(self, text, path):
        self.buf = bytearray()
        t = text.encode("utf-8")
        self.lib.espeak_Synth(t, len(t) + 1, 0, 1, 0, 1, None, None)
        self.lib.espeak_Synchronize()
        with wave.open(path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(self.sr)
            w.writeframes(bytes(self.buf))


class EdgeTTS:
    """Voix neuronales Microsoft gratuites (nécessite Internet, pas de clé API)."""

    name = "edge-tts"

    def __init__(self, voice, rate):
        import edge_tts  # noqa: F401
        self.voice, self.rate = voice, rate
        self.proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

    def synth(self, text, path):
        import edge_tts

        async def go():
            kw = {"proxy": self.proxy} if self.proxy else {}
            await edge_tts.Communicate(text, self.voice, rate=self.rate, **kw).save(path)

        asyncio.run(asyncio.wait_for(go(), 30))
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            raise RuntimeError("edge-tts n'a renvoyé aucun audio")


def make_tts(engine, cfg, tmp):
    errors = []
    order = ["edge", "espeak"] if engine == "auto" else [engine]
    for name in order:
        try:
            if name == "edge":
                tts = EdgeTTS(cfg["edge_voice"], cfg["edge_rate"])
                tts.synth("Test.", os.path.join(tmp, "probe.mp3"))
            else:
                tts = EspeakTTS(cfg["espeak_voice"], cfg["espeak_rate"])
            return tts
        except Exception as e:  # moteur indisponible -> on essaie le suivant
            errors.append("%s : %s" % (name, str(e).splitlines()[0] if str(e) else type(e).__name__))
    sys.exit("Aucun moteur vocal disponible.\n  " + "\n  ".join(errors) +
             "\nInstallez-en un : pip install edge-tts   (ou)   pip install espeakng-loader")


# --------------------------------------------------------------------------
# Timeline : voix découpée par phrase -> sous-titres parfaitement synchronisés
# --------------------------------------------------------------------------

def build_timeline(project, tts, tmp):
    gap = 0.16
    t0 = 0.0
    scenes = []
    voice_clips = []  # (start, samples)
    for si, sc in enumerate(project["scenes"]):
        dur = float(sc["duration"])
        lead = 0.35 if si == 0 else 0.22
        tail = 0.35
        paths = []
        for li, ln in enumerate(sc["lines"]):
            p = os.path.join(tmp, "v_%d_%d.%s" % (si, li, "mp3" if tts.name == "edge-tts" else "wav"))
            tts.synth(ln.get("say", strip_marks(ln["text"])), p)
            paths.append(p)
        clips = [trim_silence(load_audio(p)) for p in paths]
        total = sum(len(c) for c in clips) / SR + gap * (len(clips) - 1)
        avail = dur - lead - tail
        tempo = 1.0
        if total > avail:
            tempo = min(total / avail, 1.45)
            clips = [trim_silence(load_audio(p, tempo)) for p in paths]
            total = sum(len(c) for c in clips) / SR + gap * (len(clips) - 1)
        if total > avail:
            dur = total + lead + tail
            print("  ! scène '%s' allongée à %.2fs pour caser la narration" % (sc["id"], dur))
        lines, t = [], t0 + lead
        for ln, c in zip(sc["lines"], clips):
            d = len(c) / SR
            lines.append({"text": ln["text"], "start": t, "end": t + d})
            voice_clips.append((t, c))
            t += d + gap
        for i, ln in enumerate(lines):  # le sous-titre reste affiché jusqu'au suivant
            ln["hold"] = lines[i + 1]["start"] if i + 1 < len(lines) else min(ln["end"] + 0.6, t0 + dur - 0.05)
        scenes.append({**sc, "start": t0, "dur": dur, "end": t0 + dur, "lines": lines, "tempo": tempo})
        print("  scène %-10s %5.2fs → %5.2fs  voix %.2fs (tempo x%.2f)" % (sc["id"], t0, t0 + dur, total, tempo))
        t0 += dur
    return scenes, t0, voice_clips


# --------------------------------------------------------------------------
# Audio : musique + effets sonores 100 % synthétisés (libres de droits)
# --------------------------------------------------------------------------

def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tone(freq, dur, harmonics=6, decay=None, detune=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in (freq * (1 - detune), freq, freq * (1 + detune)) if detune else (freq,):
        for k in range(1, harmonics + 1):
            if f * k > SR / 2.2:
                break
            out += np.sin(2 * np.pi * f * k * t) / k
    if decay:
        out *= np.exp(-t / decay)
    return out / max(1e-9, np.abs(out).max())


def band_noise(n, lo, hi, rng):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    out = np.fft.irfft(spec, n)
    return out / max(1e-9, np.abs(out).max())


def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def make_music(scenes, total, bpm, rng):
    buf = np.zeros(int(total * SR) + SR)
    beat = 60.0 / bpm
    drop = scenes[1]["start"]               # la batterie démarre après le hook
    full = scenes[2]["start"]               # arpège + charleston 16e
    end_music = total - 0.6

    kick_t = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * np.pi * (45 * kick_t + 110 * 0.045 * (1 - np.exp(-kick_t / 0.045)))) * np.exp(-kick_t / 0.12)
    clap = band_noise(int(0.18 * SR), 900, 6000, rng) * np.exp(-np.arange(int(0.18 * SR)) / SR / 0.05)
    hat = band_noise(int(0.05 * SR), 7000, 16000, rng) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.012)

    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
    roots = [33, 29, 36, 31]
    bar = 4 * beat
    nbars = int(total / bar) + 2
    for b in range(nbars):
        bs = b * bar
        if bs > end_music:
            break
        ch, root = chords[b % 4], roots[b % 4]
        # nappe
        pad = sum(tone(midi_hz(m), bar, harmonics=5, detune=0.004) for m in ch) / 3
        env = np.minimum(1, np.arange(len(pad)) / (0.25 * SR)) * np.minimum(1, (len(pad) - np.arange(len(pad))) / (0.1 * SR))
        add(buf, bs, pad * env, 0.10 if bs >= drop else 0.06)
        if bs + bar < drop:
            continue
        for i in range(8):                                             # basse en croches
            st = bs + i * beat / 2
            if st < drop or st > end_music:
                continue
            m = root + (12 if i % 2 else 0)
            add(buf, st, tone(midi_hz(m), beat / 2 * 0.9, harmonics=8, decay=0.12), 0.28)
        for i in range(4):
            st = bs + i * beat
            if st < drop - 1e-6 or st > end_music:
                continue
            add(buf, st, kick, 0.75)
            if i in (1, 3):
                add(buf, st, clap, 0.32)
        for i in range(16 if bs >= full else 8):
            step = beat / 4 if bs >= full else beat / 2
            st = bs + i * step
            if st < drop or st > end_music or (bs < full and i % 2 == 0):
                continue
            add(buf, st, hat, 0.12 if i % 2 else 0.07)
        if bs >= full:                                                 # arpège
            for i in range(16):
                st = bs + i * beat / 4
                if st > end_music:
                    break
                m = ch[(i * 2 + i // 4) % 3] + 12
                add(buf, st, tone(midi_hz(m), beat / 4, harmonics=4, decay=0.06), 0.07)
    # montée avant le drop
    n = int(drop * SR)
    riser = band_noise(n, 2000, 9000, rng) * np.linspace(0, 1, n) ** 2
    add(buf, 0, riser, 0.10)
    fade = int(0.6 * SR)
    e = int(end_music * SR)
    buf[e:e + fade] *= np.linspace(1, 0, len(buf[e:e + fade]))
    buf[e + fade:] = 0
    return buf


def make_sfx(scenes, total, rng):
    buf = np.zeros(int(total * SR) + SR)
    # impact d'ouverture
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 * t + 80 * 0.06 * (1 - np.exp(-t / 0.06)))) * np.exp(-t / 0.45)
    boom += band_noise(n, 80, 3000, rng) * np.exp(-t / 0.08) * 0.5
    add(buf, 0.0, boom / np.abs(boom).max(), 0.85)
    # whoosh à chaque transition
    n = int(0.55 * SR)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    for sc in scenes[1:]:
        w = band_noise(n, 600, 5000, rng) * env
        add(buf, sc["start"] - 0.3, w, 0.35)
        add(buf, sc["start"], boom[: int(0.5 * SR)] / np.abs(boom).max(), 0.35)
    # "pop" à chaque carte de stats
    for sc in scenes:
        if sc["visual"] in ("records", "explosion", "debuts", "outro"):
            for ln in sc["lines"]:
                pop = tone(1320, 0.18, harmonics=2, decay=0.04) + 0.5 * tone(1980, 0.18, harmonics=1, decay=0.03)
                add(buf, ln["start"] - 0.02, pop, 0.10)
    return buf


def mix_audio(scenes, total, voice_clips, music_db, out_wav):
    rng = np.random.default_rng(7)
    voice = np.zeros(int(total * SR) + SR)
    for st, c in voice_clips:
        c = c / max(1e-9, np.abs(c).max()) * 0.85
        add(voice, st, c)
    # enveloppe de la voix -> ducking de la musique
    k = int(0.05 * SR)
    env = np.convolve(np.abs(voice) > 0.02, np.ones(k) / k, mode="same")
    env = np.convolve(env > 0.05, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    music = make_music(scenes, total, 124, rng) * (10 ** (music_db / 20)) * 3.2
    music *= 1 - 0.45 * np.clip(env, 0, 1)
    sfx = make_sfx(scenes, total, rng)
    mix = voice + music + sfx * 0.6
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)                 # limiteur doux
    mix = mix[: int(total * SR)]
    pcm = (np.clip(mix, -1, 1) * 32000).astype(np.int16)
    stereo = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


# --------------------------------------------------------------------------
# Typographie : texte riche (*mot clé* en vert néon) + emojis couleur
# --------------------------------------------------------------------------

@lru_cache(None)
def font(size, black=False):
    return ImageFont.truetype(FONT_BLACK if black else FONT_XB, size)


def is_emoji(ch):
    o = ord(ch)
    return o >= 0x1F000 or 0x2600 <= o <= 0x27BF or 0x2B00 <= o <= 0x2BFF


@lru_cache(None)
def emoji_img(ch, height):
    path = next((p for p in EMOJI_FONTS if os.path.exists(p)), None)
    if not path:
        return None
    f = ImageFont.truetype(path, 109)
    im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    return im.resize((int(im.width * height / im.height), height), Image.LANCZOS)


NBSP = "\u00a0"


def parse_runs(text):
    """'Une *légende* 🤯' -> [(mot, [(segment, est_mot_cle, est_emoji)]), ...]"""
    text = text.replace("\ufe0f", "")
    # ponctuation française (« ? », « ! », « : ») et emojis restent collés au mot précédent
    text = re.sub(r" (?=\*?[?!:;]|[\U0001F000-\U0001FFFF\u2600-\u27BF\u2B00-\u2BFF])", NBSP, text)
    words, kw = [], False
    for raw in text.split(" "):
        segs = []
        for ch in raw:
            if ch == "*":
                kw = not kw
                continue
            em = is_emoji(ch)
            if segs and segs[-1][1] == kw and not em and not segs[-1][2]:
                segs[-1] = (segs[-1][0] + ch, kw, False)
            else:
                segs.append((ch, kw, em))
        if segs:
            words.append(segs)
    return words


@lru_cache(None)
def rich_text(text, size, max_w=960, upper=True, stroke=0, color=WHITE, kw_color=NEON,
              black=False, align="center", line_gap=0.12, balance=True):
    """Rend un texte riche multi-lignes dans une image RGBA (mise en cache)."""
    f = font(size, black)
    t = text.upper() if upper else text
    words = parse_runs(t)
    space = f.getlength(" ")
    eh = int(size * 0.95)

    def seg_w(s):
        return (emoji_img(s[0], eh).width + 6 if emoji_img(s[0], eh) else 0) if s[2] else f.getlength(s[0])

    def word_w(wd):
        return sum(seg_w(s) for s in wd)

    def wrap(limit):
        lines, cur, cw = [], [], 0
        for wd in words:
            ww = word_w(wd)
            if cur and cw + space + ww > limit:
                lines.append((cur, cw))
                cur, cw = [], 0
            cw = cw + (space if cur else 0) + ww
            cur.append(wd)
        if cur:
            lines.append((cur, cw))
        return lines

    lines = wrap(max_w)
    if balance and len(lines) > 1:  # lignes équilibrées : plus petite largeur gardant le même nombre de lignes
        lo, hi = max(word_w(wd) for wd in words), max_w
        while hi - lo > 4:
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if len(wrap(mid)) <= len(lines) else (mid, hi)
        lines = wrap(hi)
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * (1 + line_gap))
    pad = stroke + 4
    width = int(max(lw for _, lw in lines)) + 2 * pad
    img = Image.new("RGBA", (width, lh * len(lines) + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, (wds, lw) in enumerate(lines):
        x = pad + ((width - 2 * pad - lw) / 2 if align == "center" else 0)
        y = pad + i * lh
        for wi, wd in enumerate(wds):
            if wi:
                x += space
            for s in wd:
                if s[2]:
                    em = emoji_img(s[0], eh)
                    if em:
                        img.alpha_composite(em, (int(x + 3), int(y + (asc - eh) * 0.6)))
                        x += em.width + 6
                    continue
                d.text((x, y), s[0], font=f, fill=kw_color if s[1] else color,
                       stroke_width=stroke, stroke_fill=(0, 0, 0))
                x += f.getlength(s[0])
    return img


def with_glow(img, radius=14, strength=1.0):
    pad = radius * 3
    big = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    big.alpha_composite(img, (pad, pad))
    g = big.filter(ImageFilter.GaussianBlur(radius))
    if strength != 1.0:
        g.putalpha(g.getchannel("A").point(lambda a: min(255, int(a * strength))))
    g.alpha_composite(big)
    return g


def paste(layer, img, cx, cy, scale=1.0, alpha=1.0):
    if img is None or alpha <= 0.01 or scale <= 0.01:
        return
    if abs(scale - 1) > 1e-3:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.BILINEAR)
    if alpha < 0.999:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda a: int(a * alpha)))
    x, y = int(cx - img.width / 2), int(cy - img.height / 2)
    # alpha_composite n'accepte pas les coordonnées négatives : on rogne
    sx, sy = max(0, -x), max(0, -y)
    if sx or sy:
        img = img.crop((sx, sy, img.width, img.height))
        x, y = x + sx, y + sy
    if x < layer.width and y < layer.height:
        layer.alpha_composite(img, (x, y))


# --------------------------------------------------------------------------
# Éléments graphiques
# --------------------------------------------------------------------------

def ball_icon(r, color=NEON, width=None):
    s = 2 * r + 8
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    lw = width or max(3, r // 7)
    d.ellipse((c - r, c - r, c + r, c + r), outline=color, width=lw)
    pent = [(c + r * 0.38 * math.cos(math.radians(-90 + 72 * k)), c + r * 0.38 * math.sin(math.radians(-90 + 72 * k))) for k in range(5)]
    d.polygon(pent, fill=color)
    for (px, py) in pent:
        a = math.atan2(py - c, px - c)
        d.line((px, py, c + r * math.cos(a), c + r * math.sin(a)), fill=color, width=lw)
    return im


@lru_cache(None)
def logo(scale=1.0, glow=True):
    """Logo Football Facts : ballon néon + 'FOOTBALL / FACTS'."""
    r = int(46 * scale)
    b = ball_icon(r)
    t1 = rich_text("FOOTBALL", int(40 * scale), upper=False, max_w=2000, align="left")
    t2 = rich_text("*FACTS*", int(40 * scale), upper=False, max_w=2000, align="left", black=True)
    w = b.width + int(14 * scale) + max(t1.width, t2.width)
    h = max(b.height, t1.height + t2.height - int(16 * scale))
    im = Image.new("RGBA", (w + 10, h + 10), (0, 0, 0, 0))
    im.alpha_composite(b, (0, (h - b.height) // 2))
    x = b.width + int(14 * scale)
    im.alpha_composite(t1, (x, 0))
    im.alpha_composite(t2, (x, t1.height - int(16 * scale)))
    return with_glow(im, int(8 * scale), 0.6) if glow else im


@lru_cache(None)
def chip(text, size=34):
    """Étiquette de rubrique : fond néon, texte noir."""
    t = rich_text(text, size, color=BG, max_w=2000)
    im = Image.new("RGBA", (t.width + 50, t.height + 16), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=im.height // 2, fill=NEON)
    im.alpha_composite(t, (25, 8))
    return with_glow(im, 12, 0.7)


@lru_cache(None)
def card(big, label, w, h, emoji=None):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((3, 3, w - 4, h - 4), radius=28, fill=(16, 24, 30, 235), outline=NEON, width=4)
    bt = rich_text("*%s*" % big, int(h * 0.36), black=True, max_w=w - 40)
    lt = rich_text(label, int(h * 0.105), max_w=w - 50, color=WHITE)
    y = h * 0.47 if label else h / 2
    paste(im, bt, w / 2, y - bt.height * 0.18 if label else y)
    if label:
        paste(im, lt, w / 2, h * 0.79)
    return with_glow(im, 14, 0.55)


MADEIRA = [(0.00, 0.45), (0.05, 0.33), (0.13, 0.22), (0.24, 0.12), (0.36, 0.07), (0.48, 0.06), (0.58, 0.09),
           (0.66, 0.14), (0.72, 0.24), (0.78, 0.33), (0.86, 0.38), (0.93, 0.40), (1.00, 0.42), (0.93, 0.46),
           (0.85, 0.47), (0.77, 0.50), (0.72, 0.60), (0.64, 0.70), (0.55, 0.78), (0.44, 0.82), (0.34, 0.80),
           (0.24, 0.74), (0.15, 0.66), (0.07, 0.57), (0.00, 0.45)]


def polyline_partial(pts, frac):
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    goal, out = sum(seg) * clamp(frac), [pts[0]]
    for i, L in enumerate(seg):
        if goal >= L:
            out.append(pts[i + 1])
            goal -= L
        else:
            a = goal / L if L else 0
            out.append((lerp(pts[i][0], pts[i + 1][0], a), lerp(pts[i][1], pts[i + 1][1], a)))
            break
    return out


@lru_cache(None)
def crown(w):
    h = int(w * 0.7)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = [(0.05, 0.85), (0.05, 0.25), (0.28, 0.55), (0.5, 0.08), (0.72, 0.55), (0.95, 0.25), (0.95, 0.85)]
    P = [(x * w, y * h) for x, y in pts]
    d.polygon(P, fill=(0, 255, 126, 40))
    d.line(P + [P[0]], fill=NEON, width=max(4, w // 40), joint="curve")
    for x, y in [(0.05, 0.25), (0.5, 0.08), (0.95, 0.25)]:
        r = w * 0.045
        d.ellipse((x * w - r, y * h - r, x * w + r, y * h + r), fill=NEON)
    return with_glow(im, 18, 0.9)


# --------------------------------------------------------------------------
# Fond (pré-calculé) + particules
# --------------------------------------------------------------------------

def build_background():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32) + np.array(BG, np.float32)
    g1 = np.exp(-(((xx - W * 0.5) / 700) ** 2 + ((yy - H * 0.32) / 650) ** 2))
    img += g1[..., None] * np.array([0, 38, 22], np.float32)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    lc = (20, 46, 34)
    # terrain stylisé en perspective (bas de l'écran)
    hy = 1420
    d.line((0, hy, W, hy), fill=lc, width=3)
    d.ellipse((W / 2 - 330, hy - 90, W / 2 + 330, hy + 90), outline=lc, width=3)
    for k in range(-6, 7):
        d.line((W / 2 + k * 60, hy - 260, W / 2 + k * 260, H), fill=(16, 30, 26), width=2)
    arr = np.asarray(im).astype(np.float32)
    vig = 1 - 0.55 * np.clip(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2, 0, 1)
    arr *= vig[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")


RNG_P = np.random.default_rng(3)
PARTICLES = [(RNG_P.uniform(0, W), RNG_P.uniform(0, H), RNG_P.uniform(10, 50), RNG_P.uniform(2, 5),
              RNG_P.uniform(0.25, 1)) for _ in range(55)]


def draw_particles(d, t):
    for x0, y0, v, r, a in PARTICLES:
        x = (x0 + math.sin(t * 0.7 + x0) * 20) % W
        y = (y0 - v * t) % H
        c = tuple(int(BG[i] + (NEON[i] - BG[i]) * 0.35 * a) for i in range(3))
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)


# --------------------------------------------------------------------------
# Scènes
# --------------------------------------------------------------------------

def line_t(sc, i):
    i = min(i, len(sc["lines"]) - 1)
    return sc["lines"][i]["start"] - sc["start"]


def scene_hook(L, sc, ts):
    # anneaux d'onde de choc
    d = ImageDraw.Draw(L)
    for k, t0 in enumerate((0.0, 0.25, 1.4)):
        p = (ts - t0) / 1.1
        if 0 <= p <= 1:
            r = lerp(60, 1000, ease_out_cubic(p))
            a = int(255 * (1 - p) * 0.8)
            d.ellipse((W / 2 - r, 820 - r, W / 2 + r, 820 + r), outline=NEON + (a,), width=int(lerp(16, 2, p)))
    # énorme 7 en filigrane
    seven = rich_text("7", 1100, black=True, color=(0, 255, 126), kw_color=NEON, upper=False)
    s7 = seven.copy()
    s7.putalpha(s7.getchannel("A").point(lambda a: int(a * 0.10)))
    paste(L, s7, W / 2 + 40, 860, lerp(1.25, 1.0, ease_out_cubic(ts / 3)))
    # titre : zoom percutant
    title = glow_title(sc["on_screen"], 112)
    s = lerp(2.3, 1.0, ease_out_back(ts / 0.5)) * lerp(1.0, 1.07, clamp((ts - 0.5) / 2.5))
    paste(L, title, W / 2, 820, s, clamp(ts / 0.12))
    sub = rich_text("L'HISTOIRE DE *CRISTIANO RONALDO*", 44, max_w=900)
    paste(L, sub, W / 2, 1230, 1.0, clamp((ts - 0.7) / 0.3))


@lru_cache(None)
def glow_title(text, size):
    return with_glow(rich_text(text, size, max_w=930, stroke=4), 16, 0.8)


def scene_debuts(L, sc, ts):
    paste(L, chip("LES DÉBUTS"), W / 2, 300, ease_out_back(ts / 0.4))
    # carte de Madère qui se dessine
    bx, by, bw, bh = 120, 400, 840, 420
    pts = [(bx + x * bw, by + y * bh) for x, y in MADEIRA]
    p = ease_in_out(ts / 1.6)
    layer = Image.new("RGBA", (W, 900), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if p >= 1:
        d.polygon(pts, fill=(0, 255, 126, 38))
    d.line(polyline_partial(pts, p), fill=NEON + (255,), width=7, joint="curve")
    L.alpha_composite(with_glow(layer, 10, 0.8), (-30, -30))
    # épingle Funchal
    fx, fy = bx + 0.60 * bw, by + 0.73 * bh
    pp = ease_out_back((ts - 1.2) / 0.5)
    if pp > 0:
        dd = ImageDraw.Draw(L)
        pulse = (ts * 1.2) % 1
        r = 14 + 50 * pulse
        dd.ellipse((fx - r, fy - r, fx + r, fy + r), outline=NEON + (int(200 * (1 - pulse)),), width=4)
        yy = fy - 60 * (1 - pp)
        dd.ellipse((fx - 16, yy - 16, fx + 16, yy + 16), fill=WHITE, outline=NEON, width=6)
        lab = rich_text("FUNCHAL, *MADÈRE*", 46, max_w=900)
        paste(L, lab, W / 2, by - 10 + bh + 95, 1, clamp((ts - 1.3) / 0.3))
        dt = rich_text("5 FÉVRIER 1985", 34, color=DIM, max_w=900)
        paste(L, dt, W / 2, by + bh + 145, 1, clamp((ts - 1.5) / 0.3))
    # frise chronologique synchronisée avec la voix
    nodes = [("1985", "NAISSANCE", line_t(sc, 0)), ("1997", "SPORTING · 12 ANS", line_t(sc, 1)),
             ("2002", "PRO · 17 ANS", line_t(sc, 3))]
    y = 1150
    xs = [200, 540, 880]
    dd = ImageDraw.Draw(L)
    prog = clamp((ts - nodes[0][2]) / max(0.1, nodes[2][2] - nodes[0][2]))
    dd.line((xs[0], y, xs[2], y), fill=(40, 60, 55, 255), width=6)
    dd.line((xs[0], y, lerp(xs[0], xs[2], prog), y), fill=NEON + (255,), width=6)
    for x, (yr, lab, t0) in zip(xs, nodes):
        on = ts >= t0
        a = ease_out_back((ts - t0) / 0.35)
        r = 18 if on else 12
        dd.ellipse((x - r, y - r, x + r, y + r), fill=NEON if on else (40, 60, 55), outline=BG, width=4)
        if on:
            paste(L, rich_text("*%s*" % yr, 46, black=True), x, y - 62, a)
            paste(L, rich_text(lab, 25, max_w=320, color=WHITE), x, y + 58, 1, clamp((ts - t0) / 0.3))


def scene_explosion(L, sc, ts):
    paste(L, chip("L'EXPLOSION"), W / 2, 300, ease_out_back(ts / 0.4))
    t_relache, t_2008, t_bdo = line_t(sc, 2), line_t(sc, 3), line_t(sc, 4)
    # Phase A : le numéro 7 se remplit
    move = ease_in_out((ts - (t_relache - 0.2)) / 0.6)
    fill = ease_in_out((ts - 0.3) / 1.6)
    s7 = glow_seven()
    cy = lerp(760, 560, move)
    sc7 = lerp(1.0, 0.62, move) * lerp(0.9, 1.0, ease_out_cubic(ts / 0.6))
    # contour + remplissage progressif (de bas en haut)
    filled = s7.copy()
    cut = int(filled.height * (1 - fill))
    mask = Image.new("L", filled.size, 0)
    ImageDraw.Draw(mask).rectangle((0, cut, filled.width, filled.height), fill=255)
    outline_only = seven_outline()
    paste(L, outline_only, W / 2, cy, sc7)
    comp = Image.new("RGBA", filled.size, (0, 0, 0, 0))
    comp.paste(filled, (0, 0), mask)
    paste(L, comp, W / 2, cy, sc7)
    mu = rich_text("MANCHESTER UNITED · *2003*", 52, max_w=960)
    paste(L, mu, W / 2, lerp(1210, 870, move), 1, clamp((ts - 0.5) / 0.3) * (1 - clamp((ts - t_2008 + 0.3) / 0.3)))
    # Phase B : mots-clés de la progression
    for i, wd in enumerate(["TRAVAIL", "VITESSE", "PUISSANCE"]):
        t0 = t_relache + 0.15 + i * 0.25
        a = clamp((ts - t0) / 0.2) * (1 - clamp((ts - t_2008 + 0.2) / 0.25))
        paste(L, rich_text("*%s*" % wd, 66, black=True), W / 2, 980 + i * 85, ease_out_back((ts - t0) / 0.3), a)
    # Phase C : trophées 2008
    cards = [("🏆", "LIGUE DES CHAMPIONS 2008", t_2008), ("⚽", "BALLON D'OR 2008", t_bdo)]
    for i, (em, lab, t0) in enumerate(cards):
        c = card(em, lab, 470, 330)
        x = [300, 780][i]
        k = ease_out_back((ts - t0) / 0.4)
        paste(L, c, x + (1 - clamp((ts - t0) / 0.35)) * (-300 if i == 0 else 300), 1000, k)


@lru_cache(None)
def glow_seven():
    return with_glow(rich_text("*7*", 760, black=True, upper=False), 22, 0.9)


@lru_cache(None)
def seven_outline():
    t = rich_text("7", 760, black=True, upper=False, color=BG, stroke=6)
    a = np.asarray(t).copy()
    # remplace le contour noir par un néon atténué
    m = a[..., 3] > 0
    dark = m & (a[..., :3].sum(-1) < 60)
    a[dark] = (0, 160, 80, 255)
    return with_glow(Image.fromarray(a), 22, 0.9)


def scene_records(L, sc, ts):
    paste(L, chip("LES RECORDS"), W / 2, 300, ease_out_back(ts / 0.4))
    items = [
        ("5", "BALLONS D'OR", 0, (295, 505), (470, 280), 5),
        ("5", "LIGUES DES CHAMPIONS", 1, (785, 505), (470, 280), 5),
        ("140", "BUTS EN LIGUE DES CHAMPIONS · RECORD", 2, (295, 805), (470, 280), 140),
        ("🏆", "EURO 2016 AVEC LE PORTUGAL", 3, (785, 805), (470, 280), None),
        ("140+", "BUTS EN SÉLECTION · RECORD MONDIAL", 4, (540, 1090), (960, 250), 140),
    ]
    for big, lab, li, (x, y), (w, h), count in items:
        t0 = line_t(sc, li)
        if ts < t0 - 0.05:
            continue
        p = clamp((ts - t0) / 0.7)
        if count is not None:
            n = int(round(count * ease_out_cubic(p)))
            big_txt = ("%d+" % n) if big.endswith("+") else str(n)
            if p >= 1:
                big_txt = big
        else:
            big_txt = big
        c = card(big_txt, lab, w, h)
        paste(L, c, x, y + 40 * (1 - ease_out_cubic((ts - t0) / 0.35)), ease_out_back((ts - t0) / 0.4),
              clamp((ts - t0) / 0.2))


def scene_outro(L, sc, ts):
    t_sub = line_t(sc, 2)
    out = ease_in_out((ts - t_sub + 0.3) / 0.5)
    k = ease_out_back(ts / 0.5)
    paste(L, crown(260), W / 2, lerp(420, 300, out), k * (1 + 0.04 * math.sin(ts * 5)))
    title = glow_title(sc["on_screen"], 96)
    paste(L, title, W / 2, lerp(720, 520, out), lerp(1.8, 1.0, ease_out_back(ts / 0.45)) * lerp(1, 0.78, out),
          clamp(ts / 0.15))
    t_com = line_t(sc, 1)
    c2 = chip("💬 DIS-LE EN COMMENTAIRE", 36)
    paste(L, c2, W / 2, lerp(960, 720, out), ease_out_back((ts - t_com) / 0.4), clamp((ts - t_com) / 0.2))
    if ts >= t_sub - 0.1:
        p = ease_out_back((ts - t_sub) / 0.5)
        paste(L, logo(2.0), W / 2, 930, p)
        pulse = 1 + 0.05 * math.sin((ts - t_sub) * 9)
        btn = subscribe_button()
        paste(L, btn, W / 2, 1140, ease_out_back((ts - t_sub - 0.3) / 0.4) * pulse)


@lru_cache(None)
def subscribe_button():
    t = rich_text("+ ABONNE-TOI", 54, color=BG, black=True, max_w=2000)
    im = Image.new("RGBA", (t.width + 110, t.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=im.height // 2, fill=NEON)
    im.alpha_composite(t, (55, 20))
    return with_glow(im, 20, 1.0)


SCENES = {"hook": scene_hook, "debuts": scene_debuts, "explosion": scene_explosion,
          "records": scene_records, "outro": scene_outro}

# --------------------------------------------------------------------------
# Rendu d'une image
# --------------------------------------------------------------------------

STATE = {}


@lru_cache(None)
def subtitle_img(text):
    img = rich_text(text, 72, max_w=940, stroke=9, line_gap=0.05)
    sh = Image.new("RGBA", (img.width + 60, img.height + 60), (0, 0, 0, 0))
    blk = Image.new("RGBA", img.size, (0, 0, 0, 0))
    blk.putalpha(img.getchannel("A").point(lambda a: int(a * 0.75)))
    sh.alpha_composite(blk, (30, 38))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    sh.alpha_composite(img, (30, 30))
    return sh


def render_frame(fi):
    t = fi / FPS
    scenes, total, bg = STATE["scenes"], STATE["total"], STATE["bg"]
    frame = bg.copy()
    draw_particles(ImageDraw.Draw(frame), t)
    sc = next((s for s in scenes if s["start"] <= t < s["end"]), scenes[-1])
    ts = t - sc["start"]
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    SCENES[sc["visual"]](L, sc, ts)
    # caméra : léger zoom continu, punch-in d'entrée, tremblement au hook
    z = 1 + 0.035 * (ts / sc["dur"])
    z *= 1 + 0.12 * (1 - ease_out_cubic(ts / 0.3))           # entrée de scène
    z *= 1 + 0.10 * ease_in_out((ts - (sc["dur"] - 0.18)) / 0.18)  # sortie de scène
    sx = sy = 0.0
    if sc["visual"] == "hook" and ts < 0.45:
        amp = 18 * (1 - ts / 0.45)
        sx, sy = amp * math.sin(ts * 90), amp * math.cos(ts * 77)
    if abs(z - 1) > 1e-3 or sx or sy:
        L = L.transform((W, H), Image.AFFINE,
                        (1 / z, 0, W / 2 - W / 2 / z - sx, 0, 1 / z, H / 2 - H / 2 / z - sy), Image.BILINEAR)
    frame.alpha_composite(L)
    # sous-titres
    if sc.get("subtitles", True) and sc["visual"] != "hook":
        for ln in sc["lines"]:
            if ln["start"] - 0.05 <= t < ln["hold"]:
                p = (t - ln["start"] + 0.05) / 0.16
                paste(frame, subtitle_img(ln["text"]), W / 2, 1395, lerp(0.8, 1.0, ease_out_back(p)), clamp(p * 1.5))
    # logo + barre de progression
    paste(frame, logo(1.0), 70 + logo(1.0).width / 2 - 20, 175)
    d = ImageDraw.Draw(frame)
    d.rectangle((0, 0, W, 8), fill=(30, 40, 45))
    d.rectangle((0, 0, int(W * t / total), 8), fill=NEON)
    # transitions : flash + balayage néon diagonal
    for s in scenes:
        dt = t - s["start"]
        if s is scenes[0] and dt < 0.12:
            fl = Image.new("RGBA", (W, H), (255, 255, 255, int(255 * (1 - dt / 0.12))))
            frame.alpha_composite(fl)
        if s is not scenes[0] and -0.14 <= dt <= 0.14:
            p = (dt + 0.14) / 0.28
            x = lerp(-700, W + 700, p)
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            od.polygon([(x - 260, 0), (x + 120, 0), (x - 300, H), (x - 680, H)], fill=BG + (255,))
            od.polygon([(x + 120, 0), (x + 180, 0), (x - 240, H), (x - 300, H)], fill=NEON + (255,))
            frame.alpha_composite(ov)
    if t > total - 0.4:
        frame.alpha_composite(Image.new("RGBA", (W, H), BG + (int(255 * clamp((t - total + 0.4) / 0.4)),)))
    return frame.convert("RGB").tobytes()


def init_worker(scenes, total):
    STATE["scenes"], STATE["total"] = scenes, total
    STATE["bg"] = build_background()


# --------------------------------------------------------------------------
# Exports annexes
# --------------------------------------------------------------------------

def srt_time(t):
    ms = int(round(t * 1000))
    return "%02d:%02d:%02d,%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)


def write_srt(scenes, path):
    i, out = 1, []
    for sc in scenes:
        for ln in sc["lines"]:
            out.append("%d\n%s --> %s\n%s\n" % (i, srt_time(ln["start"]), srt_time(ln["hold"]), strip_marks(ln["text"])))
            i += 1
    open(path, "w", encoding="utf-8").write("\n".join(out))


def write_publish(project, path):
    p = project["publish"]
    txt = "TITRE\n%s\n\nDESCRIPTION\n%s\n\nHASHTAGS\n%s\n\nLÉGENDE PRÊTE À COLLER\n%s %s\n" % (
        p["title"], p["description"], " ".join(p["hashtags"]), p["description"], " ".join(p["hashtags"]))
    open(path, "w", encoding="utf-8").write(txt)


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--engine", choices=["auto", "edge", "espeak"], default="auto")
    ap.add_argument("--out", default=os.path.join(ROOT, "output"))
    ap.add_argument("--preview", action="store_true", help="exporte seulement des images PNG clés")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("FFmpeg est introuvable. Installez-le : apt install ffmpeg / pkg install ffmpeg (Termux) / brew install ffmpeg")
    project = json.load(open(a.project, encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    name = project["id"]
    tmp = tempfile.mkdtemp(prefix="ff_")

    print("1/5 Voix off…")
    tts = make_tts(a.engine, project["voice"], tmp)
    print("  moteur : %s" % tts.name)
    scenes, total, clips = build_timeline(project, tts, tmp)
    print("  durée totale : %.2fs" % total)

    if a.preview:
        init_worker(scenes, total)
        for sc in scenes:
            for frac in (0.3, 0.85):
                t = sc["start"] + sc["dur"] * frac
                fi = int(t * FPS)
                Image.frombytes("RGB", (W, H), render_frame(fi)).save(os.path.join(a.out, "preview_%s_%02d.png" % (sc["id"], int(frac * 100))))
        print("Aperçus PNG écrits dans", a.out)
        return

    print("2/5 Musique + effets sonores (synthétisés)…")
    wav = os.path.join(tmp, "mix.wav")
    mix_audio(scenes, total, clips, project["music"]["volume_db"], wav)

    print("3/5 Sous-titres + textes de publication…")
    write_srt(scenes, os.path.join(a.out, name + ".srt"))
    write_publish(project, os.path.join(a.out, name + "_publication.txt"))
    logo(3.0).save(os.path.join(a.out, "logo_football_facts.png"))

    print("4/5 Rendu des images (%d workers)…" % a.workers)
    n = int(total * FPS)
    mp4 = os.path.join(a.out, name + ".mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
                            "-r", str(FPS), "-i", "-", "-i", wav, "-map", "0:v", "-map", "1:a",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                            "-profile:v", "high", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                            "-shortest", mp4], stdin=subprocess.PIPE)
    with Pool(a.workers, initializer=init_worker, initargs=(scenes, total)) as pool:
        for i, fr in enumerate(pool.imap(render_frame, range(n), chunksize=4)):
            enc.stdin.write(fr)
            if i % 150 == 0:
                print("  image %d/%d" % (i, n), flush=True)
    enc.stdin.close()
    if enc.wait() != 0:
        sys.exit("L'encodage FFmpeg a échoué")
    print("5/5 Terminé →", mp4)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
