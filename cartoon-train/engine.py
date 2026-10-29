# -*- coding: utf-8 -*-
"""Moteur générique pour les sketchs de sketches.py (décors, personnages, caméra, son).

Usage :
    python3 engine.py                      # rend les 10 sketchs
    python3 engine.py 03 07                # rend seulement les sketchs dont le slug commence par 03 / 07
    python3 engine.py 03 --frames 2,30     # images fixes de contrôle
"""
import argparse
import io
import math
import os
import random
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np

import tts
import overlays
from render import (INK, LW, W, H, f, ease, lerp, circle, ellipse, rect, line, path, head, arm, legs, eye_lid,
                    torso, arm_pose, text_el, wrap, rrect_d)
from sketches import SKETCHES
from render import EXPR

FPS = 60  # animation plus fluide

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos")
MAX_DUR = 69.5
tts.SR = 44100  # voix « medium » récentes, dont une à 44,1 kHz

# Voix Piper « medium » récentes (miroir GitHub de sherpa-onnx) : (modèle, locuteur)
VOICE_REL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/"
VOICES2 = {
    "tom": ("fr_FR-tom-medium", None),       # homme
    "pierre": ("fr_FR-upmc-medium", 1),      # homme
    "siwis": ("fr_FR-siwis-medium", None),   # femme
    "jessica": ("fr_FR-upmc-medium", 0),     # femme
}


# Voix Kokoro (plus naturelles) : mélanges de styles. « homme1 » = la voix F choisie.
KOKORO_DIR = os.path.join(tts.BUILD, "kokoro")
KOKORO_REL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
KOKORO_MIX = {
    "homme1": [("ff_siwis", 0.35), ("bm_lewis", 0.65)],
    "homme2": [("ff_siwis", 0.35), ("bm_lewis", 0.40), ("am_onyx", 0.25)],
    "femme1": [("ff_siwis", 1.0)],
    "femme2": [("ff_siwis", 0.75), ("af_bella", 0.25)],
}
# correspondance avec les noms de voix utilisés dans sketches*.py
KOKORO_OF = {"tom": "homme1", "pierre": "homme2", "siwis": "femme1", "jessica": "femme2"}
_KOKORO = {}


def kokoro():
    if "k" not in _KOKORO:
        from kokoro_onnx import Kokoro
        import urllib.request
        os.makedirs(KOKORO_DIR, exist_ok=True)
        for fn in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
            if not os.path.exists(os.path.join(KOKORO_DIR, fn)):
                urllib.request.urlretrieve(KOKORO_REL + fn, os.path.join(KOKORO_DIR, fn))
        _KOKORO["k"] = Kokoro(os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
    return _KOKORO["k"]


def kokoro_wav(text, mix, speed, path):
    k = kokoro()
    style = sum(w * k.get_voice_style(v) for v, w in KOKORO_MIX[mix])
    samples, sr = k.create(text, voice=style, speed=speed, lang="fr-fr")
    with wave.open(path, "wb") as w_:
        w_.setnchannels(1)
        w_.setsampwidth(2)
        w_.setframerate(sr)
        w_.writeframes((np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes())


def voice_model(name):
    d = os.path.join(tts.BUILD, "voices2", "vits-piper-" + name)
    onnx = os.path.join(d, name + ".onnx")
    if not os.path.exists(onnx):
        import tarfile
        import urllib.request
        os.makedirs(os.path.dirname(d), exist_ok=True)
        tb = d + ".tar.bz2"
        urllib.request.urlretrieve(VOICE_REL + "vits-piper-" + name + ".tar.bz2", tb)
        with tarfile.open(tb) as t_:
            t_.extractall(os.path.dirname(d), filter="data")
        os.remove(tb)
    return onnx


def room(x, sr, wet=0.08):
    """Très légère réverbération de pièce pour que la voix « sonne » moins sèche."""
    n = int(0.18 * sr)
    rng = np.random.default_rng(11)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.045 * sr))
    ir[: int(0.012 * sr)] = 0
    ir /= np.abs(ir).sum() + 1e-9
    tail = np.convolve(x, ir)[: len(x)] * 6
    return (x + wet * tail).astype(np.float32)

MOODS = {"n": "neutral", "s": "smile", "m": "smug", "a": "annoyed", "g": "angry", "k": "shocked", "d": "sad"}
SUB_COL = {"E": "#ffb36b", "V": "#ffe27a", "K": "#d7b8ff", "A": "#9fd3ff"}

# ============================================================== personnages


def darker(c, k=0.82):
    c = c.lstrip("#")
    r, g, b = (int(c[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % (int(r * k), int(g * k), int(b * k))


def lighter(c, k=1.12):
    c = c.lstrip("#")
    r, g, b = (int(c[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % tuple(min(255, int(v * k + 8)) for v in (r, g, b))


def lin_grad(col):
    """Dégradé horizontal (lumière à gauche, ombre à droite) pour les vêtements."""
    gid = "lg" + col.lstrip("#")
    d = ('<defs><linearGradient id="%s" x1="0" y1="0" x2="1" y2="0.25">'
         '<stop offset="0" stop-color="%s"/><stop offset="0.55" stop-color="%s"/>'
         '<stop offset="1" stop-color="%s"/></linearGradient></defs>') % (gid, lighter(col, 1.1), col, darker(col, 0.74))
    return "url(#%s)" % gid, d


def rad_grad(col):
    """Dégradé radial (volume) pour la peau et les cheveux."""
    gid = "rg" + col.lstrip("#")
    d = ('<defs><radialGradient id="%s" cx="0.38" cy="0.32" r="0.78">'
         '<stop offset="0" stop-color="%s"/><stop offset="0.6" stop-color="%s"/>'
         '<stop offset="1" stop-color="%s"/></radialGradient></defs>') % (gid, lighter(col, 1.07), col, darker(col, 0.86))
    return "url(#%s)" % gid, d


def head2(x, hy, R, skin, expr, mouth, blink, look, back="", front="", after="", mustache=None, beard=None,
          glasses=False, blush=0.25, mouth_color="#5a1a1a", tilt=0.0):
    """Tête plus détaillée : volume, reflets dans les yeux, nez, oreilles, bouche continue (0..1)."""
    bl, br, curve, lids = EXPR[expr]
    fill, defs = rad_grad(skin)
    s = [defs, '<g transform="rotate(%.2f %s %s)">' % (tilt, f(x), f(hy + R * 0.9)), back]
    for sx in (-1, 1):
        ex_ = x + sx * R * 0.96
        s.append(circle(ex_, hy + R * 0.14, R * 0.2, skin))
        s.append(path("M %s %s q %s %s 0 %s" % (f(ex_ - sx * R * 0.04), f(hy + R * 0.04), f(sx * R * 0.12),
                                               f(R * 0.1), f(R * 0.2)), stroke=darker(skin, 0.7), sw=4))
    s.append(circle(x, hy, R, fill))
    # léger ombrage du menton
    s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.7), f(hy + R * 0.72), f(x), f(hy + R * 1.08),
                                            f(x + R * 0.7), f(hy + R * 0.72)), stroke=darker(skin, 0.8), sw=6,
                  extra='opacity="0.35"'))
    s.append(front)
    if blush:
        for sx in (-1, 1):
            s.append(ellipse(x + sx * R * 0.56, hy + R * 0.4, R * 0.15, R * 0.08, "#f28b8b", stroke="none",
                             sw=0, extra='opacity="%.2f"' % blush))
    if beard:
        s.append(path("M %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.86), f(hy + R * 0.22), f(x - R * 0.62), f(hy + R * 1.12), f(x), f(hy + R * 1.1),
            f(x + R * 0.62), f(hy + R * 1.12), f(x + R * 0.86), f(hy + R * 0.22),
            f(x), f(hy + R * 0.86), f(x - R * 0.86), f(hy + R * 0.22)), fill=beard, sw=5))
    re = R * 0.3
    ey = hy - R * 0.04
    pr = re * (0.2 if expr == "shocked" else 0.3)
    lid_amt = max(lids, blink)
    for sx, brow in ((-1, bl), (1, br)):
        ex_ = x + sx * R * 0.31
        s.append(circle(ex_, ey, re, "#ffffff", sw=6))
        px = ex_ + look[0] * re * 0.5
        py = ey + look[1] * re * 0.42
        s.append(circle(px, py, pr * 1.25, "#4a3426", stroke="none", sw=0))
        s.append(circle(px, py, pr * 0.8, INK, stroke="none", sw=0))
        s.append(circle(px - pr * 0.45, py - pr * 0.5, pr * 0.38, "#ffffff", stroke="none", sw=0))
        s.append(eye_lid(ex_, ey, re, lid_amt, skin))
        by = ey - re - R * 0.13
        inner, outer = brow
        ix, iy = ex_ - sx * re * 0.55, by + inner * R
        ox, oy = ex_ + sx * re * 0.9, by + outer * R
        s.append(path("M %s %s Q %s %s %s %s" % (f(ix), f(iy), f((ix + ox) / 2), f((iy + oy) / 2 - R * 0.05),
                                                f(ox), f(oy)), sw=R * 0.08))
        if glasses:
            s.append(circle(ex_, ey, re * 1.12, "none", sw=5))
    if glasses:
        s.append(line(x - R * 0.31 + re * 1.12, ey, x + R * 0.31 - re * 1.12, ey, sw=5))
    # nez
    s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.02), f(hy + R * 0.2), f(x + R * 0.1), f(hy + R * 0.33),
                                            f(x - R * 0.04), f(hy + R * 0.34)), stroke=darker(skin, 0.62), sw=5))
    my = hy + R * 0.58
    m = max(0.0, min(1.0, mouth))
    if m < 0.06:
        if expr == "shocked":
            s.append(ellipse(x, my, R * 0.07, R * 0.08, mouth_color, sw=5))
        else:
            c = curve * R
            skew = R * 0.05 if expr == "smug" else 0
            s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.17), f(my - c * 0.3 + skew), f(x), f(my + c),
                                                     f(x + R * 0.17), f(my - c * 0.3 - skew)), sw=6))
    else:
        rx = R * (0.11 + 0.06 * m)
        ry = R * (0.035 + 0.13 * m)
        top = my - ry * (0.6 if curve > 0.05 else 1.0)
        s.append(path("M %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(x - rx), f(my - ry * 0.1 - curve * R * 0.3), f(x), f(top - ry * 0.25), f(x + rx),
            f(my - ry * 0.1 - curve * R * 0.3), f(x), f(my + ry * 1.25), f(x - rx), f(my - ry * 0.1 - curve * R * 0.3)),
            fill=mouth_color, sw=5))
        if m > 0.45:
            s.append(ellipse(x, my + ry * 0.62, rx * 0.5, ry * 0.3, "#e0607a", stroke="none", sw=0))
        if m > 0.25:
            s.append(rect(x - rx * 0.55, top + ry * 0.05, rx * 1.1, ry * 0.28, "#ffffff", rx=3, stroke="none", sw=0))
    if mustache:
        mx, myy = x, hy + R * 0.42
        s.append(path("M %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(mx - R * 0.34), f(myy + R * 0.1), f(mx - R * 0.2), f(myy - R * 0.14), f(mx), f(myy - R * 0.02),
            f(mx + R * 0.2), f(myy - R * 0.14), f(mx + R * 0.34), f(myy + R * 0.1),
            f(mx), f(myy + R * 0.02), f(mx - R * 0.34), f(myy + R * 0.1)), fill=mustache, sw=5))
    s.append(after)
    s.append("</g>")
    return "".join(s)


def hair_parts(style, col, x, hy, R):
    """Renvoie (arrière, avant) pour une coiffure."""
    back, front = "", ""
    cap = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.99), f(hy - R * 0.1), f(R), f(R), f(x + R * 0.99), f(hy - R * 0.1),
        f(x + R * 0.72), f(hy - R * 0.6), f(x), f(hy - R * 0.64),
        f(x - R * 0.72), f(hy - R * 0.6), f(x - R * 0.99), f(hy - R * 0.1)), fill=col, sw=6)
    if style == "bald":
        front = "".join(path("M %s %s Q %s %s %s %s Q %s %s %s %s" % (
            f(x + sd * R * 0.62), f(hy - R * 0.7), f(x + sd * R * 1.12), f(hy - R * 0.55), f(x + sd * R * 0.98),
            f(hy + R * 0.05), f(x + sd * R * 0.82), f(hy - R * 0.25), f(x + sd * R * 0.62), f(hy - R * 0.7)),
            fill=col, sw=5) for sd in (-1, 1))
    elif style == "afro_puff":
        pts = ((-0.35, 0.05, 0.42), (0.35, 0.05, 0.42), (0, -0.25, 0.5), (-0.55, 0.45, 0.32), (0.55, 0.45, 0.32))
        back = "".join(circle(x + dx * R, hy - R * 0.85 + dy * R, r * R, col, sw=6) for dx, dy, r in pts)
        back += "".join(circle(x + dx * R, hy - R * 0.85 + dy * R, r * R, col, stroke="none", sw=0)
                        for dx, dy, r in pts[:3])
        front = cap
    elif style == "pigtails":
        back = "".join(circle(x + sd * R * 1.15, hy - R * 0.35, R * 0.38, col, sw=6) for sd in (-1, 1))
        front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.99), f(hy - R * 0.05), f(R), f(R), f(x + R * 0.99), f(hy - R * 0.05),
            f(x + R * 0.8), f(hy - R * 0.5), f(x + R * 0.3), f(hy - R * 0.52), f(x), f(hy - R * 0.72),
            f(x - R * 0.3), f(hy - R * 0.52), f(x - R * 0.8), f(hy - R * 0.5), f(x - R * 0.99), f(hy - R * 0.05)),
            fill=col, sw=6)
    elif style == "long":
        back = path("M %s %s Q %s %s %s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z" % (
            f(x - R * 1.1), f(hy + R * 1.35), f(x - R * 1.3), f(hy - R * 1.2), f(x), f(hy - R * 1.12),
            f(x + R * 1.3), f(hy - R * 1.2), f(x + R * 1.1), f(hy + R * 1.35),
            f(x + R * 0.6), f(hy + R * 1.45), f(x), f(hy + R * 1.3), f(x - R * 1.1), f(hy + R * 1.35)),
            fill=col, sw=6)
        front = cap
    elif style == "bob":
        back = path("M %s %s Q %s %s %s %s Q %s %s %s %s L %s %s Z" % (
            f(x - R * 1.15), f(hy + R * 0.75), f(x - R * 1.3), f(hy - R * 1.2), f(x), f(hy - R * 1.12),
            f(x + R * 1.3), f(hy - R * 1.2), f(x + R * 1.15), f(hy + R * 0.75), f(x - R * 1.15), f(hy + R * 0.75)),
            fill=col, sw=6)
        front = path("M %s %s A %s %s 0 0 1 %s %s L %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.99), f(hy - R * 0.1), f(R), f(R), f(x + R * 0.99), f(hy - R * 0.1),
            f(x + R * 0.85), f(hy - R * 0.42), f(x), f(hy - R * 0.3), f(x - R * 0.99), f(hy - R * 0.1)),
            fill=col, sw=6)
    elif style == "bun":
        back = circle(x, hy - R * 1.12, R * 0.42, col, sw=6)
        front = cap
    elif style == "ponytail":
        back = path("M %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(x + R * 0.6), f(hy - R * 0.75), f(x + R * 1.7), f(hy - R * 0.4), f(x + R * 1.25), f(hy + R * 0.9),
            f(x + R * 1.05), f(hy - R * 0.1), f(x + R * 0.6), f(hy - R * 0.75)), fill=col, sw=6)
        front = cap
    elif style == "curly":
        pts = [(-0.85, -0.35), (-0.6, -0.75), (-0.2, -0.95), (0.2, -0.95), (0.6, -0.75), (0.85, -0.35)]
        back = "".join(circle(x + dx * R, hy + dy * R, R * 0.32, col, sw=6) for dx, dy in pts)
        front = cap + "".join(circle(x + dx * R * 0.8, hy + dy * R * 0.75, R * 0.2, col, stroke="none", sw=0)
                              for dx, dy in pts[1:-1])
    elif style == "spiky":
        d = "M %s %s " % (f(x - R * 0.98), f(hy - R * 0.1))
        for k in range(7):
            a0 = math.pi * (1.0 - (k + 0.5) / 7)
            a1 = math.pi * (1.0 - (k + 1) / 7)
            d += "L %s %s L %s %s " % (f(x + math.cos(a0) * R * 1.32), f(hy - R * 0.15 - math.sin(a0) * R * 1.25),
                                       f(x + math.cos(a1) * R * 0.98), f(hy - R * 0.1 - math.sin(a1) * R * 0.98))
        d += "Q %s %s %s %s Z" % (f(x), f(hy - R * 0.5), f(x - R * 0.98), f(hy - R * 0.1))
        front = path(d, fill=col, sw=6)
    elif style == "buzz":
        front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.97), f(hy - R * 0.25), f(R), f(R), f(x + R * 0.97), f(hy - R * 0.25),
            f(x), f(hy - R * 0.75), f(x - R * 0.97), f(hy - R * 0.25)), fill=col, sw=5)
    elif style == "sidepart":
        front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.99), f(hy - R * 0.1), f(R * 1.02), f(R * 1.02), f(x + R * 0.99), f(hy - R * 0.1),
            f(x + R * 0.8), f(hy - R * 0.62), f(x - R * 0.25), f(hy - R * 0.55),
            f(x - R * 0.85), f(hy - R * 0.45), f(x - R * 0.99), f(hy - R * 0.1)), fill=col, sw=6)
    else:  # short
        front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.98), f(hy - R * 0.2), f(R * 1.03), f(R * 1.03), f(x + R * 0.98), f(hy - R * 0.2),
            f(x), f(hy - R * 0.62), f(x - R * 0.98), f(hy - R * 0.2)), fill=col, sw=6)
    return back, front


def hat_parts(hat, x, hy, R):
    kind, col = hat
    if kind == "cap":
        return (path("M %s %s A %s %s 0 0 1 %s %s Z" % (f(x - R * 0.98), f(hy - R * 0.45), f(R), f(R * 0.95),
                                                      f(x + R * 0.98), f(hy - R * 0.45)), fill=col, sw=6) +
                path("M %s %s Q %s %s %s %s L %s %s Z" % (f(x - R * 0.9), f(hy - R * 0.5), f(x - R * 1.7),
                                                         f(hy - R * 0.55), f(x - R * 1.6), f(hy - R * 0.38),
                                                         f(x - R * 0.85), f(hy - R * 0.4)), fill=darker(col), sw=6) +
                circle(x, hy - R * 1.38, R * 0.08, darker(col), sw=4))
    if kind == "sunhat":
        return (ellipse(x, hy - R * 0.6, R * 1.75, R * 0.32, col, sw=6) +
                path("M %s %s Q %s %s %s %s Z" % (f(x - R * 0.85), f(hy - R * 0.62), f(x), f(hy - R * 1.75),
                                                 f(x + R * 0.85), f(hy - R * 0.62)), fill=col, sw=6) +
                path("M %s %s Q %s %s %s %s" % (f(x - R * 0.82), f(hy - R * 0.8), f(x), f(hy - R * 0.95),
                                               f(x + R * 0.82), f(hy - R * 0.8)), stroke="#e76f51", sw=14))
    if kind == "paper":
        return (path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.9), f(hy - R * 0.55), f(x - R * 0.7),
                                                          f(hy - R * 1.3), f(x + R * 0.7), f(hy - R * 1.3),
                                                          f(x + R * 0.9), f(hy - R * 0.55)), fill=col, sw=6) +
                line(x - R * 0.85, hy - R * 0.75, x + R * 0.85, hy - R * 0.75, sw=10, stroke="#ff8fab"))
    if kind == "headphones":
        return (path("M %s %s A %s %s 0 0 1 %s %s" % (f(x - R * 1.02), f(hy), f(R * 1.05), f(R * 1.12),
                                                     f(x + R * 1.02), f(hy)), stroke=INK, sw=24) +
                path("M %s %s A %s %s 0 0 1 %s %s" % (f(x - R * 1.02), f(hy), f(R * 1.05), f(R * 1.12),
                                                     f(x + R * 1.02), f(hy)), stroke=col, sw=12) +
                "".join(rect(x + sd * R * 1.02 - R * 0.2, hy - R * 0.25, R * 0.4, R * 0.62, col, rx=R * 0.18)
                        for sd in (-1, 1)))
    return ""


def held_prop(kind, x, y, R):
    if kind == "notepad":
        return rect(x - R * 0.28, y - R * 0.4, R * 0.56, R * 0.66, "#fffbe6", rx=6, sw=5) + "".join(
            line(x - R * 0.18, y - R * 0.22 + k * R * 0.14, x + R * 0.18, y - R * 0.22 + k * R * 0.14, sw=3,
                 stroke="#7a8a99") for k in range(4))
    if kind == "clipboard":
        return (rect(x - R * 0.33, y - R * 0.45, R * 0.66, R * 0.82, "#b07d4f", rx=6, sw=5) +
                rect(x - R * 0.26, y - R * 0.35, R * 0.52, R * 0.65, "#ffffff", rx=3, sw=3) +
                rect(x - R * 0.12, y - R * 0.5, R * 0.24, R * 0.12, "#9aa4ab", rx=3, sw=3))
    if kind == "flashlight":
        return (rect(x - R * 0.1, y - R * 0.45, R * 0.2, R * 0.7, "#3c4046", rx=6, sw=5) +
                ellipse(x, y - R * 0.47, R * 0.16, R * 0.08, "#fff3b0", sw=4))
    if kind == "tray":
        return (ellipse(x, y - R * 0.05, R * 0.6, R * 0.12, "#c0c6cc", sw=5) +
                rect(x - R * 0.35, y - R * 0.38, R * 0.18, R * 0.3, "#ffffff", rx=4, sw=4) +
                rect(x + R * 0.1, y - R * 0.42, R * 0.2, R * 0.36, "#e85d75", rx=4, sw=4))
    if kind == "scoop":
        return (line(x, y, x + R * 0.1, y - R * 0.55, sw=10, stroke="#9aa4ab") +
                circle(x + R * 0.12, y - R * 0.62, R * 0.15, "#ff8fab", sw=4))
    return ""


def top_layer(spec, x, sy, hip, R):
    """Buste + détails selon le style de haut."""
    style = spec.get("top", ("tshirt", "#888888"))
    kind, col = style[0], style[1]
    col2 = style[2] if len(style) > 2 else darker(col)
    child = spec.get("child")
    s = []
    gfill, gdefs = lin_grad(col)
    s.append(gdefs)
    if kind == "dress":
        s.append(path("M %s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z" % (
            f(x - R * 0.7), f(sy + R * 0.1), f(x), f(sy - R * 0.15), f(x + R * 0.7), f(sy + R * 0.1),
            f(x + R * 1.25), f(hip + R * 0.25), f(x), f(hip + R * 0.45), f(x - R * 1.25), f(hip + R * 0.25)),
            fill=gfill))
        s.append(path("M %s %s Q %s %s %s %s" % (f(x - R), f(hip), f(x), f(hip + R * 0.2), f(x + R), f(hip)),
                      stroke="#ffffff", sw=8))
        return "".join(s)
    wtop = 0.7 if child else 0.95
    s.append(torso(x, sy, hip, R, gfill, wtop=wtop, wbot=wtop + 0.05))
    # pli de vêtement
    s.append(path("M %s %s q %s %s %s %s" % (f(x + R * 0.45), f(hip - R * 0.9), f(R * 0.1), f(R * 0.35), f(R * 0.05),
                                            f(R * 0.7)), stroke=darker(col, 0.65), sw=4, extra='opacity="0.6"'))
    if kind == "polo":
        s.append(path("M %s %s L %s %s L %s %s Z M %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.45), f(sy - R * 0.04), f(x), f(sy + R * 0.4), f(x - R * 0.05), f(sy - R * 0.04),
            f(x + R * 0.45), f(sy - R * 0.04), f(x), f(sy + R * 0.4), f(x + R * 0.05), f(sy - R * 0.04)),
            fill="#ffffff", sw=5))
        for k in range(3):
            s.append(circle(x, sy + R * (0.55 + k * 0.28), 5, INK, stroke="none", sw=0))
    elif kind == "hoodie":
        s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.55), f(hip - R * 0.2), f(x - R * 0.4), f(hip - R * 0.75), f(x + R * 0.4),
            f(hip - R * 0.75), f(x + R * 0.55), f(hip - R * 0.2)), fill=col2, sw=5))
        s.append(line(x - R * 0.18, sy + R * 0.05, x - R * 0.22, sy + R * 0.7, sw=5))
        s.append(line(x + R * 0.18, sy + R * 0.05, x + R * 0.22, sy + R * 0.7, sw=5))
    elif kind in ("tshirt", "tank"):
        dep = 0.35 if kind == "tank" else 0.18
        s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.35), f(sy - R * 0.03), f(x), f(sy + R * dep * 1.6),
                                                f(x + R * 0.35), f(sy - R * 0.03)), fill=spec["skin"], sw=5))
    elif kind == "uniform":
        s.append(path("M %s %s L %s %s L %s %s Z" % (f(x - R * 0.32), f(sy - R * 0.04), f(x), f(sy + R * 0.55),
                                                   f(x + R * 0.32), f(sy - R * 0.04)), fill="#ffffff", sw=5))
        s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.07), f(sy + R * 0.08), f(x + R * 0.07), f(sy + R * 0.08), f(x + R * 0.1), f(sy + R * 0.5),
            f(x - R * 0.1), f(sy + R * 0.5)), fill=col2, sw=4))
        for k in range(3):
            s.append(circle(x + R * 0.18, sy + R * (0.8 + k * 0.42), 7, "#f2c23a", sw=3))
    elif kind == "vest":
        s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.3), f(sy - R * 0.04), f(x), f(sy + R * 1.2),
                                                           f(x + R * 0.3), f(sy - R * 0.04), f(x), f(sy)),
                      fill=col2, sw=5))
        s.append(path("M %s %s L %s %s L %s %s Z M %s %s L %s %s L %s %s Z" % (
            f(x), f(sy + R * 0.12), f(x - R * 0.22), f(sy), f(x - R * 0.22), f(sy + R * 0.24),
            f(x), f(sy + R * 0.12), f(x + R * 0.22), f(sy), f(x + R * 0.22), f(sy + R * 0.24)), fill="#c1121f", sw=4))
        for k in range(3):
            s.append(circle(x + R * 0.08, sy + R * (1.35 + k * 0.35), 5, INK, stroke="none", sw=0))
    elif kind == "blazer":
        s.append(path("M %s %s L %s %s L %s %s Z" % (f(x - R * 0.35), f(sy - R * 0.04), f(x), f(sy + R * 1.0),
                                                   f(x + R * 0.35), f(sy - R * 0.04)), fill=col2, sw=5))
        s.append(path("M %s %s L %s %s L %s %s" % (f(x - R * 0.35), f(sy - R * 0.04), f(x - R * 0.12),
                                                  f(sy + R * 0.55), f(x), f(sy + R * 1.0)), sw=5))
        s.append(path("M %s %s L %s %s L %s %s" % (f(x + R * 0.35), f(sy - R * 0.04), f(x + R * 0.12),
                                                  f(sy + R * 0.55), f(x), f(sy + R * 1.0)), sw=5))
        s.append(circle(x - R * 0.1, sy + R * 1.35, 6, INK, stroke="none", sw=0))
    elif kind == "cardigan":
        s.append(rect(x - R * 0.22, sy - R * 0.02, R * 0.44, hip - sy - R * 0.05, col2, rx=4, sw=5))
        for k in range(4):
            s.append(circle(x + R * 0.3, sy + R * (0.4 + k * 0.45), 5, INK, stroke="none", sw=0))
    elif kind == "apron":
        s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.35), f(sy - R * 0.03), f(x), f(sy + R * 0.3),
                                                f(x + R * 0.35), f(sy - R * 0.03)), fill=spec["skin"], sw=5))
        s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.45), f(sy + R * 0.35), f(x + R * 0.45), f(sy + R * 0.35), f(x + R * 0.6), f(hip + R * 0.9),
            f(x - R * 0.6), f(hip + R * 0.9)), fill=col2, sw=5))
        s.append(rect(x - R * 0.25, hip - R * 0.2, R * 0.5, R * 0.35, darker(col2), rx=5, sw=4))
    if spec.get("nametag"):
        s.append(rect(x - R * 0.72, sy + R * 0.5, R * 0.36, R * 0.2, "#ffffff", rx=4, sw=4))
    if spec.get("whistle"):
        s.append(path("M %s %s L %s %s L %s %s" % (f(x - R * 0.3), f(sy), f(x), f(sy + R * 0.85), f(x + R * 0.3),
                                                  f(sy)), stroke="#1b1b1b", sw=4))
        s.append(rect(x - R * 0.12, sy + R * 0.8, R * 0.26, R * 0.16, "#c0c6cc", rx=6, sw=4))
    return "".join(s)


def sleeve_of(spec):
    kind, col = spec.get("top", ("tshirt", "#888"))[:2]
    if kind in ("tank", "dress"):
        return None, 0.45
    if kind in ("hoodie", "uniform", "blazer", "cardigan"):
        return col, 1.0
    if kind == "vest":
        return "#ffffff", 1.0
    if kind == "apron":
        return col, 0.45
    return col, 0.45


def lower_layer(spec, x, hip, foot, R, walk):
    kind, col = spec.get("bottom", ("pants", "#3b5ba5"))
    shoes = spec.get("shoes", "#1b1b1b")
    skin = spec["skin"]
    top_kind = spec.get("top", ("tshirt",))[0]
    if top_kind == "dress":
        return legs(x, hip, foot, R, skin, shoes, walk)
    if kind == "shorts":
        s = legs(x, hip, foot, R, col, shoes, walk, bare_below=hip + R * 0.95)
        return s + path("M %s %s L %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.95), f(hip - 10), f(x + R * 0.95), f(hip - 10), f(x + R), f(hip + R * 0.9),
            f(x - R), f(hip + R * 0.9)), fill=col) + line(x, hip + R * 0.1, x, hip + R * 0.85, sw=5)
    if kind == "skirt":
        s = legs(x, hip, foot, R, skin, shoes, walk)
        return s + path("M %s %s L %s %s L %s %s L %s %s Z" % (
            f(x - R * 0.95), f(hip - 10), f(x + R * 0.95), f(hip - 10), f(x + R * 1.2), f(hip + R * 1.1),
            f(x - R * 1.2), f(hip + R * 1.1)), fill=col)
    return legs(x, hip, foot, R, col, shoes, walk)


def seated_legs(spec, x, R, hip=1262, floor=1480):
    kind, col = spec.get("bottom", ("pants", "#3b5ba5"))
    shoes = spec.get("shoes", "#f4f4f4")
    skin = spec["skin"]
    s = []
    bare = kind in ("shorts", "skirt") or spec.get("top", ("",))[0] == "dress"
    for side in (-1, 1):
        lx = x + side * R * 0.4
        if bare:
            s.append(line(lx, hip + 50, lx, floor, sw=R * 0.12))
        else:
            s.append(line(lx, hip + 38, lx, floor, sw=R * 0.36))
            s.append(line(lx, hip + 38, lx, floor, sw=R * 0.36 - 2 * LW, stroke=col))
        s.append(ellipse(lx + side * R * 0.08, floor + 10, R * 0.3, R * 0.14, shoes))
    s.append(rect(x - R * 1.05, hip - 7, R * 2.1, 70, col if kind != "skirt" else col, rx=26))
    return "".join(s)


def lap_prop(kind, x, y, R, t):
    """Objet tenu sur les genoux / dans les mains (personne assise)."""
    if kind == "phone":
        return (rect(x - R * 0.22, y - R * 0.42, R * 0.44, R * 0.5, "#2b2f36", rx=10, sw=5) +
                rect(x - R * 0.16, y - R * 0.36, R * 0.32, R * 0.38, "#5fb4e6", rx=5, stroke="none", sw=0))
    if kind == "charger":
        return (lap_prop("phone", x, y, R, t) +
                path("M %s %s Q %s %s %s %s" % (f(x), f(y + R * 0.05), f(x + R * 0.2), f(y + R * 0.5),
                                               f(x + R * 0.75), f(y + R * 0.35)), stroke="#ffffff", sw=5) +
                rect(x + R * 0.62, y + R * 0.15, R * 0.42, R * 0.3, "#3c4046", rx=6, sw=5) +
                rect(x + R * 0.68, y + R * 0.22, R * 0.1, R * 0.12, "#9be37a", rx=2, stroke="none", sw=0))
    if kind == "popcorn":
        s = path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.45), f(y - R * 0.55), f(x + R * 0.45),
                                                     f(y - R * 0.55), f(x + R * 0.32), f(y + R * 0.2),
                                                     f(x - R * 0.32), f(y + R * 0.2)), fill="#ffffff")
        for k in (-0.22, 0.08):
            s += path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x + k * R), f(y - R * 0.55), f(x + (k + 0.15) * R),
                                                           f(y - R * 0.55), f(x + (k + 0.11) * R), f(y + R * 0.2),
                                                           f(x + (k - 0.03) * R), f(y + R * 0.2)), fill="#e63946",
                      stroke="none", sw=0)
        s += "".join(circle(x + dx * R, y - R * 0.6 + dy * R, R * 0.13, "#fff3c4", sw=4)
                     for dx, dy in ((-0.3, 0), (-0.1, -0.12), (0.12, -0.05), (0.32, 0.02), (0.02, 0.05)))
        return s
    if kind == "book":
        return (path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.5), f(y - R * 0.45), f(x), f(y - R * 0.38),
                                                          f(x), f(y + R * 0.1), f(x - R * 0.5), f(y + R * 0.02)),
                     fill="#fffbe6", sw=5) +
                path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x + R * 0.5), f(y - R * 0.45), f(x), f(y - R * 0.38),
                                                          f(x), f(y + R * 0.1), f(x + R * 0.5), f(y + R * 0.02)),
                     fill="#fffbe6", sw=5))
    if kind == "magazine":
        return (rect(x - R * 0.45, y - R * 0.5, R * 0.9, R * 0.6, "#f72585", rx=4, sw=5) +
                rect(x - R * 0.35, y - R * 0.42, R * 0.4, R * 0.3, "#ffd166", rx=3, stroke="none", sw=0) +
                line(x + R * 0.1, y - R * 0.35, x + R * 0.35, y - R * 0.35, sw=4, stroke="#ffffff") +
                line(x + R * 0.1, y - R * 0.22, x + R * 0.35, y - R * 0.22, sw=4, stroke="#ffffff"))
    if kind == "cocktail":
        return (path("M %s %s L %s %s L %s %s Z" % (f(x - R * 0.3), f(y - R * 0.5), f(x + R * 0.3), f(y - R * 0.5),
                                                   f(x), f(y - R * 0.1)), fill="#ff9f1c", sw=5) +
                line(x, y - R * 0.1, x, y + R * 0.15, sw=5) +
                line(x - R * 0.15, y + R * 0.15, x + R * 0.15, y + R * 0.15, sw=5) +
                line(x + R * 0.1, y - R * 0.5, x + R * 0.3, y - R * 0.85, sw=4) +
                path("M %s %s Q %s %s %s %s Z" % (f(x + R * 0.1), f(y - R * 0.8), f(x + R * 0.3), f(y - R * 1.05),
                                                 f(x + R * 0.5), f(y - R * 0.8)), fill="#2ec4b6", sw=4))
    return ""


def person(spec, st, t, seated=False, prop=None, hands=None):
    """Dessine un personnage complet (hors jambes s'il est assis)."""
    R = spec.get("R", 80 if spec.get("child") else 108)
    child = spec.get("child")
    x = st["x"]
    walk = st.get("walk")
    hop = st.get("hop", 0)
    if seated:
        hy = 1262 - R * 3.57 + math.sin(t * 1.7) * 2 + hop
        sy, hip, foot = hy + R * 1.02, 1262, None
    else:
        bob = abs(math.sin(walk)) * -12 if walk is not None else math.sin(t * 2.0 + x * 0.01) * 2
        if child:
            foot = 1690 + bob * 0.3
            hy = 1690 - 5 * R + bob + hop
            hip = hy + 3.0 * R
            sy = hy + R
        else:
            foot = 1590 + bob * 0.3
            hy = 1590 - 6.2 * R + bob + hop
            hip = hy + 3.6 * R
            sy = hy + 1.02 * R
    st["_hy"] = hy
    skin = spec["skin"]
    s = []
    hstyle, hcol = spec.get("hair", ("short", "#2b211c"))
    hfill, hdefs = rad_grad(hcol)
    hback, hfront = hair_parts(hstyle, hfill, x, hy, R)
    hback = hdefs + hback
    if not seated:
        s.append(ellipse(x, foot + R * 0.12, R * 1.15, R * 0.17, "#000000", stroke="none", sw=0,
                         extra='opacity="0.13"'))
        s.append(lower_layer(spec, x, hip, foot, R, walk))
    # cou
    s.append(rect(x - R * 0.17, hy + R * 0.75, R * 0.34, sy - hy - R * 0.6, darker(skin, 0.92), rx=6, sw=5))
    s.append(top_layer(spec, x, sy, hip, R))
    sleeve, slen = sleeve_of(spec)
    pose = st.get("pose", "down")
    amt = st.get("pose_amt", 1.0)
    held = spec.get("held")
    base_pose = st.get("base_pose", "machine" if held else "down")
    for side in (-1, 1):
        shp = (x + side * R * (0.65 if child else 0.88), sy + R * 0.25)
        el, ha = arm_target(spec, st, t, pose, side, shp, x, sy, hip, R, seated, hands, child, held)
        if amt < 0.999 and pose != base_pose:
            el0, ha0 = arm_target(spec, st, t, base_pose, side, shp, x, sy, hip, R, seated, hands, child, held)
            el = (lerp(el0[0], el[0], amt), lerp(el0[1], el[1], amt))
            ha = (lerp(ha0[0], ha[0], amt), lerp(ha0[1], ha[1], amt))
        s.append(arm(shp, el, ha, R, skin, sleeve=sleeve, sleeve_len=slen))
        if pose == "point" and side == 1 and not seated and amt > 0.6:
            s.append(line(ha[0], ha[1], ha[0] + R * 0.32 * amt, ha[1] - R * 0.05, sw=R * 0.1))
    if held and pose in ("machine", "gesture") and not seated:
        s.append(held_prop(held, x, sy + R * 1.55, R))
    s.append(person_rest(spec, st, t, seated, prop, hands, x, hy, sy, R, child, hback, hfront))
    return "".join(s)


def arm_target(spec, st, t, pose, side, shp, x, sy, hip, R, seated, hands, child, held):
    if True:
        if seated:
            if pose == "wave" and side == 1:
                el, ha = arm_pose("wave", 1, shp[0], shp[1], R, t, hip)
            elif hands == "table":
                el, ha = (shp[0] + side * R * 0.3, shp[1] + R * 1.2), (x + side * R * 0.45, 1222)
            elif hands == "cone" and side == 1:
                el, ha = (shp[0] + R * 0.35, shp[1] + R * 1.1), (x + R * 0.55, sy + R * 0.55)
            else:
                el, ha = (shp[0] + side * R * 0.22, shp[1] + R * 1.45), (x + side * R * 0.32, sy + R * 1.82)
        elif side == -1 and st.get("hold_left"):
            el, ha = (shp[0] - R * 0.3, shp[1] + R * 1.25), st["hold_left"]
        elif side == 1 and st.get("hold_right"):
            el, ha = (shp[0] + R * 0.45, shp[1] - R * 0.35), st["hold_right"]
        elif side == 1 and st.get("drag"):
            el, ha = (shp[0] + R * 0.6, shp[1] + R * 0.9), (shp[0] + R * 1.15, shp[1] + R * 1.6)
        elif side == 1 and st.get("cart"):
            el, ha = (shp[0] + R * 0.5, shp[1] + R * 1.0), (shp[0] + R * 1.1, shp[1] + R * 1.55)
        elif st.get("stomp"):
            el, ha = (shp[0] + side * R * 0.4, shp[1] + R * 0.8), (shp[0] + side * R * 0.3, shp[1] + R * 1.5)
        elif child:
            el, ha = (shp[0] + side * R * 0.2, shp[1] + R * 0.9), (shp[0] + side * R * 0.2, shp[1] + R * 1.7)
        elif held and pose == "machine":
            el, ha = arm_pose("machine", side, shp[0], shp[1], R, t, hip)
        elif held and pose == "gesture" and side == -1:
            el, ha = arm_pose("machine", side, shp[0], shp[1], R, t, hip)
        else:
            el, ha = arm_pose(pose, side, shp[0], shp[1], R, t, hip)
    return el, ha


def person_rest(spec, st, t, seated, prop, hands, x, hy, sy, R, child, hback, hfront):
    s = []
    pose = st.get("pose", "down")
    skin = spec["skin"]
    if seated and prop and pose != "wave" and hands != "table" and prop != "icecream":
        s.append(lap_prop(prop, x, sy + R * 1.72, R, t))
    if seated and prop == "icecream" and pose != "wave":
        cx, cy = x + R * 0.55, sy + R * 0.45
        s.append(path("M %s %s L %s %s L %s %s Z" % (f(cx - R * 0.17), f(cy - R * 0.1), f(cx + R * 0.17),
                                                   f(cy - R * 0.1), f(cx), f(cy + R * 0.45)), fill="#e9b872", sw=5))
        s.append(circle(cx, cy - R * 0.25, R * 0.2, "#ff8fab", sw=5))
    if st.get("basket"):
        bx, by = x + R * 0.12, sy + R * 2.45
        s.append(path("M %s %s Q %s %s %s %s" % (f(bx - R * 0.35), f(by - R * 0.3), f(bx), f(by - R * 0.95),
                                                f(bx + R * 0.35), f(by - R * 0.3)), stroke="#c1121f", sw=8))
        s.append(line(bx - R * 0.15, by - R * 0.1, bx + R * 0.55, by - R * 1.1, sw=R * 0.24, stroke=INK))
        s.append(line(bx - R * 0.15, by - R * 0.1, bx + R * 0.55, by - R * 1.1, sw=R * 0.24 - 10,
                      stroke="#e9b872"))
        s.append(rect(bx - R * 0.5, by - R * 0.3, R, R * 0.55, "#e63946", rx=8, sw=5))
    after = ""
    if spec.get("earrings"):
        after += "".join(circle(x + sd * R * 0.98, hy + R * 0.42, R * 0.1, "none", stroke=spec["earrings"], sw=5)
                         for sd in (-1, 1))
    if spec.get("freckles"):
        after += "".join(circle(x + sd * R * (0.5 + k * 0.1), hy + R * (0.35 + (k % 2) * 0.08), 3, "#b5651d",
                                stroke="none", sw=0) for sd in (-1, 1) for k in range(3))
    if spec.get("hat"):
        after += hat_parts(spec["hat"], x, hy, R)
    expr = st.get("expr", "neutral")
    mouth = st.get("mouth", 0)
    s.append(head2(x, hy, R, skin, expr, mouth, st.get("blink", 0.0), st.get("look", (0, 0)), back=hback,
                   front=hfront, after=after, mustache=spec.get("mustache"), beard=spec.get("beard"),
                   glasses=spec.get("glasses"), blush=0.6 if child else 0.22,
                   mouth_color="#a4161a" if spec.get("lipstick") else "#5a1a1a", tilt=st.get("tilt", 0.0)))
    return "".join(s)


def after_beard(spec, x, hy, R):
    return path("M %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.85), f(hy + R * 0.25), f(x - R * 0.6), f(hy + R * 1.1), f(x), f(hy + R * 1.08),
        f(x + R * 0.6), f(hy + R * 1.1), f(x + R * 0.85), f(hy + R * 0.25),
        f(x), f(hy + R * 0.85), f(x - R * 0.85), f(hy + R * 0.25)), fill=spec["beard"], sw=5)


def after_beard_mouth(spec, x, hy, R, expr, mouth):
    s = after_beard(spec, x, hy, R)
    my = hy + R * 0.56
    if mouth:
        rx, ry = (R * 0.13, R * 0.08) if mouth == 1 else (R * 0.16, R * 0.15)
        s += ellipse(x, my, rx, ry, "#5a1a1a", sw=5)
    else:
        c = {"smile": 0.12, "smug": 0.07, "angry": -0.1, "sad": -0.1, "annoyed": -0.03}.get(expr, 0) * R
        s += path("M %s %s Q %s %s %s %s" % (f(x - R * 0.17), f(my - c * 0.3), f(x), f(my + c), f(x + R * 0.17),
                                            f(my - c * 0.3)), stroke="#f2e6d8", sw=6)
    return s


# ============================================================== décors

def scroll(base, speed, t, span=2600, start=-700):
    return (base - speed * t) % span + start


def deco_frame(x, y, w, h, inner):
    return rect(x, y, w, h, inner, rx=6, stroke="#7a5233", sw=14) + rect(x - 7, y - 7, w + 14, h + 14, "none", rx=8)


def lamp(x, y_top, y, col="#ffd166"):
    return (line(x, y_top, x, y - 40, sw=4) +
            path("M %s %s Q %s %s %s %s Z" % (f(x - 70), f(y), f(x), f(y - 110), f(x + 70), f(y)), fill=col) +
            ellipse(x, y + 4, 30, 10, "#fffbe8", sw=4))


def floor_tiles(y0, c1, c2, size=120):
    s = [rect(-800, y0, 2700, 1920 - y0, c1, stroke="none", sw=0)]
    for i, xx in enumerate(range(-800, 1900, size)):
        for j, yy in enumerate(range(y0, 1920, size)):
            if (i + j) % 2:
                s.append(rect(xx, yy, size, size, c2, stroke="none", sw=0))
    s.append(line(-800, y0, 1900, y0, sw=LW))
    return "".join(s)


class Scene:
    seat_hip = 1262
    hands = None

    def back(self, t):
        return ""

    def seat_back(self, t):
        return ""

    def seat_front(self, t):
        return ""

    def front(self, t):
        return ""


class Restaurant(Scene):
    hands = "table"

    def back(self, t):
        s = [rect(-800, 0, 2700, 1500, "#f1dfc4", stroke="none", sw=0)]
        s.append(rect(-800, 1080, 2700, 420, "#a8744a", stroke="none", sw=0))
        s.append(line(-800, 1080, 1900, 1080, sw=LW))
        for k in range(-800, 1900, 90):
            s.append(line(k, 1100, k, 1490, sw=4, stroke="#8b5e3c"))
        s.append(rect(-500, 420, 640, 480, "#9fd3f2", rx=10, stroke="#ffffff", sw=24))
        s.append(rect(-512, 408, 664, 504, "none", rx=14))
        s.append(rect(-420, 640, 160, 260, "#e07a5f", stroke=INK, sw=5))
        s.append(rect(-200, 560, 200, 340, "#f2cc8f", stroke=INK, sw=5))
        s.append(line(-180, 660, 140, 660, sw=10, stroke="#ffffff"))
        s.append(deco_frame(560, 520, 220, 170, "#81b29a"))
        s.append(circle(670, 600, 40, "#f4f1de", sw=5))
        s.append(deco_frame(860, 470, 160, 220, "#e07a5f"))
        for lx in (300, 940):
            s.append(lamp(lx, 0, 330))
        s.append(floor_tiles(1500, "#e8e2d6", "#cfc5b4"))
        return "".join(s)

    def seat_back(self, t):
        s = [rect(800, 980, 265, 320, "#8b5e3c", rx=30)]
        for k in range(4):
            s.append(rect(830 + k * 56, 1010, 34, 260, "#a8744a", rx=10, sw=5))
        return "".join(s)

    def front(self, t):
        s = [path("M 690 1235 L 1110 1235 L 1130 1490 L 670 1490 Z", fill="#ffffff")]
        s.append(rect(680, 1212, 440, 34, "#f8f9fa", rx=10))
        for k in range(690, 1120, 60):
            s.append(line(k, 1260, k - 4, 1480, sw=3, stroke="#dee2e6"))
        s.append(ellipse(905, 1212, 120, 22, "#ffffff", sw=5))
        s.append(path("M 845 1210 L 965 1210 L 955 1130 L 855 1130 Z", fill="#e63946", sw=5))
        for k, dx in enumerate((-35, -15, 5, 25, 40)):
            s.append(rect(905 + dx - 8, 1085 + (k % 2) * 12, 16, 60, "#ffd166", rx=4, sw=4))
        s.append(path("M 1010 1212 L 1060 1212 L 1068 1110 L 1002 1110 Z", fill="#9b2226", sw=5))
        s.append(line(1040, 1110, 1058, 1060, sw=5, stroke="#ffffff"))
        return "".join(s)


class Cinema(Scene):
    def back(self, t):
        s = [rect(-800, 0, 2700, 1500, "#2b1630", stroke="none", sw=0)]
        glow = 0.85 + 0.15 * math.sin(t * 3.1) * math.sin(t * 1.3)
        s.append(rect(-260, 120, 1600, 520, "#dbe9ff", rx=8, stroke="#111", sw=10,
                      extra='opacity="%.2f"' % glow))
        s.append(ellipse(scroll(400, 60, t, 1600, -200), 470, 160, 70, "#a3c4f3", stroke="none", sw=0,
                         extra='opacity="0.6"'))
        for sx in (-1, 1):
            xx = -330 if sx < 0 else 1350
            s.append(path("M %s 60 Q %s 700 %s 1000 L %s 1000 Q %s 700 %s 60 Z" % (
                f(xx - 140), f(xx - 100), f(xx - 160), f(xx + 140), f(xx + 100), f(xx + 140)), fill="#9d0208"))
        for k in range(-760, 1900, 210):
            s.append(rect(k, 1020, 170, 220, "#6a040f", rx=40, sw=5))
            s.append(rect(k + 15, 1030, 140, 50, "#9d0208", rx=20, stroke="none", sw=0))
        for lx in (-200, 380, 960, 1500):
            s.append(ellipse(lx, 820, 26, 40, "#ffd166", sw=4, extra='opacity="0.9"'))
        s.append(rect(-800, 1500, 2700, 420, "#3c1a1a", stroke="none", sw=0))
        s.append(line(-800, 1500, 1900, 1500, sw=LW))
        for k in range(-760, 1900, 160):
            s.append(circle(k, 1530, 6, "#ffd166", stroke="none", sw=0))
        return "".join(s)

    def seat_back(self, t):
        return rect(800, 870, 270, 440, "#c1121f", rx=60) + rect(825, 895, 220, 120, "#d62839", rx=40, stroke="none",
                                                                   sw=0)

    def seat_front(self, t):
        s = [rect(790, 1255, 290, 100, "#9d0208", rx=30), rect(905, 1355, 60, 140, "#3c4046", rx=8)]
        for ax in (770, 1060):
            s.append(rect(ax, 1150, 50, 140, "#3c1a1a", rx=16))
            s.append(ellipse(ax + 25, 1150, 32, 12, "#222", sw=5))
        return "".join(s)


class Beach(Scene):
    def back(self, t):
        s = [rect(-800, 0, 2700, 960, "url(#sky)", stroke="none", sw=0)]
        s.append(circle(200, 260, 90, "#ffd166", sw=6))
        s.append(rect(-800, 900, 2700, 260, "#3a86c8", stroke="none", sw=0))
        for row, (yy, sp) in enumerate(((950, 30), (1020, 45), (1100, 60))):
            for k in range(-800, 1900, 220):
                xx = (k + sp * t + row * 70) % 2700 - 800
                s.append(path("M %s %s q 30 -18 60 0 q 30 18 60 0" % (f(xx), f(yy)), stroke="#ffffff", sw=5))
        bx = scroll(1500, 40, t, 2700, -800)
        s.append(path("M %s 905 l 40 -60 l 0 60 Z" % f(bx), fill="#ffffff", sw=5))
        s.append(rect(bx - 20, 902, 90, 14, "#e63946", rx=6, sw=4))
        gx = scroll(800, 70, t, 2700, -800)
        s.append(path("M %s 380 q 20 -20 40 0 q 20 -20 40 0" % f(gx), sw=5))
        s.append(rect(-800, 1150, 2700, 770, "#f2d9a0", stroke="none", sw=0))
        s.append(line(-800, 1150, 1900, 1150, sw=LW))
        for k in range(30):
            s.append(circle((k * 397) % 2700 - 800, 1250 + (k * 131) % 600, 4, "#d9bc80", stroke="none", sw=0))
        return "".join(s)

    def seat_back(self, t):
        s = [line(1110, 1500, 1060, 560, sw=16)]
        s.append(path("M 700 640 Q 1060 380 1420 640 Z", fill="#ffffff"))
        for k in range(4):
            a = 700 + k * 180
            s.append(path("M %s 640 Q %s %s %s 640 Z" % (f(a), f(a + 45), f(470 if k in (1, 2) else 540), f(a + 90)),
                          fill="#e63946", sw=5))
        s.append(rect(820, 1000, 230, 300, "#06d6a0", rx=10))
        for k in range(3):
            s.append(rect(820, 1030 + k * 90, 230, 40, "#ffffff", stroke="none", sw=0))
        s.append(rect(820, 1000, 230, 300, "none", rx=10))
        return "".join(s)

    def seat_front(self, t):
        return (rect(800, 1262, 270, 70, "#06d6a0", rx=20) + line(810, 1330, 760, 1500, sw=14, stroke="#b07d4f") +
                line(1060, 1330, 1110, 1500, sw=14, stroke="#b07d4f"))


class Supermarket(Scene):
    def back(self, t):
        s = [rect(-800, 0, 2700, 1500, "#f4f1ea", stroke="none", sw=0)]
        for k in range(-800, 1900, 300):
            s.append(rect(k + 40, 60, 220, 30, "#fffbe8", rx=10, sw=4))
        rnd = random.Random(4)
        cols = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d", "#8338ec", "#ff006e", "#06d6a0"]
        for row in range(4):
            yy = 470 + row * 210
            s.append(rect(-800, yy + 160, 1580, 26, "#adb5bd", sw=5))
            xx = -790
            while xx < 760:
                w_ = rnd.choice((50, 60, 70, 90))
                h_ = rnd.choice((90, 110, 130, 150))
                s.append(rect(xx, yy + 160 - h_, w_ - 6, h_, rnd.choice(cols), rx=6, sw=4))
                xx += w_
        s.append(rect(620, 380, 440, 110, "#d62828", rx=14))
        s.append(text_el(840, 452, "10 ARTICLES MAX", 44, "#ffffff"))
        s.append(line(690, 300, 690, 380, sw=5) + line(990, 300, 990, 380, sw=5))
        s.append(floor_tiles(1500, "#f8f9fa", "#dee2e6", 140))
        return "".join(s)

    def seat_back(self, t):
        return (rect(1000, 1150, 700, 350, "#adb5bd", rx=10) + rect(990, 1120, 720, 50, "#212529", rx=10) +
                rect(1180, 980, 140, 140, "#495057", rx=10) + rect(1195, 995, 110, 70, "#9be37a", rx=6, sw=4))


class Bus(Scene):
    def back(self, t):
        s = []
        s.append(rect(-800, 520, 2700, 440, "url(#sky)", stroke="none", sw=0))
        rnd = random.Random(7)
        cols = ["#e9c46a", "#f4a261", "#e76f51", "#a8dadc", "#cdb4db", "#bde0fe"]
        for k in range(14):
            bx = scroll(k * 200, 320, t, 2800, -800)
            h_ = 180 + (k * 53) % 200
            s.append(rect(bx, 960 - h_, 170, h_ + 20, cols[k % len(cols)], sw=5))
            for wy in range(int(960 - h_ + 25), 930, 55):
                s.append(rect(bx + 25, wy, 40, 30, "#ffffff", sw=3) + rect(bx + 105, wy, 40, 30, "#ffffff", sw=3))
        for k in range(0, 2800, 520):
            tx = scroll(k, 600, t, 2800, -800)
            s.append(rect(tx - 6, 780, 12, 180, "#495057", stroke="none", sw=0))
            s.append(circle(tx, 760, 55, "#52b788", sw=5))
        holes = "".join(rrect_d(x, 540, 470, 400, 20) for x in (-640, -60, 520, 1100))
        s.append(path("M -800 0 H 1900 V 1500 H -800 Z " + holes, fill="#e9ecef", stroke="none", sw=0,
                      extra='fill-rule="evenodd"'))
        for x in (-640, -60, 520, 1100):
            s.append(rect(x, 540, 470, 400, "none", rx=20, stroke="#495057", sw=14))
        s.append(rect(-800, 0, 2700, 300, "#dee2e6", stroke="none", sw=0))
        s.append(rect(-800, 300, 2700, 70, "#ffd166", stroke=INK, sw=5))
        s.append(rect(640, 395, 420, 80, "#1b1b1b", rx=10))
        s.append(text_el(850, 450, "LIGNE 42 · TERMINUS", 34, "#ff9f1c"))
        for px in (-260, 560):
            s.append(rect(px - 14, 370, 28, 1130, "#ffd166", rx=10, sw=5))
        s.append(rect(546, 760, 28, 60, "#e63946", rx=8, sw=4))
        s.append(rect(-800, 1500, 2700, 420, "#6c757d", stroke="none", sw=0))
        s.append(line(-800, 1500, 1900, 1500, sw=LW))
        return "".join(s)

    def seat_back(self, t):
        return (rect(810, 860, 250, 440, "#1d3557", rx=36) +
                "".join(circle(850 + (k % 4) * 55, 950 + (k // 4) * 80, 9, "#e63946", stroke="none", sw=0)
                        for k in range(16)))

    def seat_front(self, t):
        return rect(800, 1258, 270, 100, "#16304d", rx=30) + rect(905, 1358, 60, 140, "#495057", rx=8)


class PoolScene(Scene):
    def back(self, t):
        s = [rect(-800, 0, 2700, 1000, "url(#sky)", stroke="none", sw=0)]
        s.append(rect(-500, 330, 900, 680, "#f6bd60", sw=6))
        for wy in range(380, 980, 110):
            for wx in range(-460, 380, 130):
                s.append(rect(wx, wy, 80, 70, "#bde0fe", sw=4))
        for px, h_ in ((620, 520), (1250, 600)):
            s.append(path("M %s 1000 Q %s %s %s %s" % (f(px), f(px + 30), f(1000 - h_ / 2), f(px + 10),
                                                     f(1000 - h_)), stroke="#9c6644", sw=26))
            for a in range(5):
                ang = math.pi * (0.1 + a * 0.2)
                s.append(path("M %s %s Q %s %s %s %s" % (
                    f(px + 10), f(1000 - h_), f(px + 10 + math.cos(ang) * 120), f(1000 - h_ - 90),
                    f(px + 10 + math.cos(ang) * 230), f(1000 - h_ + 40)), stroke="#2d6a4f", sw=22))
        s.append(rect(-800, 1000, 2700, 70, "#e9ecef", stroke=INK, sw=5))
        s.append(rect(-800, 1070, 2700, 260, "#48cae4", stroke="none", sw=0))
        for k in range(-800, 1900, 160):
            xx = k + 20 * math.sin(t * 1.5 + k)
            s.append(path("M %s %s q 25 -10 50 0" % (f(xx), f(1130 + (k // 160 % 3) * 60)), stroke="#ffffff", sw=5,
                          extra='opacity="0.8"'))
        s.append(rect(-800, 1330, 2700, 590, "#f1e3c8", stroke=INK, sw=5))
        for k in range(-800, 1900, 120):
            s.append(line(k, 1330, k, 1920, sw=3, stroke="#d8c3a5"))
        return "".join(s)

    def seat_back(self, t):
        s = [rect(810, 980, 260, 330, "#ffffff", rx=24)]
        for k in range(5):
            s.append(line(830, 1020 + k * 55, 1050, 1020 + k * 55, sw=5, stroke="#adb5bd"))
        s.append(rect(830, 990, 220, 240, "#ff70a6", rx=16, sw=5, extra='opacity="0.9"'))
        return "".join(s)

    def seat_front(self, t):
        return (rect(790, 1262, 300, 60, "#ffffff", rx=18) + line(810, 1320, 800, 1500, sw=12, stroke="#adb5bd") +
                line(1070, 1320, 1080, 1500, sw=12, stroke="#adb5bd"))


class Plane(Scene):
    def back(self, t):
        s = []
        for wx in (-430, 130, 690, 1250):
            s.append(ellipse(wx, 720, 120, 170, "url(#sky)", stroke="none", sw=0))
            cx = scroll(wx * 3, 140, t, 600, wx - 300)
            s.append(ellipse(cx, 700, 70, 28, "#ffffff", stroke="none", sw=0))
            s.append(ellipse(cx + 80, 790, 50, 20, "#ffffff", stroke="none", sw=0))
        holes = "".join("M %s 720 a 120 170 0 1 0 240 0 a 120 170 0 1 0 -240 0 Z " % f(wx - 120)
                        for wx in (-430, 130, 690, 1250))
        s.append(path("M -800 0 H 1900 V 1500 H -800 Z " + holes, fill="#eef0f2", stroke="none", sw=0,
                      extra='fill-rule="evenodd"'))
        for wx in (-430, 130, 690, 1250):
            s.append(ellipse(wx, 720, 120, 170, "none", stroke="#c9ced3", sw=20))
            s.append(ellipse(wx, 720, 132, 182, "none"))
        s.append(path("M -800 0 H 1900 V 280 Q 540 420 -800 280 Z", fill="#dfe3e8"))
        for k in range(-800, 1900, 420):
            s.append(rect(k + 10, 150, 400, 160, "#f8f9fa", rx=24, sw=5))
            s.append(rect(k + 170, 270, 80, 18, "#adb5bd", rx=6, sw=3))
        s.append(rect(-800, 1500, 2700, 420, "#5c677d", stroke="none", sw=0))
        s.append(line(-800, 1500, 1900, 1500, sw=LW))
        s.append(path("M 60 1920 L 260 1500 L 500 1500 L 560 1920 Z", fill="#7d8597", stroke="none", sw=0))
        return "".join(s)

    def seat_back(self, t):
        return (rect(810, 820, 255, 480, "#33415c", rx=44) + rect(828, 832, 220, 100, "#f8f9fa", rx=26, sw=5) +
                rect(575, 820, 230, 480, "#33415c", rx=44) + rect(593, 832, 194, 100, "#f8f9fa", rx=26, sw=5))

    def seat_front(self, t):
        return (rect(569, 1260, 242, 100, "#273449", rx=30) + rect(805, 1260, 265, 100, "#273449", rx=30) +
                rect(790, 1170, 40, 120, "#9aa4ab", rx=14) + rect(552, 1170, 40, 120, "#9aa4ab", rx=14) +
                rect(895, 1360, 80, 140, "#6c757d", rx=8))


class Cafe(Scene):
    hands = "table"

    def back(self, t):
        s = [rect(-800, 0, 2700, 1500, "#2f5d50", stroke="none", sw=0)]
        s.append(rect(-800, 1100, 2700, 400, "#b5651d", stroke="none", sw=0))
        for yy in range(1100, 1500, 50):
            s.append(line(-800, yy, 1900, yy, sw=3, stroke="#8d4f17"))
            for xx in range(-800 + (yy // 50 % 2) * 60, 1900, 120):
                s.append(line(xx, yy, xx, yy + 50, sw=3, stroke="#8d4f17"))
        s.append(line(-800, 1100, 1900, 1100, sw=LW))
        s.append(rect(-520, 360, 560, 520, "#1b1b1b", rx=10, stroke="#8b5e3c", sw=20))
        s.append(text_el(-240, 460, "MENU", 64, "#ffffff"))
        for k, txt in enumerate(("Café ..... 2€", "Thé ...... 3€", "Croissant 2€", "Chocolat 3€")):
            s.append(text_el(-240, 560 + k * 80, txt, 40, "#f1faee", weight=500))
        for yy in (500, 700):
            s.append(rect(560, yy, 520, 20, "#8b5e3c", sw=5))
            for k in range(5):
                s.append(rect(590 + k * 95, yy - 70, 60, 70, ["#f1faee", "#e9c46a", "#e76f51"][k % 3], rx=10, sw=5))
        for lx in (200, 820):
            s.append(lamp(lx, 0, 300, "#e9c46a"))
        s.append(rect(-800, 1500, 2700, 420, "#8d6346", stroke="none", sw=0))
        for k in range(-800, 1900, 140):
            s.append(line(k, 1500, k - 60, 1920, sw=3, stroke="#6f4b33"))
        s.append(line(-800, 1500, 1900, 1500, sw=LW))
        return "".join(s)

    def seat_back(self, t):
        return path("M 820 1300 L 820 1040 Q 935 930 1050 1040 L 1050 1300", stroke="#1b1b1b", sw=26) + \
            path("M 820 1300 L 820 1040 Q 935 930 1050 1040 L 1050 1300", stroke="#6f4b33", sw=12)

    def front(self, t):
        s = [line(905, 1240, 905, 1490, sw=18)]
        s.append(ellipse(905, 1495, 90, 18, "#3c4046"))
        s.append(ellipse(905, 1228, 230, 32, "#f8f9fa"))
        s.append(path("M 790 1215 L 990 1215 L 1010 1060 L 810 1060 Z", fill="#adb5bd"))
        s.append(circle(905, 1135, 20, "#ffffff", sw=4))
        s.append(rect(1035, 1160, 60, 55, "#ffffff", rx=8, sw=5))
        s.append(path("M 1095 1172 q 22 10 0 28", sw=5))
        for k in range(3):
            yy = 1140 - ((t * 40 + k * 25) % 75)
            s.append(path("M %s %s q 10 -10 0 -20" % (f(1052 + k * 13), f(yy)), stroke="#ffffff", sw=4,
                          extra='opacity="0.8"'))
        return "".join(s)


class Waiting(Scene):
    def back(self, t):
        s = [rect(-800, 0, 2700, 1500, "#e0f2ee", stroke="none", sw=0)]
        s.append(rect(-800, 1120, 2700, 380, "#b7e4c7", stroke="none", sw=0))
        s.append(line(-800, 1120, 1900, 1120, sw=LW))
        s.append(rect(40, 300, 560, 110, "#ffffff", rx=14))
        s.append(text_el(320, 375, "SALLE D'ATTENTE", 48, "#2d6a4f"))
        s.append(rect(740, 300, 280, 130, "#1b1b1b", rx=12))
        s.append(text_el(880, 395, "N° 42", 68, "#ff3b30"))
        s.append(rect(-520, 480, 300, 400, "#ffffff", rx=8))
        s.append(path("M -370 640 c -40 -50 -110 0 0 100 c 110 -100 40 -150 0 -100 Z", fill="#e63946", sw=5))
        s.append(text_el(-370, 820, "Lavez-vous", 32, "#2d6a4f"))
        s.append(text_el(-370, 860, "les mains", 32, "#2d6a4f"))
        s.append(rect(1160, 1180, 120, 140, "#bc6c25", rx=10))
        for a in range(5):
            s.append(ellipse(1220 + (a - 2) * 30, 1120 - abs(a - 2) * 20, 30, 80, "#52b788", sw=5))
        s.append(rect(-800, 1500, 2700, 420, "#ced4da", stroke="none", sw=0))
        s.append(line(-800, 1500, 1900, 1500, sw=LW))
        return "".join(s)

    def seat_back(self, t):
        s = []
        for sx in (560, 815):
            s.append(rect(sx, 1010, 240, 280, "#f77f00", rx=40))
        s.append(rect(540, 1350, 560, 22, "#6c757d", sw=5))
        return "".join(s)

    def seat_front(self, t):
        s = []
        for sx in (560, 815):
            s.append(rect(sx - 6, 1262, 252, 60, "#e36414", rx=24))
        s.append(line(600, 1320, 600, 1500, sw=12, stroke="#6c757d") + line(1040, 1320, 1040, 1500, sw=12,
                                                                            stroke="#6c757d"))
        return "".join(s)


class Park(Scene):
    hands = "cone"

    def back(self, t):
        s = [rect(-800, 0, 2700, 1150, "url(#sky)", stroke="none", sw=0)]
        for k, (cx, cy) in enumerate(((100, 220), (900, 160), (1500, 260))):
            xx = scroll(cx, 15, t, 2700, -800)
            for dx, dy, r in ((0, 0, 50), (50, -20, 60), (110, 0, 48)):
                s.append(circle(xx + dx, cy + dy, r, "#ffffff", stroke="none", sw=0))
        s.append(ellipse(200, 1150, 900, 220, "#95d5b2", stroke="none", sw=0))
        s.append(ellipse(1300, 1150, 800, 260, "#74c69d", stroke="none", sw=0))
        for tx, sc in ((-450, 1.2), (60, 0.9), (700, 1.1), (1350, 1.0)):
            s.append(rect(tx - 18 * sc, 1150 - 260 * sc, 36 * sc, 260 * sc, "#7f5539", sw=5))
            s.append(circle(tx, 1150 - 300 * sc, 130 * sc, "#40916c", sw=6))
            s.append(circle(tx - 70 * sc, 1150 - 240 * sc, 80 * sc, "#52b788", sw=6))
        s.append(rect(-760, 900, 320, 260, "#ffffff", rx=20))
        s.append(path("M -800 900 Q -600 760 -400 900 Z", fill="#ff8fab"))
        s.append(text_el(-600, 1050, "GLACES", 48, "#e63946"))
        for wx in (-700, -500):
            s.append(circle(wx, 1170, 40, "#3c4046", sw=6))
        s.append(rect(-800, 1150, 2700, 770, "#74c69d", stroke="none", sw=0))
        s.append(line(-800, 1150, 1900, 1150, sw=LW))
        s.append(path("M -800 1500 L 1900 1500 L 1900 1700 L -800 1700 Z", fill="#e9d8a6", stroke="none", sw=0))
        return "".join(s)

    def seat_back(self, t):
        s = []
        for k in range(3):
            s.append(rect(700, 1060 + k * 70, 420, 46, "#2d6a4f", rx=10))
        return "".join(s)

    def seat_front(self, t):
        return (rect(690, 1262, 440, 50, "#2d6a4f", rx=12) + line(720, 1310, 720, 1500, sw=16) +
                line(1100, 1310, 1100, 1500, sw=16))


SCENES = {"restaurant": Restaurant, "cinema": Cinema, "beach": Beach, "supermarket": Supermarket, "bus": Bus,
          "pool": PoolScene, "plane": Plane, "cafe": Cafe, "waiting": Waiting, "park": Park}


def cart(x, t):
    """Chariot de courses plein (ancré à x = côté gauche)."""
    s = [line(x + 300, 1240, x + 340, 1180, sw=10)]
    s.append(path("M %s 1250 L %s 1250 L %s 1470 L %s 1470 Z" % (f(x), f(x + 300), f(x + 270), f(x + 30)),
                  fill="#dee2e6", extra='fill-opacity="0.5"'))
    rnd = random.Random(2)
    cols = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d", "#8338ec", "#ff006e", "#06d6a0"]
    for k in range(9):
        bx = x + 20 + (k % 5) * 54
        s.append(rect(bx, 1150 + (k // 5) * 50 - rnd.randint(0, 40), 50, 110, rnd.choice(cols), rx=6, sw=4))
    s.append(path("M %s 1250 L %s 1250 L %s 1470 L %s 1470 Z" % (f(x), f(x + 300), f(x + 270), f(x + 30)),
                  fill="none"))
    for k in range(1, 6):
        s.append(line(x + k * 50, 1250, x + 15 + k * 45, 1470, sw=3, stroke="#6c757d"))
    s.append(line(x + 30, 1470, x + 30, 1540, sw=6) + line(x + 270, 1470, x + 270, 1540, sw=6))
    s.append(circle(x + 30, 1555, 18, "#3c4046", sw=5) + circle(x + 270, 1555, 18, "#3c4046", sw=5))
    return "".join(s)


# ============================================================== timeline

LEAD_IN, END_HOLD = 0.8, 1.4
ENTER_DUR, EXIT_DUR = 1.5, 2.6


PIPER_FR = {"tom": ("fr_FR-tom-medium", None), "pierre": ("fr_FR-upmc-medium", 1), "miro": ("fr_FR-miro-high", None),
            "jessica": ("fr_FR-upmc-medium", 0)}
_PIPER = {}


def piper_say(text, voice, length, path_):
    """Voix Piper françaises natives (sans accent) ; « pierre » = la voix H choisie."""
    from piper import PiperVoice, SynthesisConfig
    model, spk = PIPER_FR[voice]
    if model not in _PIPER:
        _PIPER[model] = PiperVoice.load(voice_model(model))
    with wave.open(path_, "wb") as w_:
        _PIPER[model].synthesize_wav(text, w_, syn_config=SynthesisConfig(
            speaker_id=spk, length_scale=length, noise_scale=0.667, noise_w_scale=0.8))


# Voix ElevenLabs (voix « premade » multilingues, modèle qui parle français sans accent).
# Chaque identifiant peut être remplacé par une variable d'environnement ELEVEN_VOICE_<CLÉ>.
ELEVEN_VOICES = {
    "adam": "pNInz6obpgDQGcFmaJgB",     # homme, voix grave et posée
    "antoni": "ErXwobaYiN019PkySvjV",   # homme, voix chaleureuse
    "josh": "TxGEqnHWrfWFTfGW9XjX",     # homme, jeune
    "rachel": "21m00Tcm4TlvDq8ikWAM",   # femme, calme
    "bella": "EXAVITQu4vr4xnSDxMaL",    # femme, douce
    "elli": "MF3mGyEYCl7XYWbV9V6O",     # femme, jeune
}
ELEVEN_MODEL = os.environ.get("ELEVEN_MODEL", "eleven_multilingual_v2")


def eleven_say(text, voice, path_):
    """Synthèse ElevenLabs (clé dans ELEVENLABS_API_KEY) -> wav."""
    import json as _json
    import urllib.request
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY absent : ajoute la clé dans les réglages de l'environnement.")
    vid = os.environ.get("ELEVEN_VOICE_" + voice.upper(), ELEVEN_VOICES.get(voice, voice))
    body = dict(text=text, model_id=ELEVEN_MODEL,
                voice_settings=dict(stability=0.45, similarity_boost=0.8, style=0.35, use_speaker_boost=True))
    if "2_5" in ELEVEN_MODEL:  # seuls les modèles v2.5 acceptent qu'on impose la langue
        body["language_code"] = "fr"
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128" % vid,
        data=_json.dumps(body).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    mp3 = path_ + ".mp3"
    with urllib.request.urlopen(req, timeout=120) as r, open(mp3, "wb") as fh:
        fh.write(r.read())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", path_], check=True)
    os.remove(mp3)


def audio_dir(sk):
    mode = sk.get("voice_mode")
    return os.path.join(tts.BUILD, {"fr": "sk4", "eleven": "sk5", "en": "sk6"}.get(mode, "sk3"), sk["slug"])


def kokoro_en(text, voice, speed, path):
    """Voix anglaises natives de Kokoro (am_michael, af_heart, bm_george…)."""
    k = kokoro()
    samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us" if voice[0] == "a" else "en-gb")
    with wave.open(path, "wb") as w_:
        w_.setnchannels(1)
        w_.setsampwidth(2)
        w_.setframerate(sr)
        w_.writeframes((np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes())


def synth(sk, speed_mul=1.0):
    fr = sk.get("voice_mode") == "fr"
    eleven = sk.get("voice_mode") == "eleven"
    english = sk.get("voice_mode") == "en"
    d = audio_dir(sk)
    os.makedirs(d, exist_ok=True)
    loaded = {}
    out = []
    for i, ln in enumerate(sk["lines"]):
        if ln[0].startswith("@"):
            out.append(None)
            continue
        role, _, text = ln[:3]
        vkey, speed, semis = sk["voices"][role]
        speed *= speed_mul
        final = os.path.join(d, "%02d_%s_%.3f.wav" % (i, role, speed_mul))
        if not os.path.exists(final):
            raw = final.replace(".wav", "_raw.wav")
            if english:
                kokoro_en(text, vkey, speed, raw)
            elif eleven:
                eleven_say(text.replace("...", "…"), vkey, raw)
            elif fr and vkey in PIPER_FR:
                piper_say(text.replace("...", ","), vkey, 0.97 * speed, raw)
            elif fr:
                kokoro_wav(text.replace("...", ","), "femme1", 1.0 / speed, raw)
            else:
                kokoro_wav(text.replace("...", ","), KOKORO_OF[vkey], 0.92 / speed, raw)
            tts.to_sr(raw, final, semis)
            os.remove(raw)
        out.append(final)
    return out


def build_timeline(sk, wavs, gap=0.3):
    segs = []
    t = 0.15 if sk.get("hook_text") else LEAD_IN
    moods = {"E": "smile", "V": "neutral", "K": "neutral", "A": "neutral"}
    for i, ln in enumerate(sk["lines"]):
        if ln[0] == "@ENTER":
            segs.append(dict(kind="enter", t0=t, t1=t + ENTER_DUR, moods=dict(moods), shot="wide"))
            t += ENTER_DUR
            continue
        if ln[0] == "@EXIT":
            segs.append(dict(kind="exit", t0=t, t1=t + EXIT_DUR, moods=dict(moods), shot="wide"))
            t += EXIT_DUR
            continue
        role, mood, text = ln[:3]
        mid = len(ln) > 3 and ln[3] == "MID"
        moods[role] = MOODS[mood]
        x, sr = tts.read_wav(wavs[i])
        dur = len(x) / sr
        hop = sr // FPS
        env = np.array([np.sqrt(np.mean(x[k * hop:(k + 1) * hop] ** 2) + 1e-12)
                        for k in range(int(math.ceil(len(x) / hop)))])
        env = env / (np.percentile(env, 90) + 1e-9)
        segs.append(dict(kind="line", t0=t, t1=t + dur, who=role, text=text, wav=wavs[i], env=env,
                         moods=dict(moods), idx=i, mid=mid))
        t += dur + gap
    total = t + (2.2 if sk.get("cta") else END_HOLD)
    # plans de caméra automatiques
    after_enter = False
    n_e = 0
    for sg in segs:
        if sg["kind"] == "enter":
            after_enter = True
        if sg["kind"] != "line":
            continue
        who = sg["who"]
        if sg is segs[0]:
            sg["shot"] = "EV"
        elif who == "E":
            n_e += 1
            if "incroyable" in sg["text"]:
                sg["shot"] = "wide"
            elif after_enter:
                sg["shot"] = "EA"
            else:
                sg["shot"] = "EV" if n_e % 3 == 0 else "E"
        else:
            sg["shot"] = who
        sg["to"] = {"E": "A" if after_enter else "V", "V": "E", "K": "E", "A": "E"}[who]
        if who == "V" and (sg is [s for s in segs if s["kind"] == "line"][-1] or
                           any(x["kind"] == "exit" and x["t0"] <= sg["t0"] for x in segs)):
            sg["to"] = "CAM"
        if sg.get("mid"):
            sg["to"] = "CAM"
    return segs, total


# ============================================================== état / rendu

class Ctx:
    pass


def make_ctx(sk, segs, total):
    c = Ctx()
    c.sk, c.segs, c.total = sk, segs, total
    c.scene = SCENES[sk["scene"]]()
    c.has_k = "K" in sk["cast"]
    c.standing_v = sk.get("victim_standing", False)
    c.enter = next(s for s in segs if s["kind"] == "enter")
    c.exit = next(s for s in segs if s["kind"] == "exit")
    return c


def look_vec(heads, a, b):
    if b == "CAM":
        return (0.0, 0.1)
    if b not in heads or a not in heads:
        return (0.0, 0.0)
    ax, ay = heads[a]
    bx, by = heads[b]
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy) + 1e-9
    return (dx / n, dy / n * 0.8)


def state(c, t):
    cur = None
    for sg in c.segs:
        if sg["t0"] <= t:
            cur = sg
    if cur is None:
        cur = dict(kind="intro", t0=0, t1=LEAD_IN, shot="wide",
                   moods={"E": "smile", "V": "neutral", "K": "neutral", "A": "neutral"})
    speaking = cur["kind"] == "line" and t < cur["t1"]
    who = cur.get("who") if speaking else None
    mouth = 0.0
    if speaking:
        env = cur["env"]
        k = (t - cur["t0"]) * FPS
        i0 = int(k)
        a = env[min(i0, len(env) - 1)]
        b = env[min(i0 + 1, len(env) - 1)]
        e = lerp(a, b, k - i0)
        e = 0.6 * e + 0.4 * env[max(0, min(i0 - 2, len(env) - 1))]  # lissage
        mouth = max(0.0, min(1.0, (e - 0.18) / 0.85))
        mouth *= min(1.0, (cur["t1"] - t) / 0.08)  # fermeture douce en fin de phrase

    en, ex = c.enter, c.exit
    E0, K0, A0 = 330, 150, 150
    E1, K1 = (410, 610) if c.has_k else (330, 150)
    ex_, kx, ax = E0, K0, A0
    walk = {"E": None, "K": None, "A": None, "V": None}
    if t >= en["t0"]:
        u = (t - en["t0"]) / ENTER_DUR
        ax = lerp(-330, A0, ease(u))
        ex_ = lerp(E0, E1, ease(u * 1.3))
        kx = lerp(K0, K1, ease((u - 0.1) * 1.2))
        if u < 0.95:
            walk["A"] = (t - en["t0"]) * 9
        if c.has_k and 0.05 < u < 0.8:
            walk["K"] = (t - en["t0"]) * 11
        if c.has_k and u < 0.7:
            walk["E"] = (t - en["t0"]) * 9
    if t >= ex["t0"]:
        u = t - ex["t0"]
        ax = A0 - 1400 * ease(u / 1.9)
        ex_ = E1 - 1500 * ease((u - 0.3) / 2.0)
        kx = K1 - 1550 * ease((u - 0.5) / 2.0)
        walk["A"] = u * 9 if u < 1.9 else None
        walk["E"] = (u - 0.3) * 9 if 0.3 < u < 2.3 else None
        walk["K"] = (u - 0.5) * 11 if 0.5 < u < 2.5 else None
    vx = 900 if c.standing_v else 932
    heads = {"E": (ex_, 920), "V": (vx, 905), "A": (ax, 920)}
    if c.has_k:
        heads["K"] = (kx, 1290)

    st = {}
    for r in "EVKA":
        ph = (t + "EVKA".index(r) * 0.63) % (3.3 + "EVKA".index(r) * 0.37)
        bk = max(0.0, 1.0 - abs(ph - 0.09) / 0.09) if ph < 0.18 else 0.0
        st[r] = dict(expr=cur["moods"].get(r, "neutral"), mouth=mouth if who == r else 0.0, blink=bk,
                     walk=walk.get(r), pose="down", pose_amt=1.0,
                     tilt=math.sin(t * 0.9 + "EVKA".index(r) * 1.7) * 1.6)
        if who == r:
            st[r]["tilt"] += math.sin(t * 3.1) * 2.2 + mouth * 1.5
    st["E"]["x"], st["K"]["x"], st["A"]["x"], st["V"]["x"] = ex_, kx, ax, vx
    focus = who if who else ("A" if cur["kind"] == "enter" else None)
    for r in "EVKA":
        if speaking and r == who:
            st[r]["look"] = look_vec(heads, r, cur["to"])
        elif focus and r != focus:
            st[r]["look"] = look_vec(heads, r, focus)
        else:
            st[r]["look"] = look_vec(heads, r, "V" if r != "V" else "E")
    if t < LEAD_IN + 0.9:
        st["V"]["look"] = (0.05, 0.95)
    if c.has_k and not (speaking and who == "K") and cur["kind"] != "exit" and int(t / 2.7) % 3:
        st["K"]["look"] = look_vec(heads, "K", "V")
    # gestes : montée progressive au début de la réplique, retour progressif après
    for r in "EA":
        last = None
        for sg in c.segs:
            if sg["kind"] == "line" and sg["who"] == r and sg["t0"] <= t:
                last = sg
        if last is None:
            continue
        ee = last["moods"].get(r, "neutral")
        target = ({"angry": "point", "shocked": "up"}.get(ee, "gesture")) if r == "E" else "gesture"
        if t < last["t1"]:
            st[r]["pose"], st[r]["pose_amt"] = target, ease((t - last["t0"]) / 0.35)
        elif t - last["t1"] < 0.4:
            st[r]["pose"], st[r]["pose_amt"] = target, 1.0 - ease((t - last["t1"]) / 0.4)
    if speaking:
        if who == "K":
            st["K"]["stomp"] = True
            st["K"]["hop"] = -abs(math.sin((t - cur["t0"]) * 9)) * 18
    if st["A"]["pose"] == "down":
        st["A"]["pose"] = "machine"
    if c.has_k and t < en["t0"] and not st["K"].get("stomp"):
        st["E"]["hold_left"] = (ex_ - 100, 1292)
        st["K"]["hold_right"] = (ex_ - 100, 1292)
    if c.sk.get("cart") and (st["E"]["pose"] == "down" or st["E"]["pose_amt"] < 0.05):
        st["E"]["pose"] = "down"
        st["E"]["cart"] = True
    if c.standing_v:
        st["V"]["basket"] = True
    if speaking and who == "V" and cur.get("to") == "CAM" and st["V"]["expr"] == "smile":
        st["V"]["pose"] = "wave"
        st["V"]["base_pose"] = "down"
        st["V"]["pose_amt"] = ease((t - cur["t0"]) / 0.35)
    if t >= ex["t0"]:
        u = t - ex["t0"]
        st["E"]["look"] = (-1, 0)
        st["K"]["look"] = (-0.6, -0.6)
        st["A"]["look"] = (-1, 0)
        st["E"]["expr"] = "angry"
        st["E"].pop("hold_left", None)
        st["K"].pop("hold_right", None)
        st["E"]["drag"] = c.has_k
        st["E"]["pose"] = "down"
        st["E"]["pose_amt"] = 1.0
        st["V"]["look"] = (-0.95, 0.1) if t < ex["t1"] - 0.5 else (0.0, 0.1)
    st["A"]["visible"] = t >= en["t0"] and ax > -500
    st["E"]["visible"] = ex_ > -420
    st["K"]["visible"] = c.has_k and kx > -420

    shots = {"wide": (540, 960, 1.0), "E": (ex_ + 30, 1010, 1.7), "V": (vx - 25, 990, 1.7),
             "K": (kx + 40, 1330, 1.85), "A": (max(ax + 110, 330), 1000, 1.6), "EV": (560, 1000, 1.12),
             "EA": ((ex_ + ax) / 2, 1020, 1.38)}

    def cam_of(sg):
        sx, sy, sc = shots[sg.get("shot", "wide")]
        u = min(1.0, max(0.0, (t - sg["t0"]) / 5.0))
        sc *= 1 + 0.035 * u
        if sg["kind"] == "exit":
            sc = 1.0 + 0.05 * u
        vw, vh = W / sc, H / sc
        sx = min(max(sx, -260 + vw / 2), 1340 - vw / 2) if sc > 1.0 else 540
        sy = min(max(sy, vh / 2), 1920 - vh / 2)
        return sx, sy, sc

    cam = cam_of(cur)
    # transition douce (travelling) depuis le plan précédent
    idx = c.segs.index(cur) if cur in c.segs else -1
    if idx > 0 and c.segs[idx - 1].get("shot") != cur.get("shot"):
        u = ease((t - cur["t0"]) / 0.55)
        if u < 1:
            p0 = cam_of(c.segs[idx - 1])
            cam = tuple(lerp(a, b, u) for a, b in zip(p0, cam))
    return st, cam, cur


def cta_card(c, t):
    """Carte « Abonne-toi » animée : bouton + Suivre, main qui clique, objectif 10 000 abonnés."""
    lines_ = [s_ for s_ in c.segs if s_["kind"] == "line"]
    t0 = lines_[-1]["t0"]
    if t < t0:
        return ""
    u = t - t0
    dy = (1 - ease(u / 0.45)) * 520
    s = ['<g transform="translate(0 %s)">' % f(dy)]
    s.append(rect(118, 1188, 844, 300, "#000000", rx=44, stroke="none", sw=0, extra='opacity="0.18"'))
    s.append(rect(110, 1176, 860, 300, "#ffffff", rx=44, sw=6))
    # avatar
    s.append(circle(225, 1290, 72, "#ffd166", sw=6))
    s.append(circle(200, 1275, 12, INK, stroke="none", sw=0) + circle(250, 1275, 12, INK, stroke="none", sw=0))
    s.append(path("M 190 1312 Q 225 1345 260 1312", sw=7))
    s.append(text_el(330, 1262, c.sk.get("cta_title", "Abonne-toi !"), 60, INK, anchor="start"))
    s.append(text_el(330, 1308, c.sk.get("cta_sub", "Une nouvelle histoire chaque jour"), 30, "#555555", weight=600,
                     anchor="start"))
    tap = 1.3
    btn = c.sk.get("cta_btn")
    followed = u > tap + 0.15 and not btn
    if btn is None and c.sk.get("cta_follow"):  # bouton « suivre » traduit, qui passe à l'état « suivi »
        btn = c.sk["cta_done"] if u > tap + 0.15 else c.sk["cta_follow"]
        followed = u > tap + 0.15
    pulse = 1 + (0.06 * math.sin(u * 9) if not followed else 0)
    if u > tap and u < tap + 0.15:
        pulse = 0.92
    bx, by, bw, bh = 330, 1332, 330, 84
    cx, cy = bx + bw / 2, by + bh / 2
    s.append('<g transform="translate(%s %s) scale(%.3f) translate(%s %s)">' % (f(cx), f(cy), pulse, f(-cx), f(-cy)))
    s.append(rect(bx, by, bw, bh, "#9aa0a6" if followed else "#fe2c55", rx=42, sw=5))
    s.append(text_el(cx, cy + 16, btn or ("Abonné" if followed else "+ Suivre"), 44, "#ffffff"))
    s.append("</g>")
    if not btn or c.sk.get("cta_follow"):
        # objectif 10 000
        prog = min(1.0, 0.82 + 0.17 * ease((u - tap) / 1.2)) if u > tap else 0.82
        s.append(rect(690, 1350, 250, 24, "#eeeeee", rx=12, sw=4))
        s.append(rect(690, 1350, 250 * prog, 24, "#25d366", rx=12, stroke="none", sw=0))
        s.append(text_el(815, 1408, "%d / 10 000" % int(prog * 10000), 30, INK, weight=800))
        s.append(text_el(815, 1440, c.sk.get("goal_word", "objectif"), 24, "#777777", weight=600))
    # main qui vient cliquer
    hx = lerp(900, cx + 40, ease((u - 0.4) / 0.8))
    hy = lerp(1700, cy + 30, ease((u - 0.4) / 0.8))
    if u > tap + 0.5:
        hy += ease((u - tap - 0.5) / 0.5) * 500
    hs = 0.85 if tap < u < tap + 0.15 else 1.0
    s.append('<g transform="translate(%s %s) scale(%.2f)">' % (f(hx), f(hy), hs))
    s.append(path("M -14 0 L -14 -70 Q 0 -86 14 -70 L 14 -10 L 40 -16 Q 62 -14 60 14 L 52 70 L -26 70 "
                  "L -48 26 Q -54 6 -36 6 Z", fill="#ffe0bd", sw=6))
    s.append("</g>")
    s.append("</g>")
    return "".join(s)


def overlay(c, cur, t):
    title = c.sk["title"]
    size = 46 if len(title) <= 36 else int(46 * 36 / len(title))
    tw = len(title) * size * 0.555 + 60
    s = [rect(540 - tw / 2, 168, tw, 82, "#000000", rx=14, stroke="none", sw=0, extra='opacity="0.88"'),
         text_el(540, 209 + size * 0.35, title, size, "#ffffff")]
    if cur["kind"] == "line" and t < cur["t1"] + 0.25:
        rows = wrap(cur["text"])
        pages = [rows[i:i + 2] for i in range(0, len(rows), 2)]
        lens = [sum(len(r) for r in p) for p in pages]
        dur = cur["t1"] - cur["t0"] + 0.25
        acc = cur["t0"]
        page = pages[-1]
        for p, n in zip(pages, lens):
            acc += dur * n / sum(lens)
            if t < acc:
                page = p
                break
        for i, r in enumerate(page):
            y = c.sk.get("caption_y", 1548) + i * 74
            s.append(text_el(540, y, r, 58, INK, stroke=INK, sw=13))
            s.append(text_el(540, y, r, 58, "#ffffff" if i else SUB_COL[cur["who"]]))
    first = next((x for x in c.segs if x["kind"] == "line"), None)
    if c.sk.get("hook_text") and first is not None and t < first["t1"] + 0.3:
        s.append(overlays.hook_svg(c.sk["hook_text"], t + 0.25, first["t1"]))
    if cur["kind"] == "line" and cur.get("mid"):
        s.append(overlays.mid_cta_svg(t - cur["t0"], cur["t1"] - cur["t0"], c.sk.get("mid_texts")))
    if c.sk.get("cta"):
        s.append('<g transform="translate(0 %d)">%s</g>' % (c.sk.get("cta_dy", 0), cta_card(c, t)))
    if t > c.total - 0.5:
        s.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0,
                      extra='opacity="%.3f"' % min(1, (t - (c.total - 0.5)) / 0.5)))
    if t < 0.3 and not c.sk.get("hook_text"):
        s.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0, extra='opacity="%.3f"' % (1 - t / 0.3)))
    return "".join(s)


DEFS = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#7cc6f2"/><stop offset="1" stop-color="#d6f0ff"/></linearGradient></defs>')


def frame_svg(c, t):
    st, (cx, cy, sc), cur = state(c, t)
    cast = c.sk["cast"]
    sc_ = c.scene
    w_ = [sc_.back(t), sc_.seat_back(t)]
    if c.standing_v:
        w_.append(person(cast["V"], st["V"], t))
    else:
        w_.append(person(cast["V"], st["V"], t, seated=True, prop=c.sk.get("prop"), hands=sc_.hands))
        w_.append(sc_.seat_front(t))
        w_.append(seated_legs(cast["V"], st["V"]["x"], cast["V"].get("R", 108)))
    w_.append(sc_.front(t))
    if st["A"]["visible"]:
        w_.append(person(cast["A"], st["A"], t))
    if c.sk.get("cart") and st["E"]["visible"]:
        w_.append(cart(st["E"]["x"] + 110, t))
    if st["E"]["visible"]:
        w_.append(person(cast["E"], st["E"], t))
    if st["K"]["visible"]:
        w_.append(person(cast["K"], st["K"], t))
    tr = "translate(%s %s) scale(%.4f) translate(%s %s)" % (f(W / 2), f(H / 2), sc, f(-cx), f(-cy))
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s'
            '<rect width="%d" height="%d" fill="#dfe7ec"/><g transform="%s">%s</g>%s</svg>') % (
        W, H, W, H, DEFS, W, H, tr, "".join(w_), overlay(c, cur, t))


_C = {}


def _init(c):
    _C["c"] = c


def _render(i):
    import cairosvg
    from PIL import Image
    png = cairosvg.svg2png(bytestring=frame_svg(_C["c"], i / FPS).encode("utf-8"), output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


# ============================================================== audio

def ambience(kind, seconds):
    n = int(seconds * tts.SR)
    rng = np.random.default_rng(5)
    if kind == "vehicle":
        return tts.train_ambience(seconds)[:n] * 0.8
    white = rng.standard_normal(n).astype(np.float32)
    t = np.arange(n) / tts.SR
    brown = np.cumsum(white)
    brown -= np.convolve(brown, np.ones(3000) / 3000, mode="same")
    brown /= np.abs(brown).max() + 1e-9
    if kind == "waves":
        env = 0.5 + 0.5 * np.sin(2 * np.pi * t / 6.5) ** 2
        hiss = np.convolve(white, np.ones(6) / 6, mode="same")
        return (brown * 0.05 + hiss * 0.05 * env).astype(np.float32)
    if kind == "cafe":
        murmur = np.convolve(white, np.ones(30) / 30, mode="same") * 0.12
        murmur *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * t + np.sin(2 * np.pi * 0.13 * t))
        out = brown * 0.03 + murmur
        k = np.arange(int(0.15 * tts.SR))
        for st in rng.uniform(1, seconds - 1, int(seconds / 6)):
            i0 = int(st * tts.SR)
            out[i0:i0 + len(k)] += 0.03 * np.sin(2 * np.pi * 2400 * k / tts.SR) * np.exp(-k / (0.03 * tts.SR))
        return out.astype(np.float32)
    if kind == "park":
        out = brown * 0.03
        k = np.arange(int(0.12 * tts.SR))
        for st in rng.uniform(1, seconds - 1, int(seconds / 3)):
            i0 = int(st * tts.SR)
            fr = rng.uniform(2800, 4200)
            out[i0:i0 + len(k)] += 0.025 * np.sin(2 * np.pi * (fr + 800 * np.sin(k / 300)) * k / tts.SR) * \
                np.hanning(len(k))
        return out.astype(np.float32)
    return (brown * 0.035).astype(np.float32)


def mix_audio(c, out):
    n = int(c.total * tts.SR) + tts.SR
    mix = ambience(c.sk.get("ambience", "room"), c.total + 1)[:n].copy()
    mix = np.pad(mix, (0, max(0, n - len(mix))))
    for sg in c.segs:
        if sg["kind"] == "line":
            x, sr = tts.read_wav(sg["wav"])
            x = room(x, sr)
            i0 = int(sg["t0"] * sr)
            mix[i0:i0 + len(x)] += x * 0.95
            if c.sk.get("hook_text") and sg is next(x for x in c.segs if x["kind"] == "line"):
                kk = np.arange(int(0.5 * tts.SR))
                boom = 0.45 * np.sin(2 * np.pi * (60 - 25 * kk / len(kk)) * kk / tts.SR) * np.exp(-kk / (0.12 * tts.SR))
                mix[i0:i0 + len(kk)] += boom.astype(np.float32)
            if sg.get("mid"):
                for dt, fr_ in ((0.0, 880.0), (1.1, 1320.0)):
                    kk = np.arange(int(0.18 * tts.SR))
                    j = int((sg["t0"] + dt) * tts.SR)
                    mix[j:j + len(kk)] += (0.16 * np.sin(2 * np.pi * fr_ * kk / tts.SR) *
                                           np.exp(-kk / (0.04 * tts.SR))).astype(np.float32)
        elif sg["kind"] == "enter":
            mix += tts.footsteps(np.arange(sg["t0"], sg["t0"] + ENTER_DUR * 0.95, 0.33), n)
        elif sg["kind"] == "exit":
            mix += tts.footsteps(np.arange(sg["t0"], sg["t0"] + 2.4, 0.22), n)
    fade = int(0.5 * tts.SR)
    end = int(c.total * tts.SR)
    mix[end - fade:end] *= np.linspace(1, 0, fade)
    mix[end:] = 0
    tts.write_wav(out, mix / max(1.0, np.abs(mix).max() / 0.95))


# ============================================================== main

def prepare(sk):
    mul, gap = 1.0, 0.3
    for _ in range(6):
        wavs = synth(sk, mul)
        segs, total = build_timeline(sk, wavs, gap)
        if total <= MAX_DUR:
            break
        ratio = (MAX_DUR - 0.3) / total
        mul *= max(0.85, ratio)
        gap = 0.22
    return make_ctx(sk, segs, total)


def render(sk, frames=None):
    c = prepare(sk)
    print("[%s] durée %.1f s" % (sk["slug"], c.total), flush=True)
    if frames:
        _init(c)
        from PIL import Image
        paths = []
        for ts in frames:
            p = os.path.join(tts.BUILD, "sk_%s_%s.png" % (sk["slug"], ts))
            Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS))).save(p)
            paths.append(p)
        return paths
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, sk["slug"] + ".mp4")
    audio = os.path.join(audio_dir(sk), "mix.wav")
    mix_audio(c, audio)
    nframes = int(c.total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", audio,
                           "-t", "%.3f" % c.total, "-c:v", "libx264", "-preset", "medium", "-crf", "22",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out],
                          stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(c,)) as pool:
        for buf in pool.imap(_render, range(nframes), chunksize=4):
            ff.stdin.write(buf)
    ff.stdin.close()
    ff.wait()
    print("  -> %s" % out, flush=True)
    return [out]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="*")
    ap.add_argument("--frames", default="")
    ap.add_argument("--serie", type=int, default=1, help="1 = sketches.py, 2 = sketches2.py (sans enfant)")
    a = ap.parse_args()
    global OUT
    sketches = SKETCHES
    if a.serie == 2:
        from sketches2 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-serie2")
    elif a.serie == 3:
        from sketches3 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-serie3")
    elif a.serie == 4:
        from sketches4 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-serie4")
    if a.serie == 10:
        from sketches10 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-gerard-s2")
    if a.serie == 9:
        from sketches9 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-sketchs-en")
    if a.serie == 8:
        from sketches8 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-rift-ugc")
    if a.serie == 7:
        from sketches7 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-sketchs-influenceur")
    if a.serie == 6:
        from sketches6 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-gerard-bonus")
    if a.serie == 5:
        from sketches5 import SKETCHES as sketches
        OUT = os.path.join(HERE, "videos-gerard")
    for sk in sketches:
        if a.only and not any(sk["slug"].startswith(o) for o in a.only):
            continue
        for p in render(sk, a.frames.split(",") if a.frames else None):
            print(p)


if __name__ == "__main__":
    sys.exit(main())
