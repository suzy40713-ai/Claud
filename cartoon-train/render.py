# -*- coding: utf-8 -*-
"""Rendu du sketch animé (SVG -> PNG via cairosvg -> MP4 via ffmpeg).

Usage : python3 render.py [--preview SECONDS] [--frames a,b,c]
"""
import argparse
import io
import math
import os
import subprocess
import sys
from multiprocessing import Pool
from xml.sax.saxutils import escape

import numpy as np

from script import LINES, TITLE
import tts

W, H = 1080, 1920
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = tts.BUILD
INK = "#1b1b1b"
LW = 7  # épaisseur des contours

# ---------------------------------------------------------------- utilitaires


def f(v):
    return "%.1f" % v


def ease(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def circle(x, y, r, fill, stroke=INK, sw=LW):
    return '<circle cx="%s" cy="%s" r="%s" fill="%s" stroke="%s" stroke-width="%s"/>' % (
        f(x), f(y), f(r), fill, stroke, sw)


def ellipse(x, y, rx, ry, fill, stroke=INK, sw=LW, extra=""):
    return '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="%s" stroke="%s" stroke-width="%s" %s/>' % (
        f(x), f(y), f(rx), f(ry), fill, stroke, sw, extra)


def rect(x, y, w, h, fill, rx=0, stroke=INK, sw=LW, extra=""):
    return '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s" stroke-width="%s" %s/>' % (
        f(x), f(y), f(w), f(h), f(rx), fill, stroke, sw, extra)


def line(x1, y1, x2, y2, sw=LW, stroke=INK):
    return '<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" stroke-linecap="round"/>' % (
        f(x1), f(y1), f(x2), f(y2), stroke, sw)


def path(d, fill="none", stroke=INK, sw=LW, extra=""):
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round" stroke-linecap="round" %s/>' % (
        d, fill, stroke, sw, extra)


# ---------------------------------------------------------------- décor

def landscape(t):
    """Paysage qui défile derrière les fenêtres (coordonnées monde)."""
    s = []
    s.append(rect(-700, 520, 2600, 420, "url(#sky)", stroke="none", sw=0))
    # nuages lents
    for i, (bx, by, sc) in enumerate([(0, 600, 1.0), (700, 580, 0.8), (1400, 620, 1.2), (2000, 590, 0.9)]):
        x = (bx - 25 * t) % 2600 - 700
        for dx, dy, r in ((0, 0, 34), (36, -14, 40), (76, 0, 32)):
            s.append(circle(x + dx * sc, by + dy * sc, r * sc, "#ffffff", stroke="none", sw=0))
    # collines lointaines
    for bx, r, col in [(0, 260, "#9ccf8a"), (520, 320, "#8cc47a"), (1100, 280, "#9ccf8a"), (1700, 340, "#8cc47a"),
                       (2250, 300, "#9ccf8a")]:
        x = (bx - 45 * t) % 2600 - 700
        s.append(ellipse(x, 900, r, 170, col, stroke="none", sw=0))
    # prairie
    s.append(rect(-700, 820, 2600, 140, "#7bbf5e", stroke="none", sw=0))
    # arbres
    for bx in (100, 520, 980, 1500, 1900, 2300):
        x = (bx - 260 * t) % 2600 - 700
        s.append(rect(x - 9, 790, 18, 60, "#7a5233", stroke=INK, sw=4))
        s.append(circle(x, 770, 44, "#3f9b4b", stroke=INK, sw=4))
    # vaches
    for bx in (300, 1350, 2050):
        x = (bx - 210 * t) % 2600 - 700
        s.append(cow(x, 860))
    # poteaux caténaire (rapides)
    for bx in range(0, 2600, 760):
        x = (bx - 700 * t) % 2600 - 700
        s.append(rect(x - 7, 520, 14, 440, "#5b5f66", stroke="none", sw=0))
    s.append(line(-700, 560, 1900, 560, sw=3, stroke="#5b5f66"))
    return "".join(s)


def cow(x, y):
    s = []
    for lx in (-30, -14, 14, 30):
        s.append(line(x + lx, y + 10, x + lx, y + 38, sw=6))
    s.append(ellipse(x, y, 46, 26, "#ffffff", sw=4))
    s.append(ellipse(x - 12, y - 6, 12, 9, INK, stroke="none", sw=0))
    s.append(ellipse(x + 18, y + 6, 10, 8, INK, stroke="none", sw=0))
    s.append(ellipse(x + 52, y - 14, 16, 13, "#ffffff", sw=4))
    s.append(ellipse(x + 60, y - 9, 8, 6, "#f4a6b0", sw=3))
    s.append(line(x + 44, y - 28, x + 40, y - 36, sw=4))
    return "".join(s)


def rrect_d(x, y, w, h, r):
    return ("M %s %s H %s A %s %s 0 0 1 %s %s V %s A %s %s 0 0 1 %s %s H %s A %s %s 0 0 1 %s %s V %s "
            "A %s %s 0 0 1 %s %s Z " % (f(x + r), f(y), f(x + w - r), r, r, f(x + w), f(y + r), f(y + h - r), r, r,
                                       f(x + w - r), f(y + h), f(x + r), r, r, f(x), f(y + h - r), f(y + r), r, r,
                                       f(x + r), f(y)))


WINDOWS = [(-560, 540, 400, 380), (-80, 540, 420, 380), (600, 540, 440, 380), (1180, 540, 420, 380)]


def background(t):
    s = [landscape(t)]
    # mur percé par les fenêtres
    holes = "".join(rrect_d(x, y, w, h, 46) for (x, y, w, h) in WINDOWS)
    s.append(path("M -800 0 H 1900 V 1500 H -800 Z " + holes, fill="#dfe7ec", stroke="none", sw=0,
                  extra='fill-rule="evenodd"'))
    for (x, y, w, h) in WINDOWS:
        s.append(rect(x, y, w, h, "none", rx=46, stroke="#b9c3ca", sw=22))
        s.append(rect(x - 11, y - 11, w + 22, h + 22, "none", rx=56, stroke=INK, sw=LW))
        s.append(rect(x + 11, y + 11, w - 22, h - 22, "none", rx=36, stroke=INK, sw=4))
        # reflet
        s.append(path("M %s %s l 60 -60 M %s %s l 90 -90" % (f(x + 40), f(y + 140), f(x + 50), f(y + 200)),
                      stroke="#ffffff", sw=10, extra='opacity="0.55"'))
    # bandeau décoratif sous les fenêtres
    s.append(rect(-800, 965, 2700, 34, "#2a8c9a", stroke="none", sw=0))
    s.append(rect(-800, 1003, 2700, 10, "#f2b134", stroke="none", sw=0))
    # plafond + porte-bagages
    s.append(rect(-800, 0, 2700, 300, "#eeebe4", stroke="none", sw=0))
    for lx in (-400, 140, 680, 1220):
        s.append(ellipse(lx + 130, 120, 120, 26, "#fffbe8", sw=5))
    s.append(path("M -800 300 L 1900 300 L 1900 395 L -800 395 Z", fill="#c7ced4"))
    for k in range(-800, 1900, 46):
        s.append(line(k, 330, k, 390, sw=4, stroke="#9aa4ab"))
    s.append(rect(-800, 388, 2700, 20, "#8d979e", stroke=INK, sw=5))
    # valise sur le porte-bagages
    s.append(rect(700, 210, 230, 110, "#d0473b", rx=18))
    s.append(rect(780, 186, 70, 30, "none", rx=10))
    s.append(rect(100, 230, 180, 90, "#4a6fa5", rx=16))
    # sol
    s.append(rect(-800, 1500, 2700, 420, "#a7b4bf", stroke="none", sw=0))
    s.append(line(-800, 1500, 1900, 1500, sw=LW))
    s.append(path("M 60 1920 L 260 1500 L 500 1500 L 560 1920 Z", fill="#8c9cab", stroke="none", sw=0))
    return "".join(s)


def seat_back(x, w):
    s = []
    s.append(rect(x, 780, w, 520, "#2f6f8f", rx=44))
    s.append(rect(x + 18, 792, w - 36, 92, "#f3f3f0", rx=26, sw=5))
    s.append(path("M %s 950 L %s 950" % (f(x + 34), f(x + w - 34)), stroke="#255a74", sw=6))
    return "".join(s)


def seat_front(x, w):
    s = []
    s.append(rect(x - 6, 1260, w + 12, 100, "#285f7b", rx=30))
    s.append(rect(x + w * 0.5 - 50, 1360, 100, 140, "#6c757d", rx=8))
    return "".join(s)


# ---------------------------------------------------------------- personnages

EXPR = {
    #          brows (inner, outer)    mouth curve  lids
    "neutral": ((0.00, 0.00), (0.00, 0.00), 0.00, 0.05),
    "smile": ((-0.06, -0.06), (-0.06, -0.06), 0.12, 0.00),
    "smug": ((0.03, 0.03), (-0.13, -0.10), 0.07, 0.35),
    "annoyed": ((0.06, 0.05), (0.06, 0.05), -0.03, 0.48),
    "angry": ((0.13, -0.05), (0.13, -0.05), -0.10, 0.18),
    "shocked": ((-0.17, -0.15), (-0.17, -0.15), 0.0, 0.00),
    "sad": ((-0.12, 0.06), (-0.12, 0.06), -0.10, 0.15),
}


def eye_lid(ex, ey, re, amount, skin):
    if amount <= 0.01:
        return ""
    if amount >= 0.98:
        return (circle(ex, ey, re + 1, skin, stroke="none", sw=0) + circle(ex, ey, re, "none") +
                path("M %s %s Q %s %s %s %s" % (f(ex - re * 0.8), f(ey + re * 0.1), f(ex), f(ey + re * 0.55),
                                                 f(ex + re * 0.8), f(ey + re * 0.1)), sw=6))
    d = re - 2 * re * amount  # distance centre -> corde (vers le haut)
    hw = math.sqrt(max(re * re - d * d, 0))
    large = 1 if amount > 0.5 else 0
    return path("M %s %s A %s %s 0 %d 1 %s %s Z" % (f(ex - hw), f(ey - d), f(re), f(re), large, f(ex + hw), f(ey - d)),
                fill=skin, sw=6)


def head(x, hy, R, skin, expr, mouth, blink, look, back="", front="", after="", mustache=None,
         glasses=False, blush=False, mouth_color="#5a1a1a"):
    bl, br, curve, lids = EXPR[expr]
    s = [back]
    for sx in (-1, 1):
        s.append(circle(x + sx * R * 0.96, hy + R * 0.14, R * 0.2, skin))
    s.append(circle(x, hy, R, skin))
    s.append(front)
    if blush:
        for sx in (-1, 1):
            s.append(ellipse(x + sx * R * 0.55, hy + R * 0.42, R * 0.15, R * 0.08, "#f29a9a", stroke="none",
                             sw=0, extra='opacity="0.7"'))
    re = R * 0.3
    ey = hy - R * 0.04
    pr = re * (0.18 if expr == "shocked" else 0.27)
    for sx, brow in ((-1, bl), (1, br)):
        ex = x + sx * R * 0.31
        s.append(circle(ex, ey, re, "#ffffff", sw=6))
        px = ex + look[0] * re * 0.52
        py = ey + look[1] * re * 0.45
        s.append(circle(px, py, pr, INK, stroke="none", sw=0))
        s.append(eye_lid(ex, ey, re, 1.0 if blink else lids, skin))
        by = ey - re - R * 0.13
        inner, outer = brow
        s.append(line(ex - sx * re * 0.55, by + inner * R, ex + sx * re * 0.9, by + outer * R, sw=R * 0.075))
        if glasses:
            s.append(circle(ex, ey, re * 1.12, "none", sw=5))
    if glasses:
        s.append(line(x - R * 0.31 + re * 1.12, ey, x + R * 0.31 - re * 1.12, ey, sw=5))
    my = hy + R * 0.56
    if mouth == 0:
        if expr == "shocked":
            s.append(ellipse(x, my, R * 0.07, R * 0.08, mouth_color, sw=5))
        else:
            c = curve * R
            skew = R * 0.05 if expr == "smug" else 0
            s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.17), f(my - c * 0.3 + skew), f(x), f(my + c),
                                                     f(x + R * 0.17), f(my - c * 0.3 - skew)), sw=6))
    else:
        rx, ry = (R * 0.13, R * 0.08) if mouth == 1 else (R * 0.16, R * 0.15)
        if expr == "smile":
            ry *= 1.1
        s.append(ellipse(x, my, rx, ry, mouth_color, sw=5))
        if mouth == 2:
            s.append(ellipse(x, my + ry * 0.5, rx * 0.55, ry * 0.32, "#e0607a", stroke="none", sw=0))
    if mustache:
        mx, myy = x, hy + R * 0.4
        s.append(path("M %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
            f(mx - R * 0.34), f(myy + R * 0.1), f(mx - R * 0.2), f(myy - R * 0.14), f(mx), f(myy - R * 0.02),
            f(mx + R * 0.2), f(myy - R * 0.14), f(mx + R * 0.34), f(myy + R * 0.1),
            f(mx), f(myy + R * 0.02), f(mx - R * 0.34), f(myy + R * 0.1)), fill=mustache, sw=5))
    s.append(after)
    return "".join(s)


def arm(sh, el, ha, R, skin, sleeve=None, sleeve_len=0.45):
    s = [path("M %s %s Q %s %s %s %s" % (f(sh[0]), f(sh[1]), f(el[0]), f(el[1]), f(ha[0]), f(ha[1])),
              sw=R * 0.13)]
    if sleeve:
        # manche courte : segment épais de la couleur du haut
        sx = lerp(sh[0], el[0], sleeve_len * 1.6)
        sy = lerp(sh[1], el[1], sleeve_len * 1.6)
        s.append(line(sh[0], sh[1], sx, sy, sw=R * 0.42))
        s.append(line(sh[0], sh[1], sx, sy, sw=R * 0.42 - 2 * LW, stroke=sleeve))
    s.append(circle(ha[0], ha[1], R * 0.15, skin, sw=6))
    return "".join(s)


def arm_pose(pose, side, sx, sy, R, t, hip_y):
    """Renvoie (coude, main) pour un bras. side = -1 (gauche écran) ou +1 (droite écran)."""
    osc = math.sin(t * 7.0)
    if pose == "gesture" and side == 1:
        return (sx + R * 0.75, sy + R * 1.1), (sx + R * 1.35 + osc * R * 0.12, sy + R * 0.55 + osc * R * 0.1)
    if pose == "point" and side == 1:
        return (sx + R * 0.9, sy + R * 0.35 + osc * 3), (sx + R * 1.85, sy + R * 0.1 + osc * 3)
    if pose == "up":
        return (sx + side * R * 0.75, sy - R * 0.45), (sx + side * R * 0.95 + osc * 4, sy - R * 1.35)
    if pose == "hips":
        return (sx + side * R * 0.85, sy + R * 1.0), (sx - side * R * 0.05, hip_y - R * 0.25)
    if pose == "wave" and side == 1:
        return (sx + R * 0.7, sy + R * 0.4), (sx + R * 0.85 + osc * R * 0.25, sy - R * 0.75)
    if pose == "machine":
        return (sx + side * R * 0.25, sy + R * 1.2), (sx - side * R * 0.45, sy + R * 1.65)
    return (sx + side * R * 0.18, sy + R * 1.2), (sx + side * R * 0.12, sy + R * 2.3)


def legs(x, hip_y, foot_y, R, color, shoe, walk, bare_below=None, skin=None):
    s = []
    for side in (-1, 1):
        sw_ = math.sin(walk) * side * R * 0.3 if walk is not None else 0
        lx = x + side * R * 0.38
        fx = lx + sw_
        if bare_below is not None:
            ky = bare_below
            s.append(line(lx, hip_y, lx + sw_ * 0.4, ky, sw=R * 0.42))
            s.append(line(lx, hip_y, lx + sw_ * 0.4, ky, sw=R * 0.42 - 2 * LW, stroke=color))
            s.append(line(lx + sw_ * 0.4, ky, fx, foot_y, sw=R * 0.12))
            s.append(line(fx, foot_y - R * 0.3, fx, foot_y - R * 0.1, sw=R * 0.2, stroke="#ffffff"))
        else:
            s.append(line(lx, hip_y, fx, foot_y, sw=R * 0.34))
            s.append(line(lx, hip_y, fx, foot_y, sw=R * 0.34 - 2 * LW, stroke=color))
        s.append(ellipse(fx + side * R * 0.1, foot_y + R * 0.05, R * 0.27, R * 0.13, shoe))
    return "".join(s)


def torso(x, sy, hy2, R, color, wtop=0.95, wbot=1.0):
    d = "M %s %s Q %s %s %s %s L %s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z" % (
        f(x - R * wtop), f(sy + R * 0.35), f(x - R * wtop), f(sy), f(x - R * 0.5), f(sy - R * 0.05),
        f(x + R * 0.5), f(sy - R * 0.05), f(x + R * wtop), f(sy), f(x + R * wtop), f(sy + R * 0.35),
        f(x + R * wbot), f(hy2), f(x), f(hy2 + R * 0.08), f(x - R * wbot), f(hy2))
    return path(d, fill=color)


# --- Gérard
def gerard(st, t):
    x, R = st["x"], 110
    bob = abs(math.sin(st["walk"])) * -12 if st["walk"] is not None else math.sin(t * 2.1) * 2
    hy = 900 + bob + st.get("hop", 0)
    sy, hip, foot = hy + R * 1.02, hy + R * 3.6, 1585 + bob * 0.3
    skin, shirt = "#f0c29a", "#f07f2e"
    s = [legs(x, hip, foot, R, "#c9b48a", "#6b4b33", st["walk"], bare_below=hip + R * 0.95)]
    s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R), f(hip - 10), f(x + R), f(hip - 10),
                                                       f(x + R * 1.05), f(hip + R * 0.9), f(x - R * 1.05),
                                                       f(hip + R * 0.9)), fill="#c9b48a"))
    s.append(line(x, hip + R * 0.1, x, hip + R * 0.85, sw=5))
    s.append(torso(x, sy, hip, R, shirt))
    s.append(path("M %s %s L %s %s L %s %s Z M %s %s L %s %s L %s %s Z" % (
        f(x - R * 0.45), f(sy - R * 0.04), f(x), f(sy + R * 0.4), f(x - R * 0.05), f(sy - R * 0.04),
        f(x + R * 0.45), f(sy - R * 0.04), f(x), f(sy + R * 0.4), f(x + R * 0.05), f(sy - R * 0.04)),
        fill="#ffffff", sw=5))
    for k in range(3):
        s.append(circle(x, sy + R * (0.55 + k * 0.28), 5, INK, stroke="none", sw=0))
    pose = st["pose"]
    for side in (-1, 1):
        shp = (x + side * R * 0.88, sy + R * 0.25)
        if side == -1 and st.get("hold"):
            el, ha = (shp[0] - R * 0.3, shp[1] + R * 1.25), st["hold"]
        elif side == 1 and st.get("drag"):
            el, ha = (shp[0] + R * 0.6, shp[1] + R * 0.9), (shp[0] + R * 1.15, shp[1] + R * 1.6)
        else:
            el, ha = arm_pose(pose, side, shp[0], shp[1], R, t, hip)
        s.append(arm(shp, el, ha, R, skin, sleeve=shirt))
        if pose == "point" and side == 1:
            s.append(line(ha[0], ha[1], ha[0] + R * 0.32, ha[1] - R * 0.05, sw=R * 0.1))
    # cheveux : touffes latérales + mèche rabattue
    hair = "#6e5d4e"
    front = "".join(path("M %s %s Q %s %s %s %s Q %s %s %s %s" % (
        f(x + sd * R * 0.62), f(hy - R * 0.7), f(x + sd * R * 1.12), f(hy - R * 0.55), f(x + sd * R * 0.98),
        f(hy + R * 0.05), f(x + sd * R * 0.82), f(hy - R * 0.25), f(x + sd * R * 0.62), f(hy - R * 0.7)),
        fill=hair, sw=5) for sd in (-1, 1))
    front += path("M %s %s Q %s %s %s %s" % (f(x - R * 0.55), f(hy - R * 0.78), f(x - R * 0.1), f(hy - R * 1.12),
                                            f(x + R * 0.45), f(hy - R * 0.82)), stroke=hair, sw=9)
    front += path("M %s %s Q %s %s %s %s" % (f(x - R * 0.35), f(hy - R * 0.9), f(x + R * 0.05), f(hy - R * 1.08),
                                            f(x + R * 0.5), f(hy - R * 0.7)), stroke=hair, sw=7)
    s.append(head(x, hy, R, skin, st["expr"], st["mouth"], st["blink"], st["look"], front=front,
                  mustache="#5a4a3c"))
    return "".join(s)


# --- Inès (assise)
def ines(st, t):
    x, R = 932, 100
    hy = 905 + math.sin(t * 1.7) * 2 + st.get("hop", 0)
    sy, hip = hy + R * 1.02, 1262
    skin, top = "#8d5a3b", "#f2b134"
    s = []
    # cheveux arrière (afro puff)
    back = "".join(circle(x + dx * R, hy - R * 0.85 + dy * R, r * R, "#241a16", sw=6)
                   for dx, dy, r in ((-0.35, 0.05, 0.42), (0.35, 0.05, 0.42), (0, -0.25, 0.5), (-0.55, 0.45, 0.32),
                                     (0.55, 0.45, 0.32)))
    back += "".join(circle(x + dx * R, hy - R * 0.85 + dy * R, r * R, "#241a16", stroke="none", sw=0)
                    for dx, dy, r in ((-0.35, 0.05, 0.42), (0.35, 0.05, 0.42), (0, -0.25, 0.5)))
    s.append(torso(x, sy, hip, R, top, wtop=0.98, wbot=1.05))
    # poche kangourou + cordons
    s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.55), f(hip - R * 0.2), f(x - R * 0.4),
                                                       f(hip - R * 0.75), f(x + R * 0.4), f(hip - R * 0.75),
                                                       f(x + R * 0.55), f(hip - R * 0.2)), fill="#e39f22", sw=5))
    s.append(line(x - R * 0.18, sy + R * 0.05, x - R * 0.22, sy + R * 0.7, sw=5))
    s.append(line(x + R * 0.18, sy + R * 0.05, x + R * 0.22, sy + R * 0.7, sw=5))
    # casque autour du cou
    s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 0.62), f(sy - R * 0.05), f(x), f(sy + R * 0.45),
                                            f(x + R * 0.62), f(sy - R * 0.05)), stroke="#d23a3a", sw=16))
    for sd in (-1, 1):
        s.append(ellipse(x + sd * R * 0.62, sy - R * 0.08, R * 0.16, R * 0.2, "#d23a3a", sw=5))
    # bras + téléphone
    pose = st["pose"]
    for side in (-1, 1):
        shp = (x + side * R * 0.9, sy + R * 0.25)
        if pose == "wave" and side == 1:
            el, ha = arm_pose("wave", 1, shp[0], shp[1], R, t, hip)
        else:
            el, ha = (shp[0] + side * R * 0.22, shp[1] + R * 1.45), (x + side * R * 0.32, sy + R * 1.82)
        s.append(arm(shp, el, ha, R, skin, sleeve=top, sleeve_len=1.0))
    if pose != "wave" or True:
        px, py = x - R * 0.05 if pose == "wave" else x, sy + R * 1.72
        s.append(rect(px - R * 0.36, py - R * 0.42, R * 0.72, R * 0.5, "#2b2f36", rx=10, sw=5))
        s.append(rect(px - R * 0.29, py - R * 0.36, R * 0.58, R * 0.38, "#5fb4e6", rx=6, stroke="none", sw=0))
    front = path("M %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.98), f(hy - R * 0.1), f(x - R * 0.9), f(hy - R * 1.08), f(x), f(hy - R * 1.05),
        f(x + R * 0.9), f(hy - R * 1.08), f(x + R * 0.98), f(hy - R * 0.1)), fill="#241a16", sw=6)
    front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.99), f(hy - R * 0.05), f(R), f(R), f(x + R * 0.99), f(hy - R * 0.05),
        f(x + R * 0.7), f(hy - R * 0.62), f(x), f(hy - R * 0.66),
        f(x - R * 0.7), f(hy - R * 0.62), f(x - R * 0.99), f(hy - R * 0.05)), fill="#241a16", sw=6)
    after = "".join(circle(x + sd * R * 0.98, hy + R * 0.42, R * 0.11, "none", stroke="#e8b53a", sw=5)
                    for sd in (-1, 1))
    s.append(head(x, hy, R, skin, st["expr"], st["mouth"], st["blink"], st["look"], back=back, front=front,
                  after=after, mouth_color="#4a1414"))
    return "".join(s)


def ines_legs():
    x, R = 932, 100
    s = []
    for side in (-1, 1):
        lx = x + side * R * 0.4
        s.append(line(lx, 1300, lx, 1480, sw=R * 0.36))
        s.append(line(lx, 1300, lx, 1480, sw=R * 0.36 - 2 * LW, stroke="#3b5ba5"))
        s.append(ellipse(lx + side * R * 0.08, 1490, R * 0.3, R * 0.14, "#f4f4f4"))
    s.append(rect(x - R * 1.05, 1255, R * 2.1, 70, "#3b5ba5", rx=26))
    return "".join(s)


# --- Lola
def lola(st, t):
    x, R = st["x"], 80
    bob = abs(math.sin(st["walk"])) * -10 if st["walk"] is not None else 0
    hop = st.get("hop", 0)
    hy = 1290 + bob + hop
    sy, hip, foot = hy + R * 1.0, hy + R * 3.0, 1690 + bob * 0.3
    skin, dress = "#f6d2b5", "#8e5bd6"
    s = [legs(x, hip, foot, R, skin, "#d23a6a", st["walk"])]
    s.append(path("M %s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.7), f(sy + R * 0.1), f(x), f(sy - R * 0.15), f(x + R * 0.7), f(sy + R * 0.1),
        f(x + R * 1.25), f(hip + R * 0.25), f(x), f(hip + R * 0.45), f(x - R * 1.25), f(hip + R * 0.25)),
        fill=dress))
    s.append(path("M %s %s Q %s %s %s %s" % (f(x - R * 1.0), f(hip), f(x), f(hip + R * 0.2), f(x + R * 1.0),
                                            f(hip)), stroke="#ffffff", sw=8))
    for side in (-1, 1):
        shp = (x + side * R * 0.65, sy + R * 0.2)
        if side == 1 and st.get("hold"):
            el, ha = (shp[0] + R * 0.45, shp[1] - R * 0.35), st["hold"]
        elif st.get("stomp"):
            el, ha = (shp[0] + side * R * 0.4, shp[1] + R * 0.8), (shp[0] + side * R * 0.3, shp[1] + R * 1.5)
        else:
            el, ha = (shp[0] + side * R * 0.2, shp[1] + R * 0.9), (shp[0] + side * R * 0.2, shp[1] + R * 1.7)
        s.append(arm(shp, el, ha, R, skin))
    hair = "#e0742c"
    back = "".join(circle(x + sd * R * 1.15, hy - R * 0.35, R * 0.38, hair, sw=6) for sd in (-1, 1))
    back += "".join(rect(x + sd * R * 0.95 - R * 0.1, hy - R * 0.5, R * 0.2, R * 0.22, "#ffd23f", rx=6, sw=4)
                    for sd in (-1, 1))
    front = path("M %s %s A %s %s 0 0 1 %s %s Q %s %s %s %s Q %s %s %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.99), f(hy - R * 0.05), f(R), f(R), f(x + R * 0.99), f(hy - R * 0.05),
        f(x + R * 0.8), f(hy - R * 0.5), f(x + R * 0.3), f(hy - R * 0.52),
        f(x), f(hy - R * 0.72), f(x - R * 0.3), f(hy - R * 0.52),
        f(x - R * 0.8), f(hy - R * 0.5), f(x - R * 0.99), f(hy - R * 0.05)), fill=hair, sw=6)
    s.append(head(x, hy, R, skin, st["expr"], st["mouth"], st["blink"], st["look"], back=back, front=front,
                  blush=True))
    return "".join(s)


# --- Contrôleur
def controleur(st, t):
    x, R = st["x"], 108
    bob = abs(math.sin(st["walk"])) * -12 if st["walk"] is not None else math.sin(t * 1.9 + 1) * 2
    hy = 895 + bob
    sy, hip, foot = hy + R * 1.02, hy + R * 3.7, 1590 + bob * 0.3
    skin, jacket = "#e8b48f", "#1f2f55"
    s = [legs(x, hip, foot, R, "#1a2442", INK, st["walk"])]
    s.append(torso(x, sy, hip + R * 0.25, R, jacket))
    s.append(path("M %s %s L %s %s L %s %s Z" % (f(x - R * 0.32), f(sy - R * 0.04), f(x), f(sy + R * 0.55),
                                               f(x + R * 0.32), f(sy - R * 0.04)), fill="#ffffff", sw=5))
    s.append(path("M %s %s L %s %s L %s %s L %s %s Z" % (f(x - R * 0.07), f(sy + R * 0.08), f(x + R * 0.07),
                                                       f(sy + R * 0.08), f(x + R * 0.1), f(sy + R * 0.5),
                                                       f(x - R * 0.1), f(sy + R * 0.5)), fill="#c8323c", sw=4))
    for k in range(3):
        s.append(circle(x + R * 0.18, sy + R * (0.8 + k * 0.42), 7, "#f2c23a", sw=3))
    s.append(rect(x - R * 0.72, sy + R * 0.55, R * 0.34, R * 0.22, "#f2c23a", rx=4, sw=4))
    # sacoche / terminal
    s.append(line(x - R * 0.7, sy + R * 0.1, x + R * 0.75, hip - R * 0.1, sw=10, stroke="#3a2a1f"))
    pose = st["pose"]
    for side in (-1, 1):
        shp = (x + side * R * 0.88, sy + R * 0.25)
        el, ha = arm_pose(pose if not (pose == "gesture" and side == -1) else "machine", side, shp[0], shp[1], R,
                          t, hip)
        if pose == "machine" or (pose == "gesture" and side == -1):
            el, ha = arm_pose("machine", side, shp[0], shp[1], R, t, hip)
        s.append(arm(shp, el, ha, R, skin, sleeve=jacket, sleeve_len=1.0))
    if pose in ("machine", "gesture"):
        mx, my = x, sy + R * 1.5
        s.append(rect(mx - R * 0.3, my - R * 0.42, R * 0.6, R * 0.62, "#3c4046", rx=10, sw=5))
        s.append(rect(mx - R * 0.22, my - R * 0.34, R * 0.44, R * 0.2, "#9be37a", rx=4, stroke="none", sw=0))
    hair = "#2b211c"
    front = "".join(rect(x + sd * R * 0.98 - R * 0.09, hy - R * 0.55, R * 0.18, R * 0.5, hair, rx=8, sw=5)
                    for sd in (-1, 1))
    after = (path("M %s %s Q %s %s %s %s L %s %s Q %s %s %s %s Z" % (
        f(x - R * 0.95), f(hy - R * 0.55), f(x - R * 0.9), f(hy - R * 1.3), f(x), f(hy - R * 1.32),
        f(x + R * 0.95), f(hy - R * 0.55), f(x + R * 0.9), f(hy - R * 1.3), f(x), f(hy - R * 1.32)),
        fill=jacket, sw=6) +
        rect(x - R * 0.97, hy - R * 0.72, R * 1.94, R * 0.2, "#c8323c", rx=6, sw=5) +
        path("M %s %s Q %s %s %s %s" % (f(x - R * 0.85), f(hy - R * 0.52), f(x), f(hy - R * 0.25),
                                        f(x + R * 0.85), f(hy - R * 0.52)), fill="#111a33", sw=6) +
        circle(x, hy - R * 0.95, R * 0.12, "#f2c23a", sw=4))
    # la casquette doit passer au-dessus des sourcils : dessinée en « after », sourcils masqués via look
    s.append(head(x, hy + R * 0.08, R, skin, st["expr"], st["mouth"], st["blink"], st["look"], front=front,
                  glasses=True))
    s.append(after)
    return "".join(s)


# ---------------------------------------------------------------- timeline

LEAD_IN, GAP, END_HOLD = 1.0, 0.32, 1.8
ENTER_DUR, EXIT_DUR = 1.7, 2.8
POS = {"G": 330, "L": 150, "C": 150}           # avant l'arrivée du contrôleur
POS2 = {"G": 410, "L": 610}                       # après (ils se décalent pour lui laisser la place)
HEAD = {"G": (330, 900), "I": (932, 905), "L": (150, 1290), "C": (150, 900)}
SHOTS = {
    "wide": (540, 960, 1.0), "G": (360, 1010, 1.7), "I": (905, 990, 1.7), "L": (505, 1330, 1.85),
    "C": (230, 1000, 1.6), "GI": (560, 1000, 1.12), "GC": (260, 1020, 1.38),
}
ADDRESSEE = {"G": "I", "I": "G", "L": "G", "C": "G"}


def build_timeline(wavs):
    segs = []
    t = LEAD_IN
    moods = {"G": "smile", "I": "neutral", "L": "neutral", "C": "neutral"}
    for i, (who, text, mood, shot) in enumerate(LINES):
        if who == "@ENTER_C":
            segs.append(dict(kind="enter", t0=t, t1=t + ENTER_DUR, shot=shot, moods=dict(moods)))
            t += ENTER_DUR
            continue
        if who == "@EXIT":
            segs.append(dict(kind="exit", t0=t, t1=t + EXIT_DUR, shot=shot, moods=dict(moods)))
            t += EXIT_DUR
            continue
        moods.update(mood)
        x, sr = tts.read_wav(wavs[i])
        dur = len(x) / sr
        hop = sr // FPS
        env = np.array([np.sqrt(np.mean(x[k * hop:(k + 1) * hop] ** 2) + 1e-12)
                        for k in range(int(math.ceil(len(x) / hop)))])
        env = env / (np.percentile(env, 90) + 1e-9)
        addressee = ADDRESSEE[who]
        if who == "G" and ("Monsieur" in text or "Mais ma fille" in text or "Aucune" in text or "incroyable" in text):
            addressee = "C"
        if who == "I" and "Merci monsieur" in text:
            addressee = "CAM"
        segs.append(dict(kind="line", t0=t, t1=t + dur, who=who, text=text, wav=wavs[i], env=env,
                         shot=shot, moods=dict(moods), to=addressee))
        t += dur + (0.55 if who == "I" else GAP)
    total = t + END_HOLD
    return segs, total


def look_vec(a, b):
    if b == "CAM":
        return (0.0, 0.1)
    if b not in HEAD:
        return (0.0, 0.0)
    ax, ay = HEAD[a]
    bx, by = HEAD[b]
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy) + 1e-9
    return (dx / n, dy / n * 0.8)


def blink_at(t, off):
    p = 3.3 + off
    return ((t + off * 1.7) % p) < 0.13


def scene_state(segs, total, t):
    """Calcule l'état de tous les personnages au temps t."""
    cur, prev = None, None
    for sg in segs:
        if sg["t0"] <= t:
            cur = sg
    if cur is None:
        cur = dict(kind="intro", t0=0, t1=LEAD_IN, shot="wide",
                   moods={"G": "smile", "I": "neutral", "L": "neutral", "C": "neutral"})
    moods = cur["moods"]
    enter = next(s for s in segs if s["kind"] == "enter")
    exit_ = next(s for s in segs if s["kind"] == "exit")

    speaking = cur["kind"] == "line" and t < cur["t1"]
    who = cur.get("who") if cur["kind"] == "line" else None
    mouth = 0
    if speaking:
        k = int((t - cur["t0"]) * FPS)
        e = cur["env"][min(k, len(cur["env"]) - 1)]
        mouth = 0 if e < 0.25 else (1 if e < 0.7 else 2)

    # positions (entrée / sortie)
    gx, lx, cx = POS["G"], POS["L"], POS["C"]
    walk = {"G": None, "L": None, "C": None}
    c_visible = t >= enter["t0"]
    if t >= enter["t0"]:
        u = (t - enter["t0"]) / ENTER_DUR
        cx = lerp(-330, POS["C"], ease(u))
        gx = lerp(POS["G"], POS2["G"], ease(u * 1.3))
        lx = lerp(POS["L"], POS2["L"], ease((u - 0.1) * 1.2))
        if u < 0.95:
            walk["C"] = (t - enter["t0"]) * 9
        if 0.05 < u < 0.8:
            walk["L"] = (t - enter["t0"]) * 11
        if u < 0.7:
            walk["G"] = (t - enter["t0"]) * 9
    if t >= exit_["t0"]:
        u = t - exit_["t0"]
        cx = POS["C"] - 1400 * ease(u / 2.0)
        gx = POS2["G"] - 1450 * ease((u - 0.35) / 2.1)
        lx = POS2["L"] - 1500 * ease((u - 0.55) / 2.1)
        walk["C"] = u * 9 if u < 2.0 else None
        walk["G"] = (u - 0.35) * 9 if 0.35 < u < 2.45 else None
        walk["L"] = (u - 0.55) * 11 if 0.55 < u < 2.65 else None
    HEAD["G"] = (gx, 900)
    HEAD["L"] = (lx, 1290)
    HEAD["C"] = (cx, 900)

    st = {}
    for c in "GILC":
        st[c] = dict(expr=moods.get(c, "neutral"), mouth=mouth if (speaking and who == c) else 0,
                     blink=blink_at(t, "GILC".index(c) * 0.37), walk=walk.get(c), pose="down")
    # regards
    focus = who if who else ("C" if cur["kind"] in ("enter",) else None)
    for c in "GILC":
        if speaking and c == who:
            st[c]["look"] = look_vec(c, cur["to"])
        elif focus and c != focus:
            st[c]["look"] = look_vec(c, focus)
        else:
            st[c]["look"] = look_vec(c, "I" if c != "I" else "G")
    # Inès regarde son téléphone au tout début
    if t < LEAD_IN + 1.0:
        st["I"]["look"] = (0.05, 0.95)
    # Lola regarde la fenêtre quand personne ne lui parle
    if not (speaking and who == "L") and cur["kind"] != "exit":
        st["L"]["look"] = (0.75, -0.55) if int(t / 2.7) % 3 else look_vec("L", focus or "G")

    # postures quand on parle
    if speaking:
        e = st[who]["expr"]
        if who == "G":
            st["G"]["pose"] = {"angry": "point", "shocked": "up"}.get(e, "gesture")
        if who == "C":
            st["C"]["pose"] = "gesture"
        if who == "L":
            st["L"]["stomp"] = True
            st["L"]["hop"] = -abs(math.sin((t - cur["t0"]) * 9)) * 18
    if not speaking or who != "C":
        st["C"]["pose"] = "machine"
    if t < enter["t0"] and not st["L"].get("stomp"):
        st["G"]["hold"] = (gx - 100, 1292)
        st["L"]["hold"] = (gx - 100, 1292)
    if cur["kind"] == "line" and who == "I" and "Merci" in cur["text"]:
        st["I"]["pose"] = "wave"
        st["I"]["hop"] = 0

    if t >= exit_["t0"]:
        u = t - exit_["t0"]
        st["G"]["look"] = (-1, 0)
        st["L"]["look"] = (-0.6, -0.6)
        st["C"]["look"] = (-1, 0)
        st["G"]["expr"] = "angry"
        st["G"].pop("hold", None)
        st["L"].pop("hold", None)
        st["G"]["drag"] = True
        st["G"]["pose"] = "down"
        st["I"]["look"] = (-0.95, 0.1)
        if t >= exit_["t1"] - 0.6:
            st["I"]["look"] = (0.0, 0.1)
    st["G"]["x"], st["L"]["x"], st["C"]["x"] = gx, lx, cx
    st["C"]["visible"] = c_visible and cx > -500
    st["G"]["visible"] = gx > -400
    st["L"]["visible"] = lx > -400

    # caméra
    sx, sy, sc = SHOTS[cur["shot"]]
    if cur["shot"] == "C":
        sx = max(cx + 110, 330)
    elif cur["shot"] == "G":
        sx = gx + 30
    elif cur["shot"] == "L":
        sx = lx + 40
    elif cur["shot"] == "GC":
        sx = (gx + cx) / 2
    u = min(1.0, (t - cur["t0"]) / 5.0)
    sc *= 1 + 0.035 * u
    if cur["kind"] == "exit":
        sc = 1.0 + 0.05 * u
    vw, vh = W / sc, H / sc
    sx = min(max(sx, -260 + vw / 2), 1340 - vw / 2) if sc > 1.0 else 540
    sy = min(max(sy, vh / 2), 1920 - vh / 2)
    return st, (sx, sy, sc), cur, speaking


# ---------------------------------------------------------------- texte

def wrap(text, maxc=24):
    words, rows, cur = text.split(), [], ""
    for w_ in words:
        if len(cur) + len(w_) + 1 > maxc and cur:
            rows.append(cur)
            cur = w_
        else:
            cur = (cur + " " + w_).strip()
    if cur:
        rows.append(cur)
    return rows


def subtitle_rows(seg, t):
    rows = wrap(seg["text"])
    pages = [rows[i:i + 2] for i in range(0, len(rows), 2)]
    lens = [sum(len(r) for r in p) for p in pages]
    tot = sum(lens)
    dur = seg["t1"] - seg["t0"] + 0.25
    acc = seg["t0"]
    for p, n in zip(pages, lens):
        acc += dur * n / tot
        if t < acc:
            return p
    return pages[-1]


def text_el(x, y, s, size, fill, stroke=None, sw=0, weight=800, anchor="middle"):
    st = ' stroke="%s" stroke-width="%s" stroke-linejoin="round"' % (stroke, sw) if stroke else ""
    return ('<text x="%s" y="%s" word-spacing="6" font-family="Inter" font-weight="%d" font-size="%d" fill="%s" '
            'text-anchor="%s"%s>%s</text>') % (f(x), f(y), weight, size, fill, anchor, st, escape(s))


def overlay(cur, speaking, t, total):
    s = []
    # bandeau titre (style vidéo d'origine)
    tw = len(TITLE) * 25.5 + 60
    s.append(rect(540 - tw / 2, 168, tw, 82, "#000000", rx=14, stroke="none", sw=0, extra='opacity="0.88"'))
    s.append(text_el(540, 223, TITLE, 46, "#ffffff"))
    # sous-titres
    if cur["kind"] == "line" and t < cur["t1"] + 0.25:
        rows = subtitle_rows(cur, t)
        y0 = 1548
        col = {"G": "#ffb36b", "I": "#ffe27a", "L": "#d7b8ff", "C": "#9fd3ff"}[cur["who"]]
        for i, r in enumerate(rows):
            y = y0 + i * 74
            s.append(text_el(540, y, r, 58, INK, stroke=INK, sw=13))
            s.append(text_el(540, y, r, 58, "#ffffff" if i else col))
    # fondu de fin
    if t > total - 0.6:
        a = (t - (total - 0.6)) / 0.6
        s.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0, extra='opacity="%.3f"' % a))
    if t < 0.35:
        s.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0, extra='opacity="%.3f"' % (1 - t / 0.35)))
    return "".join(s)


# ---------------------------------------------------------------- image

DEFS = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#7cc6f2"/><stop offset="1" stop-color="#d6f0ff"/></linearGradient>'
        '</defs>')


def frame_svg(segs, total, t):
    st, (cx, cy, sc), cur, speaking = scene_state(segs, total, t)
    world = [background(t)]
    world.append(seat_back(575, 230) + seat_back(815, 235))
    world.append(ines(st["I"], t))
    world.append(seat_front(575, 230) + seat_front(815, 235))
    world.append(ines_legs())
    world.append(rect(790, 1170, 40, 120, "#9aa4ab", rx=14))
    world.append(rect(552, 1170, 40, 120, "#9aa4ab", rx=14))
    if st["C"]["visible"]:
        world.append(controleur(st["C"], t))
    if st["G"]["visible"]:
        world.append(gerard(st["G"], t))
    if st["L"]["visible"]:
        world.append(lola(st["L"], t))
    tr = "translate(%s %s) scale(%.4f) translate(%s %s)" % (f(W / 2), f(H / 2), sc, f(-cx), f(-cy))
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s'
            '<rect width="%d" height="%d" fill="#dfe7ec"/><g transform="%s">%s</g>%s</svg>') % (
        W, H, W, H, DEFS, W, H, tr, "".join(world), overlay(cur, speaking, t, total))


_G = {}


def _init(segs, total):
    _G["segs"], _G["total"] = segs, total


def _render(i):
    import cairosvg
    from PIL import Image
    png = cairosvg.svg2png(bytestring=frame_svg(_G["segs"], _G["total"], i / FPS).encode("utf-8"),
                           output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


# ---------------------------------------------------------------- audio

def mix_audio(segs, total, out):
    n = int(total * tts.SR) + tts.SR
    mix = tts.train_ambience(total + 1)[:n] * 0.9
    for sg in segs:
        if sg["kind"] == "line":
            x, sr = tts.read_wav(sg["wav"])
            i0 = int(sg["t0"] * sr)
            mix[i0:i0 + len(x)] += x * 0.95
        elif sg["kind"] == "enter":
            mix += tts.footsteps(np.arange(sg["t0"], sg["t0"] + ENTER_DUR * 0.95, 0.35), n)
        elif sg["kind"] == "exit":
            mix += tts.footsteps(np.arange(sg["t0"], sg["t0"] + 2.6, 0.23), n)
    # fondu de fin
    fade = int(0.6 * tts.SR)
    end = int(total * tts.SR)
    mix[end - fade:end] *= np.linspace(1, 0, fade)
    mix[end:] = 0
    tts.write_wav(out, mix / max(1.0, np.abs(mix).max() / 0.95))


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", type=float, default=0, help="ne rendre que les N premières secondes")
    ap.add_argument("--frames", default="", help="exporter des images fixes aux temps donnés (s), ex: 2,10.5")
    ap.add_argument("--out", default=os.path.join(HERE, "refus-place-fenetre-train.mp4"))
    args = ap.parse_args()

    wavs = tts.synth_lines()
    segs, total = build_timeline(wavs)
    print("Durée totale : %.1f s" % total)

    if args.frames:
        _init(segs, total)
        from PIL import Image
        for ts in args.frames.split(","):
            img = Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS)))
            p = os.path.join(BUILD, "still_%s.png" % ts)
            img.save(p)
            print(p)
        return

    dur = args.preview or total
    nframes = int(dur * FPS)
    audio = os.path.join(BUILD, "mix.wav")
    mix_audio(segs, total, audio)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", audio,
                           "-t", "%.3f" % dur, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
                           args.out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(segs, total)) as pool:
        for k, buf in enumerate(pool.imap(_render, range(nframes), chunksize=4)):
            ff.stdin.write(buf)
            if k % 150 == 0:
                print("  image %d / %d" % (k, nframes), flush=True)
    ff.stdin.close()
    ff.wait()
    print("OK ->", args.out)


if __name__ == "__main__":
    sys.exit(main())
