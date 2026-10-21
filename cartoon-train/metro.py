# -*- coding: utf-8 -*-
"""« Le dernier métro » : court-métrage d'ambiance, SANS voix off et SANS personnages cartoon.
L'histoire est racontée par des phrases à l'écran ; un seul personnage : un petit fantôme blanc, tout rond.
Rendu : SVG -> PNG (cairosvg) -> MP4 (ffmpeg), son 100 % synthétisé (numpy).

Usage : python3 metro.py [--frames 2,10,40]
"""
import argparse
import io
import math
import os
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos-metro")
BUILD = os.path.join(HERE, "build", "metro")
W, H, FPS = 1080, 1920, 60
SR = 44100
TOTAL = 80.0
T_END = 72.6      # début du dernier plan (la question), sur la chronologie d'origine (80 s)
OUT_TOTAL = 60.0  # durée de la vidéo finale
CAPTIONS_ON = False

# Montage court : (début, fin) dans la vidéo finale  ->  (début, fin) dans la chronologie d'origine
SEGMAP = [
    (0.0, 3.0, 0.0, 3.6), (3.0, 5.4, 3.6, 6.4), (5.4, 7.4, 7.8, 9.8), (7.4, 10.6, 9.8, 14.0),
    (10.6, 13.4, 14.4, 18.0), (13.4, 16.4, 19.0, 23.5), (16.4, 21.4, 23.5, 29.0), (21.4, 23.6, 29.0, 31.4),
    (23.6, 26.4, 32.4, 35.5), (26.4, 30.6, 35.5, 40.8), (30.6, 34.6, 42.2, 47.0), (34.6, 37.2, 47.0, 50.4),
    (37.2, 39.6, 50.6, 53.7), (39.6, 42.2, 53.7, 57.2), (42.2, 44.8, 57.2, 60.5), (44.8, 47.8, 60.5, 64.3),
    (47.8, 50.4, 64.8, 68.4), (50.4, 53.8, 68.4, 72.4), (53.8, 60.0, 72.6, 78.8),
]


def remap(tn):
    """Temps de la vidéo finale -> temps de la chronologie d'origine."""
    for a, b, A, B in SEGMAP:
        if a <= tn < b:
            return A + (tn - a) * (B - A) / (b - a)
    return SEGMAP[-1][3]
FONT = "Inter"
MONO = "DejaVu Sans Mono"


# ------------------------------------------------------------------ utilitaires SVG

def f(v):
    return "%.1f" % v


def ease(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def R(x, y, w, h, fill, rx=0, op=1.0, stroke=None, sw=0, extra=""):
    s = '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"' % (f(x), f(y), f(w), f(h), f(rx), fill)
    if op < 1:
        s += ' opacity="%.3f"' % op
    if stroke:
        s += ' stroke="%s" stroke-width="%s"' % (stroke, f(sw))
    return s + " %s/>" % extra


def C(x, y, r, fill, op=1.0, stroke=None, sw=0):
    s = '<circle cx="%s" cy="%s" r="%s" fill="%s"' % (f(x), f(y), f(r), fill)
    if op < 1:
        s += ' opacity="%.3f"' % op
    if stroke:
        s += ' stroke="%s" stroke-width="%s"' % (stroke, f(sw))
    return s + "/>"


def E(x, y, rx, ry, fill, op=1.0, stroke=None, sw=0, extra=""):
    s = '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="%s"' % (f(x), f(y), f(rx), f(ry), fill)
    if op < 1:
        s += ' opacity="%.3f"' % op
    if stroke:
        s += ' stroke="%s" stroke-width="%s"' % (stroke, f(sw))
    return s + " %s/>" % extra


def P(d, fill="none", op=1.0, stroke=None, sw=0, extra=""):
    s = '<path d="%s" fill="%s"' % (d, fill)
    if op < 1:
        s += ' opacity="%.3f"' % op
    if stroke:
        s += ' stroke="%s" stroke-width="%s" stroke-linejoin="round" stroke-linecap="round"' % (stroke, f(sw))
    return s + " %s/>" % extra


def L(x1, y1, x2, y2, stroke, sw, op=1.0):
    return '<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" opacity="%.3f"/>' % (
        f(x1), f(y1), f(x2), f(y2), stroke, f(sw), op)


def T(x, y, s, size, fill, weight=800, anchor="middle", font=FONT, stroke=None, sw=0, op=1.0, ls=0, extra=""):
    from xml.sax.saxutils import escape
    st = ' stroke="%s" stroke-width="%s" stroke-linejoin="round"' % (stroke, f(sw)) if stroke else ""
    return ('<text x="%s" y="%s" font-family="%s" font-weight="%d" font-size="%d" fill="%s" text-anchor="%s" '
            'opacity="%.3f" letter-spacing="%s"%s %s>%s</text>') % (f(x), f(y), font, weight, size, fill, anchor, op,
                                                                    f(ls), st, extra, escape(s))


_FONTS = {}


def text_w(txt, size):
    from PIL import ImageFont
    if size not in _FONTS:
        _FONTS[size] = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", size)
    return _FONTS[size].getlength(txt)


# ------------------------------------------------------------------ chronologie

CLOCK = [(0, "23:58"), (14.0, "23:59"), (29.0, "00:00"), (68.4, "05:30")]

CAPTIONS = [  # (début, fin, lignes)
    (0.3, 3.5, ["Imagine…", "tu rates le dernier métro."]),
    (3.8, 6.6, ["Les grilles se ferment", "derrière toi."]),
    (6.9, 9.7, ["Station « Les Arcades ».", "Plus personne."]),
    (10.0, 13.9, ["Ton téléphone : 3 %.", "Pas de réseau."]),
    (14.2, 16.6, ["Le panneau affiche :", "prochain métro, 5 h 30."]),
    (16.7, 18.0, ["Seul sous la terre."]),
    (18.3, 22.8, ["Dans la cabine de l'agent,", "une feuille est scotchée", "à la vitre."]),
    (23.6, 26.6, ["« Règle n°1 :", "ne monte jamais", "dans une rame vide. »"]),
    (26.8, 29.0, ["Le reste est trop abîmé", "pour être lu."]),
    (29.3, 32.0, ["Minuit pile.", "Les lumières s'éteignent."]),
    (32.3, 35.4, ["Au fond du tunnel,", "deux phares."]),
    (35.6, 38.2, ["Une rame entre en gare.", "Elle s'arrête."]),
    (38.6, 41.4, ["Les portes s'ouvrent.", "Personne à bord."]),
    (41.8, 46.8, ["Et derrière toi…", "des pas lents."]),
    (47.1, 50.3, ["Il s'arrête juste", "derrière ton épaule."]),
    (50.6, 53.4, ["Quelqu'un respire,", "juste derrière toi."]),
    (53.7, 57.0, ["Les portes vont", "se fermer…"]),
    (57.4, 60.0, ["Tu hésites…", "et une main te retient."]),
    (60.3, 64.3, ["« Ne monte pas !", "C'est la rame du dépôt. »"]),
    (64.8, 68.2, ["Elle ne s'arrête nulle part", "avant le matin."]),
    (68.6, 72.4, ["C'était l'agent de nuit.", "Il t'offre un café", "dans sa cabine."]),
]


def clock_text(t):
    s = CLOCK[0][1]
    for ts, label in CLOCK:
        if t >= ts:
            s = label
    return s


def lit_level(t):
    """Intensité de l'éclairage de la station (0 = noir)."""
    if t < 29.0:
        lv = 1.0
        for a, b in ((5.4, 5.47), (8.55, 8.66), (26.6, 26.68), (27.35, 27.5), (28.15, 28.27), (28.65, 28.8)):
            if a <= t < b:
                lv = 0.15
        if 20.0 < t < 29.0:
            lv *= 0.82 + 0.18 * math.sin(t * 37) ** 2
        return lv
    return 0.0


# ------------------------------------------------------------------ décors

DEFS = ('<defs>'
        '<pattern id="tiles" width="90" height="60" patternUnits="userSpaceOnUse">'
        '<rect width="90" height="60" fill="#27394b"/><rect width="90" height="60" fill="none" stroke="#17232f" '
        'stroke-width="4"/><rect x="4" y="4" width="82" height="3" fill="#ffffff" opacity="0.05"/></pattern>'
        '<pattern id="tilesd" width="90" height="60" patternUnits="userSpaceOnUse">'
        '<rect width="90" height="60" fill="#1b2a39"/><rect width="90" height="60" fill="none" stroke="#111b25" '
        'stroke-width="4"/></pattern>'
        '<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c343f"/>'
        '<stop offset="1" stop-color="#171c24"/></linearGradient>'
        '<radialGradient id="vig" cx="0.5" cy="0.5" r="0.78"><stop offset="0.55" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="1" stop-color="#000" stop-opacity="0.7"/></radialGradient>'
        '<radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3c4" stop-opacity="0.9"/>'
        '<stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="ghostglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#dfeaff" '
        'stop-opacity="0.55"/><stop offset="1" stop-color="#dfeaff" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="cold" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#8fd0ff" stop-opacity="0.5"/>'
        '<stop offset="1" stop-color="#8fd0ff" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="green" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3dff8a" stop-opacity="0.5"/>'
        '<stop offset="1" stop-color="#3dff8a" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity="0.65"/>'
        '<stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>'
        '</defs>')


def station(lit, t):
    """Quai vu de face, avec le tunnel au centre. lit = éclairage (0..1)."""
    s = [R(0, 0, W, H, "#0a1019")]
    s.append(R(0, 0, W, 300, "#141d28"))
    for x0 in (90, 660):
        s.append(R(x0 - 30, 170, 390, 100, "#f6f1c9", op=0.10 * lit))
        s.append(R(x0, 200, 330, 22, "#f6f1c9", op=0.12 + 0.88 * lit))
    s.append('<rect x="0" y="300" width="%d" height="880" fill="url(#%s)"/>' % (W, "tiles" if lit > 0.5 else "tilesd"))
    # plaques de station
    for cx in (175, 905):
        s.append(R(cx - 140, 470, 280, 92, "#0b5cad", rx=10, stroke="#e8eef5", sw=5))
        s.append(T(cx, 534, "LES ARCADES", 40, "#ffffff", weight=800))
    # tunnel
    s.append(P("M 330 1180 L 330 790 Q 330 570 540 570 Q 750 570 750 790 L 750 1180 Z", "#01030a"))
    s.append(P("M 360 1180 L 360 800 Q 360 610 540 610 Q 720 610 720 800 L 720 1180 Z", "#04070f"))
    # voie
    s.append(R(0, 1180, W, 380, "#0a0f16"))
    for (x1, y1, x2, y2) in ((230, 1560, 505, 1180), (850, 1560, 575, 1180)):
        s.append(L(x1, y1, x2, y2, "#5b6572", 12))
    for y in (1210, 1245, 1290, 1345, 1415, 1500):
        hw = lerp(40, 330, (y - 1180) / 380)
        s.append(L(540 - hw, y, 540 + hw, y, "#1d242d", 8))
    # quai
    s.append(R(0, 1560, W, 360, "url(#floor)"))
    s.append(R(0, 1560, W, 36, "#d9b52f", op=0.35 + 0.65 * lit))
    for x in range(0, W, 72):
        s.append(R(x + 6, 1566, 36, 24, "#1a1a1a", op=0.6))
    # banc et poubelle
    s.append(R(30, 1650, 330, 26, "#3a424d", rx=6) + R(50, 1676, 14, 70, "#2c333c") + R(326, 1676, 14, 70, "#2c333c"))
    s.append(R(920, 1640, 90, 150, "#2c333c", rx=14) + R(910, 1630, 110, 20, "#39414c", rx=8))
    # reflets de lumière au sol
    s.append(E(250, 1740, 230, 36, "#f6f1c9", op=0.10 * lit))
    s.append(E(820, 1740, 230, 36, "#f6f1c9", op=0.10 * lit))
    # obscurité
    dark = (1 - lit) * 0.9
    if dark > 0.01:
        s.append(R(0, 0, W, H, "#02050b", op=dark))
    # sortie de secours (reste allumée)
    glow = 0.5 + 0.12 * math.sin(t * 2.0)
    s.append(E(900, 380, 150, 90, "url(#green)", op=glow * (0.35 + 0.65 * (1 - lit))))
    s.append(R(840, 350, 120, 56, "#0f7a3d", rx=8, stroke="#baffd6", sw=3))
    s.append(T(900, 391, "SORTIE", 30, "#eafff1", weight=800))
    return "".join(s)


def train_leaving(t):
    """Arrière d'une rame qui s'éloigne dans le tunnel (feux rouges)."""
    u = ease(t / 3.2)
    sc = lerp(1.0, 0.1, u)
    vx, vy = 540, 930
    bottom = vy + (1500 - vy) * sc
    w = 560 * sc
    h = 560 * sc
    s = [R(vx - w / 2, bottom - h, w, h, "#232b36", rx=28 * sc),
         R(vx - w / 2 + 40 * sc, bottom - h + 40 * sc, w - 80 * sc, h * 0.34, "#0c1118", rx=14 * sc),
         R(vx - w / 2, bottom - 60 * sc, w, 22 * sc, "#3a4552")]
    for dx in (-0.36, 0.36):
        s.append(C(vx + dx * w, bottom - h * 0.30, 26 * sc, "#ff2b2b"))
        s.append(C(vx + dx * w, bottom - h * 0.30, 80 * sc, "#ff2b2b", op=0.18))
    if sc > 0.2:
        s.append(R(vx - 8 * sc, bottom - h * 0.62, 16 * sc, 70 * sc, "#0c1118"))
    return "".join(s)


def gate_scene(t, lt):
    """Escalier de sortie ; la grille se ferme."""
    s = [R(0, 0, W, H, "#0a1019")]
    s.append('<rect x="0" y="0" width="%d" height="1500" fill="url(#tilesd)"/>' % W)
    # cage d'escalier lumineuse
    s.append(P("M 240 1500 L 380 560 L 700 560 L 840 1500 Z", "#0a0f16"))
    s.append(R(380, 560, 320, 140, "#e9f2ff", op=0.95))
    s.append(E(540, 660, 330, 190, "url(#cold)", op=0.55))
    for i in range(10):
        y = lerp(1500, 700, i / 10.0)
        y2 = lerp(1500, 700, (i + 1) / 10.0)
        hw = lerp(300, 160, i / 10.0)
        s.append(R(540 - hw, y2, 2 * hw, y - y2, "#222a33" if i % 2 else "#2b343f"))
    s.append(R(0, 1500, W, 420, "url(#floor)"))
    s.append(R(380, 470, 320, 70, "#0f7a3d", rx=8, stroke="#baffd6", sw=3))
    s.append(T(540, 520, "SORTIE ↑", 40, "#eafff1", weight=800))
    # grille
    p = ease((lt - 0.5) / 1.6)
    off = 560 * (1 - p)
    for side in (-1, 1):
        base = 0 if side < 0 else 540
        dx = -off if side < 0 else off
        s.append('<g transform="translate(%s 0)">' % f(dx))
        for i in range(10):
            s.append(R(base + 20 + i * 52, 540, 14, 980, "#7d8895", rx=5))
            s.append(R(base + 22 + i * 52, 540, 4, 980, "#c4ccd6", op=0.5))
        s.append(R(base, 520, 540, 30, "#59626e", rx=6) + R(base, 1010, 540, 18, "#59626e", rx=6)
                 + R(base, 1490, 540, 30, "#59626e", rx=6))
        s.append("</g>")
    if p > 0.98:
        s.append(R(500, 980, 80, 100, "#c9a227", rx=12, stroke="#6d5610", sw=5))
        s.append(P("M 520 980 Q 520 930 540 930 Q 560 930 560 980", "none", stroke="#a9b3bf", sw=10))
        s.append(C(540, 1030, 9, "#2b2410"))
    return "".join(s)


def phone_scene(t, lt, lit):
    s = [station(0.25, t)]
    s.append(R(0, 0, W, H, "#02050b", op=0.55))
    rise = 1 - ease(lt / 0.7)
    sway = math.sin(t * 1.4) * 6
    s.append('<g transform="translate(%s %s)">' % (f(sway), f(rise * 1100 - 270)))
    s.append(R(130, 860, 820, 1400, "#4fb4ff", rx=130, op=0.05))
    s.append(R(155, 885, 770, 1400, "#4fb4ff", rx=120, op=0.07))
    s.append(R(180, 910, 720, 1400, "#0a0a0c", rx=96, stroke="#3a3f48", sw=8))
    s.append(R(205, 935, 670, 1400, "#06080d", rx=76))
    s.append(R(465, 962, 150, 34, "#000000", rx=17))
    # barre d'état : signal à gauche, batterie à droite
    for i in range(4):
        s.append(R(250 + i * 22, 1034 - i * 10, 12, 14 + i * 10, "#4c535e"))
    s.append(L(240, 1040, 345, 985, "#ff4d4d", 6))
    blink = 0.55 + 0.45 * (math.sin(t * 6) > 0)
    s.append(R(745, 1010, 70, 34, "none", rx=8, stroke="#ff4d4d", sw=4, op=blink))
    s.append(R(751, 1016, 7, 22, "#ff4d4d", op=blink))
    s.append(R(815, 1020, 6, 14, "#ff4d4d", op=blink))
    s.append(T(728, 1040, "3 %", 34, "#ff4d4d", weight=800, anchor="end", op=blink))
    # heure et réseau
    s.append(T(540, 1230, "23:59", 180, "#e8edf3", weight=300))
    s.append(T(540, 1300, "samedi", 44, "#9aa3ae", weight=500))
    s.append(R(310, 1350, 460, 70, "#2a1215", rx=35, stroke="#ff4d4d", sw=3))
    s.append(T(540, 1398, "Pas de réseau", 36, "#ff8f8f", weight=700))
    # alerte batterie faible
    a = ease((lt - 0.9) / 0.3)
    if a > 0:
        s.append('<g transform="translate(0 %s)" opacity="%.2f">' % (f((1 - a) * -80), a))
        s.append(R(240, 1440, 600, 130, "#1e232b", rx=36, stroke="#3d4551", sw=3))
        s.append(T(540, 1496, "Batterie faible", 42, "#ffffff", weight=800))
        s.append(T(540, 1544, "Il reste 3 % de batterie", 30, "#aab3bf", weight=500))
        s.append("</g>")
    s.append("</g>")
    return "".join(s)


def led_sign(t, lt):
    s = [station(0.9, t)]
    s.append(R(0, 0, W, H, "#02050b", op=0.35))
    sway = math.sin(t * 0.8) * 3
    s.append('<g transform="translate(%s 0)">' % f(sway))
    s.append(R(210, 0, 12, 540, "#2a323c") + R(858, 0, 12, 540, "#2a323c"))
    s.append(R(70, 520, 940, 520, "#06080b", rx=36, stroke="#39414c", sw=10))
    s.append(R(100, 550, 880, 460, "#0a0705", rx=22))
    flick = 0.9 + 0.1 * math.sin(t * 50)
    s.append(T(540, 680, "PROCHAIN MÉTRO", 66, "#ff9a1f", weight=800, font=MONO, op=0.35 * flick, ls=6,
               stroke="#ff9a1f", sw=10))
    s.append(T(540, 680, "PROCHAIN MÉTRO", 66, "#ffb347", weight=800, font=MONO, op=flick, ls=6))
    colon = "05:30" if int(t * 2) % 2 == 0 else "05 30"
    s.append(T(540, 930, colon, 270, "#ff9a1f", weight=800, font=MONO, op=0.30 * flick, stroke="#ff9a1f", sw=18))
    s.append(T(540, 930, colon, 270, "#ffb347", weight=800, font=MONO, op=flick))
    for y in range(556, 1004, 7):
        s.append(R(100, y, 880, 3, "#000000", op=0.35))
    s.append(E(540, 800, 520, 320, "#ff8a00", op=0.07))
    s.append("</g>")
    return "".join(s)


def cabin_scene(t):
    s = [R(0, 0, W, H, "#080d14")]
    s.append(R(0, 0, W, 1500, "#101a26"))
    s.append(R(60, 360, 960, 1180, "#1a2634", rx=18, stroke="#0b121b", sw=10))
    # vitre
    s.append(R(150, 480, 780, 800, "#0b141d", rx=10, stroke="#0a0f15", sw=14))
    s.append(R(170, 500, 740, 760, "#0e1b27"))
    # intérieur : chaise et bureau dans l'ombre
    s.append(R(210, 1020, 440, 30, "#0a1118") + R(240, 1050, 20, 190, "#0a1118") + R(590, 1050, 20, 190, "#0a1118"))
    s.append(E(760, 960, 70, 90, "#091017") + R(700, 1040, 120, 220, "#091017", rx=30))
    s.append(R(330, 900, 160, 110, "#0a1a14", rx=8) + R(342, 912, 136, 86, "#0f3a26", rx=4, op=0.55))
    # reflets
    s.append(P("M 190 520 L 420 520 L 250 1240 L 190 1240 Z", "#ffffff", op=0.04))
    s.append(P("M 520 520 L 560 520 L 330 1240 L 290 1240 Z", "#ffffff", op=0.03))
    # comptoir
    s.append(R(40, 1280, 1000, 60, "#222f3d", rx=8) + R(60, 1340, 960, 160, "#18222e"))
    return "".join(s)


def paper(t, lt, restored=False, cx=540, cy=900, sc=1.0):
    """La feuille scotchée à la vitre (repère local 380 x 520)."""
    s = ['<g transform="translate(%s %s) rotate(-2.2) scale(%.3f) translate(-190 -260)">' % (f(cx), f(cy), sc)]
    s.append(R(8, 12, 380, 520, "#000000", op=0.35))
    s.append(R(0, 0, 380, 520, "#e9e4d3"))
    s.append(R(0, 0, 380, 520, "#d8cfae", op=0.18))
    s.append(T(190, 58, "CONSIGNES DE NUIT", 27, "#222", weight=700, font=MONO))
    s.append(T(190, 92, "PERSONNEL UNIQUEMENT", 20, "#333", weight=700, font=MONO))
    s.append(L(24, 112, 356, 112, "#222", 3))
    s.append(T(190, 168, "RÈGLE N°1", 44, "#b3211e", weight=700, font=MONO))
    s.append(T(190, 222, "NE MONTE JAMAIS", 30, "#1a1a1a", weight=700, font=MONO))
    s.append(T(190, 262, "DANS UNE RAME", 30, "#1a1a1a", weight=700, font=MONO))
    s.append(T(190, 302, "VIDE.", 30, "#1a1a1a", weight=700, font=MONO))
    s.append(L(24, 330, 356, 330, "#222", 2))
    if restored:
        s.append(T(190, 372, "RÈGLE N°2", 36, "#b3211e", weight=700, font=MONO))
        s.append(T(190, 410, "TOUTE RAME VIDE", 26, "#1a1a1a", weight=700, font=MONO))
        s.append(T(190, 442, "VA AU DÉPÔT.", 26, "#1a1a1a", weight=700, font=MONO))
        s.append(T(190, 474, "ATTENDS L'AGENT.", 26, "#1a1a1a", weight=700, font=MONO))
    else:
        # le reste est abîmé
        s.append(T(24, 372, "RÈGLE N°2 : N", 22, "#222", weight=700, font=MONO, anchor="start", op=0.8))
        s.append(P("M 24 392 q 20 -8 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0", "none", stroke="#444", sw=3, op=0.55))
        s.append(T(24, 428, "…ntend…", 22, "#222", weight=700, font=MONO, anchor="start", op=0.45))
        s.append(P("M 24 446 q 20 -8 40 0 t 40 0 t 40 0 t 40 0 t 40 0", "none", stroke="#444", sw=3, op=0.4))
        s.append(E(250, 440, 120, 70, "#6b4a1f", op=0.28))
        s.append(E(120, 380, 70, 40, "#6b4a1f", op=0.22))
    edge = "#6b4a2b" if restored else "#0e1b27"
    s.append(P("M 0 492 L 40 506 L 90 488 L 150 512 L 210 490 L 270 514 L 330 494 L 380 508 L 380 520 L 0 520 Z", edge))
    s.append(P("M 0 492 L 40 506 L 90 488 L 150 512 L 210 490 L 270 514 L 330 494 L 380 508", "none",
               stroke="#bfb79a", sw=2, op=0.6))
    # scotch
    s.append('<g transform="rotate(-12 40 8)">' + R(-6, -10, 96, 34, "#e8d27a", op=0.7) + "</g>")
    s.append('<g transform="rotate(10 340 8)">' + R(300, -10, 96, 34, "#e8d27a", op=0.7) + "</g>")
    s.append('<g transform="rotate(8 20 520)">' + R(-20, 440, 80, 30, "#e8d27a", op=0.55) + "</g>")
    s.append("</g>")
    return "".join(s)


def ghost(x, base, h, t, alpha=1.0, blink=0.0, wave=0.0, smile=0.0, glow=True, bob=0.0):
    """Le petit fantôme blanc, tout rond (pas effrayant)."""
    w = 0.66 * h
    r = w / 2
    top = base - h + bob
    s = ['<g opacity="%.3f">' % alpha]
    if glow:
        s.append(E(x, top + h * 0.5, h * 0.62, h * 0.7, "url(#ghostglow)"))
    n = 4
    d = "M %s %s A %s %s 0 0 1 %s %s L %s %s" % (f(x - r), f(top + r), f(r), f(r), f(x + r), f(top + r),
                                                 f(x + r), f(base - h * 0.04))
    for i in range(n):
        xe = x + r - w * (i + 1) / n
        xm = x + r - w * (i + 0.5) / n
        dy = h * 0.06 * (1 if i % 2 == 0 else -1) * (1 + 0.15 * math.sin(t * 3 + i))
        d += " Q %s %s %s %s" % (f(xm), f(base - h * 0.04 + dy * 1.6), f(xe), f(base - h * 0.04))
    d += " Z"
    s.append(P(d, "#fbfcff", stroke="#c3cddb", sw=max(2, h * 0.012)))
    s.append(E(x + r * 0.35, top + h * 0.62, r * 0.55, h * 0.30, "#dfe7f3", op=0.55))
    # petits bras
    s.append(E(x - r * 1.0, top + h * 0.62, w * 0.075, h * 0.12, "#fbfcff", stroke="#c3cddb", sw=max(2, h * 0.010),
               extra='transform="rotate(25 %s %s)"' % (f(x - r), f(top + h * 0.62))))
    ang = -150 + 22 * math.sin(t * 9) if wave > 0 else 25
    ax, ay = x + r * 1.0, top + h * 0.60
    s.append('<g transform="rotate(%s %s %s)">' % (f(ang * (wave if wave > 0 else 1) if wave > 0 else -25), f(ax), f(ay)))
    s.append(E(ax, ay + h * 0.11, w * 0.075, h * 0.14, "#fbfcff", stroke="#c3cddb", sw=max(2, h * 0.010)))
    s.append("</g>")
    # visage
    ey = top + r * 1.02
    for sx in (-1, 1):
        s.append(E(x + sx * w * 0.20, ey, w * 0.075, w * 0.105 * (1 - 0.92 * blink), "#101319"))
        s.append(C(x + sx * w * 0.20 - w * 0.02, ey - w * 0.04, w * 0.022, "#ffffff", op=1 - blink))
        s.append(E(x + sx * w * 0.31, ey + w * 0.14, w * 0.06, w * 0.035, "#ffb6c1", op=0.45))
    my = ey + w * 0.16
    s.append(P("M %s %s Q %s %s %s %s" % (f(x - w * 0.06), f(my), f(x), f(my + w * (0.03 + 0.06 * smile)),
                                          f(x + w * 0.06), f(my)), "none", stroke="#2a2f38", sw=max(2, w * 0.018)))
    s.append("</g>")
    return "".join(s)


def stick(x, base, h, t, alpha=1.0, walk=0.0, pose="down", target=None, phase=0.0):
    """Bonhomme-bâton : tête blanche, ni visage ni cheveux, corps en traits noirs (liseré clair pour le voir dans le noir)."""
    r = 0.095 * h
    neck = base - h + 2 * r
    sh = neck + 0.05 * h
    hip = base - 0.46 * h
    w_ = max(6.0, 0.036 * h)
    sw_ = math.sin(walk) * 0.09 * h
    segs = [[(x, neck), (x, hip)],
            [(x, hip), (x - 0.06 * h + sw_, base)],
            [(x, hip), (x + 0.06 * h - sw_, base)],
            [(x, sh), (x - 0.10 * h, sh + 0.17 * h), (x - 0.11 * h - sw_ * 0.3, sh + 0.33 * h)]]
    if pose == "grab" and target:
        tx, ty = target
        segs.append([(x, sh), ((x + tx) / 2, (sh + ty) / 2 + 0.05 * h), (tx, ty)])
    elif pose == "stop":
        segs.append([(x, sh), (x + 0.15 * h, sh + 0.08 * h), (x + 0.17 * h, sh - 0.10 * h)])
    elif pose == "wave":
        segs.append([(x, sh), (x + 0.15 * h, sh + 0.07 * h), (x + 0.20 * h + 0.05 * h * math.sin(phase), sh - 0.14 * h)])
    elif pose == "mug":
        segs.append([(x, sh), (x + 0.13 * h, sh + 0.16 * h), (x + 0.26 * h, sh + 0.10 * h)])
    else:
        segs.append([(x, sh), (x + 0.10 * h, sh + 0.17 * h), (x + 0.11 * h + sw_ * 0.3, sh + 0.33 * h)])
    out = ['<g opacity="%.3f">' % alpha]
    for color, wd in (("#8795a8", w_ + 7), ("#0a0d12", w_)):
        for sg in segs:
            d = "M " + " L ".join("%s %s" % (f(px), f(py)) for px, py in sg)
            out.append(P(d, "none", stroke=color, sw=wd))
    out.append(C(x, base - h + r, r, "#fbfcff", stroke="#c3cddb", sw=max(2, 0.012 * h)))
    out.append("</g>")
    return "".join(out)


def viewer(x, y, op=0.82):
    """Ta silhouette dans le reflet (tête et épaules, sombres)."""
    return (C(x, y, 66, "#04070c", op=op) +
            P("M %s %s Q %s %s %s %s L %s %s L %s %s Z" % (f(x - 190), f(y + 230), f(x - 190), f(y + 90), f(x),
                                                              f(y + 70), f(x + 190), f(y + 230), f(x - 190),
                                                              f(y + 230)), "#04070c", op=op))


# ------------------------------------------------------------------ la rame

WIN = (290, 640, 500, 480)       # x, y, w, h : fenêtre centrale (reflet)
DOORS = (40, 840)                # x de départ des deux portes (largeur 200)


def interior():
    s = [R(0, 600, W, 560, "#fff0bf")]
    s.append(R(0, 600, W, 70, "#ffffff", op=0.9))
    s.append(R(0, 1060, W, 100, "#8d7a52"))
    # banquettes
    for x in range(-10, W, 330):
        s.append(R(x + 20, 880, 280, 130, "#2b5aa8", rx=20))
        s.append(R(x + 20, 800, 280, 90, "#2f64bd", rx=20))
        s.append(R(x + 20, 1000, 280, 14, "#1d3d73"))
    for x in (260, 540, 820):
        s.append(R(x - 7, 620, 14, 520, "#d5dae0"))
    s.append(R(0, 720, W, 6, "#d5dae0", op=0.7))
    return "".join(s)


def train_scene(t, lt, shift, door_open, redlight):
    """Rame vue de côté depuis le quai. shift = décalage horizontal (entrée en gare)."""
    s = [R(0, 0, W, H, "#070b11")]
    s.append(R(0, 1500, W, 420, "url(#floor)"))
    s.append(R(0, 1590, W, 34, "#d9b52f", op=0.25))
    # lumière qui déborde sur le quai
    if door_open > 0:
        for dx in DOORS:
            s.append(P("M %s 1500 L %s 1500 L %s 1920 L %s 1920 Z" % (f(dx + 20), f(dx + 180), f(dx + 330),
                                                                     f(dx - 130)), "url(#beam)", op=door_open))
    s.append('<g transform="translate(%s 0)">' % f(shift))
    # carrosserie
    s.append(R(-1200, 470, 3500, 1050, "#aeb8c2"))
    s.append(R(-1200, 470, 3500, 110, "#8a949f"))
    s.append(R(-1200, 1180, 3500, 60, "#1f55a6"))
    s.append(R(-1200, 1420, 3500, 100, "#2a3039"))
    for x in range(-1200, 2300, 360):
        s.append(R(x, 580, 4, 840, "#7f8994", op=0.8))
    # intérieur visible
    s.append(interior())
    # portes (feuilles qui coulissent)
    for dx in DOORS:
        o = ease(door_open) * 95
        s.append(R(dx - 6, 590, 212, 840, "#1c222a"))
        s.append(R(dx - o, 600, 100, 820, "#b7c1cb", stroke="#7e8994", sw=4))
        s.append(R(dx + 100 + o, 600, 100, 820, "#b7c1cb", stroke="#7e8994", sw=4))
        s.append(R(dx - o + 10, 640, 80, 450, "#233044", op=0.55))
        s.append(R(dx + 110 + o, 640, 80, 450, "#233044", op=0.55))
    # panneaux latéraux qui cachent les portes ouvertes
    s.append(R(-1200, 590, 1240, 840, "#aeb8c2") + R(240, 590, 600, 100, "#aeb8c2")
             + R(240, 1100, 600, 330, "#aeb8c2") + R(1040, 590, 1260, 840, "#aeb8c2"))
    s.append(R(240, 690, 50, 410, "#aeb8c2") + R(790, 690, 50, 410, "#aeb8c2"))
    s.append(R(-1200, 1180, 1240, 60, "#1f55a6") + R(240, 1180, 600, 60, "#1f55a6") + R(1040, 1180, 1260, 60, "#1f55a6"))
    # vitre centrale (reflet)
    x, y, w, h = WIN
    s.append(R(x, y, w, h, "#fff0bf"))
    s.append(R(x + 10, y + 450, w - 20, 30, "#8d7a52"))
    for bx in (x - 20, x + 250):
        s.append(R(bx + 30, y + 240, 220, 120, "#2b5aa8", rx=18))
        s.append(R(bx + 30, y + 170, 220, 80, "#2f64bd", rx=18))
    s.append(R(x, y, w, h, "#0c1620", op=0.30))
    s.append(R(x - 8, y - 8, w + 16, h + 16, "none", rx=10, stroke="#5b6671", sw=16))
    s.append(P("M %s %s L %s %s L %s %s L %s %s Z" % (f(x + 40), f(y), f(x + 130), f(y), f(x + 60), f(y + h),
                                                      f(x), f(y + h)), "#ffffff", op=0.07))
    # feux de porte
    for dx in DOORS:
        col = "#ff3030" if (redlight and int(t * 5) % 2 == 0) else ("#2b3f2b" if not redlight else "#4a1a1a")
        s.append(C(dx + 100, 560, 14, col))
        if redlight and int(t * 5) % 2 == 0:
            s.append(C(dx + 100, 560, 70, "#ff3030", op=0.25))
    s.append("</g>")
    return "".join(s)


def reflection(u, t, breath, fade=1.0):
    """Reflet dans la vitre : toi (silhouette sombre) et le petit fantôme qui s'approche dans ton dos."""
    x, y, w, h = WIN
    s = ['<g clip-path="url(#winclip)" opacity="%.3f">' % fade]
    s.append(viewer(x + 345, y + 270, op=0.80))
    # position du fantôme : arrive du fond (gauche, petit) jusque derrière ton épaule
    p = ease(u)
    gh = lerp(120, 450, p)
    gx = lerp(x + 30, x + 250, p)
    base = y + h - 20
    s.append(stick(gx, base, gh, t, alpha=0.66, walk=(t * 4.2 if u < 1 else 0.0)))
    if breath > 0:
        for k in range(3):
            q = ((t * 0.55 + k / 3.0) % 1.0)
            s.append(E(x + 300 + q * 10, y + 260 - q * 70, 90 + q * 120, 70 + q * 90, "url(#cold)",
                       op=0.55 * breath * (1 - q)))
    s.append("</g>")
    return "".join(s)


# ------------------------------------------------------------------ séquence

def camera(t):
    """(cx, cy, zoom) selon l'instant."""
    kf = [(0, 540, 960, 1.00), (3.6, 540, 960, 1.04), (6.6, 540, 980, 1.0), (9.8, 540, 960, 1.04),
          (14.0, 540, 700, 1.0), (18.0, 540, 960, 1.0), (18.0001, 540, 900, 1.0), (23.5, 540, 900, 1.12),
          (29.0, 540, 900, 1.9), (29.01, 540, 960, 1.0), (32.0, 540, 960, 1.0), (35.5, 540, 960, 1.14),
          (35.51, 540, 960, 1.0), (47.0, 540, 960, 1.0), (50.5, 560, 900, 1.25), (53.5, 560, 900, 1.5),
          (57.2, 560, 900, 1.5), (57.21, 540, 960, 1.0), (TOTAL, 540, 960, 1.0)]
    for (t0, x0, y0, z0), (t1, x1, y1, z1) in zip(kf, kf[1:]):
        if t0 <= t < t1:
            u = ease((t - t0) / (t1 - t0)) if t1 - t0 > 0.5 else 0.0
            if t1 - t0 > 0.5:
                return lerp(x0, x1, u), lerp(y0, y1, u), lerp(z0, z1, u)
            return x0, y0, z0
    return 540, 960, 1.0


def scene_svg(t):
    """Contenu principal (monde) selon l'instant."""
    lit = lit_level(t)
    if t < 3.6:
        return station(1.0, t) + train_leaving(t)
    if t < 6.6:
        return gate_scene(t, t - 3.6)
    if t < 9.8:
        return station(lit, t)
    if t < 14.0:
        return phone_scene(t, t - 9.8, lit)
    if t < 18.0:
        return led_sign(t, t - 14.0)
    if t < 29.0:
        lt = t - 18.0
        return cabin_scene(t) + paper(t, lt)
    if t < 35.5:
        lit_ = 0.0
        s = station(lit_, t)
        hl = ease((t - 32.3) / 3.2)
        if hl > 0:
            # deux phares qui grossissent dans le tunnel
            r = lerp(7, 90, hl ** 1.6)
            sep = lerp(26, 150, hl ** 1.6)
            s += E(540, 930, 420 * hl + 60, 330 * hl + 50, "url(#warm)", op=0.85 * hl)
            for dx in (-sep, sep):
                s += C(540 + dx, 930, r * 1.6, "#fff6d0", op=0.35 * hl)
                s += C(540 + dx, 930, r * 0.8, "#ffffff")
            s += P("M 505 1180 L 575 1180 L %s 1560 L %s 1560 Z" % (f(540 + 330 * hl), f(540 - 330 * hl)), "#fff6d0",
                   op=0.18 * hl)
        return s
    # --- la rame (côté)
    arrive = ease((t - 35.5) / 2.3)
    shift = lerp(-1300, 0, arrive) if t < 37.9 else 0
    door = ease((t - 38.6) / 1.2)
    if t > 54.0:
        door = max(0.0, 1 - ease((t - 54.0) / 6.0))
    red = 53.5 < t < 60.2
    if t >= 68.4:
        return cabin_lit(t, t - 68.4)
    if t >= 57.2:
        shift = lerp(0, 1500, ease((t - 64.8) / 2.6)) if t > 64.8 else 0
        return hand_scene(t, t - 57.2, door, red and t < 60.2, shift)
    s = train_scene(t, t - 35.5, shift, door, red)
    if 41.4 < t < 57.2:
        u = (t - 41.8) / 5.2
        breath = clamp((t - 50.6) / 0.8)
        s += reflection(clamp(u), t, breath, clamp((t - 41.4) / 0.9))
    return s


def cabin_lit(t, lt):
    """La cabine de l'agent, lumière revenue : la règle n°2 est enfin lisible, un café fume."""
    s = [R(0, 0, W, H, "#0c141d"), R(0, 0, W, 1500, "#1b2835")]
    s.append(R(60, 360, 960, 1180, "#26384a", rx=18, stroke="#0b121b", sw=10))
    s.append(R(150, 480, 780, 800, "#0b141d", rx=10, stroke="#0a0f15", sw=14))
    s.append(R(170, 500, 740, 760, "#ffe7a8"))
    s.append(E(540, 880, 440, 400, "url(#warm)", op=0.8))
    s.append(R(170, 1140, 740, 120, "#7a5530") + R(170, 1128, 740, 18, "#99703f"))
    s.append(stick(660, 1130, 650, t, pose="mug"))
    hx, hy = 660 + 0.26 * 650, 1130 - 650 + 2 * 0.095 * 650 + 0.05 * 650 + 0.10 * 650
    s.append(R(hx - 34, hy - 6, 68, 78, "#f4f1ea", rx=10, stroke="#cfc8b8", sw=3))
    s.append(P("M %s %s q 34 6 0 40" % (f(hx + 34), f(hy + 14)), "none", stroke="#cfc8b8", sw=8))
    for k in range(3):
        q = (t * 0.7 + k / 3.0) % 1.0
        s.append(P("M %s %s q 14 -26 0 -52 t 0 -52" % (f(hx - 12 + k * 12), f(hy - 8 - q * 30)), "none",
                   stroke="#ffffff", sw=6, op=0.6 * (1 - q)))
    s.append(paper(t, lt, restored=True, cx=345, cy=900, sc=0.86))
    s.append(R(40, 1280, 1000, 60, "#2d4054", rx=8) + R(60, 1340, 960, 160, "#1c2937"))
    return "".join(s)


def hand_scene(t, lt, door, red, shift):
    """L'agent (bonhomme-bâton) retient ton épaule : toi, de dos, au premier plan."""
    s = train_scene(t, t - 35.5, shift, door, red)
    s += viewer(840, 1370, op=0.97)
    if lt < 3.0:
        s += stick(430, 1900, 1010, t, pose="grab", target=(720, 1450))
    else:
        s += stick(430 + 20 * ease((lt - 3.0) / 0.6), 1900, 1010, t, pose="stop")
    return s


def final_scene(t, lt):
    """Dernier plan : la station rallumée, l'agent te fait signe. La question arrive par-dessus."""
    s = station(1.0, t)
    s += R(0, 395, W, 245, "#04070c", op=0.62)
    s += stick(540, 1520, 720, t, pose="wave", phase=t * 7)
    return s


def question_ui(t, lt):
    s = []
    a = ease(lt / 0.5)
    s.append('<g opacity="%.2f">' % a)
    for i, line in enumerate(("Et toi, tu serais", "monté dans la rame ?")):
        y = 470 + i * 108
        s.append(T(540, y, line, 88, "#000000", stroke="#000000", sw=24))
        s.append(T(540, y, line, 88, "#ffffff"))
    pulse = 1 + 0.04 * math.sin(t * 5)
    for (cx, label, col) in ((290, "OUI", "#1fb86a"), (790, "NON", "#e5484d")):
        s.append('<g transform="translate(%s 1615) scale(%.3f) translate(%s -1615)">' % (f(cx), pulse, f(-cx)))
        s.append(R(cx - 215, 1555, 430, 120, col, rx=60, stroke="#ffffff", sw=6))
        s.append(T(cx, 1635, label, 58, "#ffffff"))
        s.append("</g>")
    s.append(T(540, 1740, "Dis-le en commentaire", 40, "#000000", stroke="#000000", sw=10, weight=700))
    s.append(T(540, 1740, "Dis-le en commentaire", 40, "#ffffff", weight=700))
    s.append("</g>")
    # bandeau d'abonnement discret en haut
    k = ease((lt - 1.4) / 0.5)
    if k > 0:
        s.append('<g opacity="%.2f">' % k)
        s.append(R(150, 250, 780, 112, "#ffffff", rx=56, stroke="#111111", sw=5))
        s.append(T(190, 322, "Abonne-toi pour la suite", 36, "#111111", anchor="start", weight=800))
        followed = lt > 3.3
        pu = 1 + (0.05 * math.sin(t * 9) if not followed else 0)
        s.append('<g transform="translate(790 306) scale(%.3f) translate(-790 -306)">' % pu)
        s.append(R(690, 270, 200, 72, "#9aa0a6" if followed else "#fe2c55", rx=36, stroke="#ffffff", sw=4))
        s.append(T(790, 320, "Abonné" if followed else "+ Suivre", 34, "#ffffff"))
        s.append("</g></g>")
    return "".join(s)


def captions_svg(t):
    for (t0, t1, lines) in CAPTIONS:
        if t0 <= t <= t1 + 0.3:
            n = sum(len(l_) for l_ in lines)
            reveal = clamp((t - t0) / max(0.4, (t1 - t0) * 0.55))
            shown = int(round(n * reveal))
            fade = 1.0 if t <= t1 else max(0.0, 1 - (t - t1) / 0.3)
            out = ['<g opacity="%.3f">' % fade]
            y_last = 1430
            for i, l_ in enumerate(lines):
                k = min(len(l_), max(0, shown))
                shown -= k
                y = y_last - (len(lines) - 1 - i) * 82
                size = 62 if text_w(l_, 62) < 930 else 54
                txt = l_[:k]
                if txt:
                    out.append(T(540, y, l_, size, "#000000", stroke="#000000", sw=16, op=0.0))
                    wfull = text_w(l_, size)
                    xs = 540 - wfull / 2
                    out.append(T(xs, y, txt, size, "#000000", stroke="#000000", sw=15, anchor="start", op=0.9))
                    out.append(T(xs, y, txt, size, "#ffffff", anchor="start"))
            out.append("</g>")
            return "".join(out)
    return ""


def frame_svg(t, tn=None):
    tn = t if tn is None else tn
    cx, cy, zoom = camera(t)
    rng = np.random.default_rng(int(t * FPS))
    shake = 0.0
    if 4.9 < t < 5.5:
        shake = (5.5 - t) * 26
    if 36.5 < t < 38.3:
        shake = 3.0
    if 46.8 < t < 47.4:
        shake = 5.0
    dx = math.sin(t * 1.7) * 3 + rng.normal() * shake * 0.4
    dy = math.cos(t * 1.3) * 3 + rng.normal() * shake * 0.4
    tr = "translate(%s %s) scale(%.4f) translate(%s %s)" % (f(W / 2 + dx), f(H / 2 + dy), zoom, f(-cx), f(-cy))
    if t >= T_END:
        body = final_scene(t, t - T_END)
    else:
        body = scene_svg(t)
    ui = []
    # horloge
    ui.append(R(780, 90, 250, 74, "#05080c", rx=14, op=0.6))
    ui.append(T(905, 146, clock_text(t), 56, "#ff4d4d" if 29 <= t < 68.4 else "#ffd9a0", font=MONO, weight=700))
    if CAPTIONS_ON:
        ui.append(captions_svg(t))
    if t >= T_END:
        ui.append(question_ui(t, t - T_END))
    # grain léger
    for _ in range(26):
        ui.append(R(rng.uniform(0, W), rng.uniform(0, H), 3, 3, "#ffffff", op=0.07))
    # lumière qui saute à minuit
    if 29.0 <= t < 29.18:
        ui.append(R(0, 0, W, H, "#ffffff", op=0.5 * (1 - (t - 29.0) / 0.18)))
    fade = 0.0
    if tn < 0.5:
        fade = 1 - tn / 0.5
    elif tn > OUT_TOTAL - 0.8:
        fade = (tn - (OUT_TOTAL - 0.8)) / 0.8
    clip = ('<clipPath id="winclip"><rect x="%d" y="%d" width="%d" height="%d"/></clipPath>' % WIN)
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s<defs>%s</defs>'
            '<g transform="%s">%s</g><rect width="%d" height="%d" fill="url(#vig)"/>%s'
            '<rect width="%d" height="%d" fill="#000" opacity="%.3f"/></svg>') % (
        W, H, W, H, DEFS, clip, tr, body, W, H, "".join(ui), W, H, fade)


# ------------------------------------------------------------------ son

def noise(n, seed=1):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1.0 / SR)
    m = np.ones_like(fr)
    if lo:
        m *= 1.0 / (1.0 + (lo / np.maximum(fr, 1e-3)) ** 4)
    if hi:
        m *= 1.0 / (1.0 + (fr / hi) ** 4)
    return np.fft.irfft(X * m, len(x)).astype(np.float32)


def at(buf, t0, x, gain=1.0):
    i0 = int(t0 * SR)
    if i0 < 0:
        x = x[-i0:]
        i0 = 0
    j = min(len(buf), i0 + len(x))
    if j > i0:
        buf[i0:j] += x[:j - i0] * gain


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR)).astype(np.float32)


def reverb(x, wet=0.28, length=1.4):
    n = int(length * SR)
    rng = np.random.default_rng(9)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.32 * SR))
    ir[:int(0.02 * SR)] = 0
    ir /= np.abs(ir).sum() + 1e-9
    X = np.fft.rfft(x, len(x) + n)
    Y = np.fft.rfft(ir, len(x) + n)
    tail = np.fft.irfft(X * Y)[:len(x)] * 9
    return (x + wet * tail).astype(np.float32)


def build_audio():
    n = int((TOTAL + 1) * SR)
    t = np.arange(n) / SR
    m = np.zeros(n, dtype=np.float32)
    # nappe grave qui monte avec la tension
    tension = np.clip((t - 29.0) / 28.0, 0, 1)
    drone = (np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t) * 0.3 + np.sin(2 * np.pi * 110.6 * t) * 0.18)
    relax = 1 - 0.85 * np.clip((t - 57.6) / 3.0, 0, 1)
    drone *= 0.020 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)) * (1 + 1.6 * tension) * relax
    m += drone.astype(np.float32)
    # bourdonnement des néons (éteint à minuit)
    hum = np.sin(2 * np.pi * 100 * t) * 0.6 + np.sin(2 * np.pi * 200 * t) * 0.25
    hum *= 0.014 * ((t < 29.0) | (t > 68.4))
    for a, b in ((5.4, 5.47), (8.55, 8.66), (26.6, 26.68), (27.35, 27.5), (28.15, 28.27), (28.65, 28.8)):
        hum[int(a * SR):int(b * SR)] *= 0.1
    m += hum.astype(np.float32)
    # air de tunnel
    m += fft_filter(noise(n, 2), lo=60, hi=500) * 0.018
    # train qui part
    k = int(3.6 * SR)
    sweep = fft_filter(noise(k, 3), lo=80, hi=1400) * np.linspace(1.0, 0.0, k) ** 1.5 * 0.5
    at(m, 0.0, sweep)
    at(m, 0.0, (np.sin(2 * np.pi * 42 * np.arange(k) / SR) * np.linspace(1, 0, k) ** 1.2 * 0.25).astype(np.float32))
    # la grille claque
    for tc, g in ((4.55, 0.35), (5.05, 0.9)):
        kk = int(1.8 * SR)
        tt = np.arange(kk) / SR
        clang = sum(np.sin(2 * np.pi * fr * tt) * a for fr, a in ((312, 1.0), (587, 0.8), (911, 0.6), (1470, 0.4),
                                                                   (2210, 0.3)))
        clang = clang * np.exp(-tt / 0.35) * 0.18
        rattle = fft_filter(noise(kk, 5), lo=800, hi=5000) * np.exp(-tt / 0.12) * 0.5
        at(m, tc, (clang + rattle).astype(np.float32), g)
    # grille qui glisse
    kk = int(1.6 * SR)
    at(m, 3.9, fft_filter(noise(kk, 6), lo=300, hi=3000) * np.hanning(kk) * 0.18)
    # alerte batterie
    for tb in (10.7, 10.95):
        kk = int(0.16 * SR)
        tt = np.arange(kk) / SR
        at(m, tb, (np.sin(2 * np.pi * 1180 * tt) * np.hanning(kk) * 0.16).astype(np.float32))
    # petits « bip » du panneau
    kk = int(0.05 * SR)
    for tb in np.arange(14.3, 17.8, 0.5):
        at(m, tb, (np.sin(2 * np.pi * 2200 * np.arange(kk) / SR) * np.hanning(kk) * 0.03).astype(np.float32))
    # minuit : coupure de courant
    kk = int(0.8 * SR)
    tt = np.arange(kk) / SR
    at(m, 29.0, (np.sin(2 * np.pi * (240 - 200 * tt / 0.8) * tt) * np.exp(-tt / 0.2) * 0.35).astype(np.float32))
    at(m, 29.0, fft_filter(noise(int(0.25 * SR), 7), lo=1500) * env_exp(int(0.25 * SR), 0.05) * 0.4)
    # arrivée du train
    k = int(5.2 * SR)
    tt = np.arange(k) / SR
    rumble = fft_filter(noise(k, 8), lo=30, hi=420) * np.clip(tt / 3.0, 0, 1) ** 2 * 0.9
    rumble += (np.sin(2 * np.pi * 38 * tt) * np.clip(tt / 3.0, 0, 1) ** 2 * 0.3).astype(np.float32)
    at(m, 32.0, rumble.astype(np.float32), 0.7)
    kk = int(2.4 * SR)
    tt = np.arange(kk) / SR
    squeal = np.sin(2 * np.pi * np.cumsum(np.linspace(3300, 1300, kk)) / SR) * 0.07
    squeal += fft_filter(noise(kk, 10), lo=2500, hi=7000) * 0.06
    at(m, 35.6, (squeal * np.hanning(kk) ** 0.5).astype(np.float32))
    # portes : carillon + soupir pneumatique
    for dt, fr in ((0.0, 880.0), (0.34, 660.0)):
        kk = int(0.6 * SR)
        tt = np.arange(kk) / SR
        at(m, 38.3 + dt, (np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.22) * 0.18).astype(np.float32))
    kk = int(1.1 * SR)
    at(m, 38.6, fft_filter(noise(kk, 11), lo=1500, hi=9000) * np.hanning(kk) * 0.22)
    # des pas lents qui se rapprochent, puis s'arrêtent
    step_t = [41.9, 43.4, 44.8, 46.0, 46.8]
    for i, ts in enumerate(step_t):
        kk = int(0.5 * SR)
        tt = np.arange(kk) / SR
        thud = np.sin(2 * np.pi * (95 - 30 * tt / 0.5) * tt) * np.exp(-tt / 0.07) * 0.6
        thud += fft_filter(noise(kk, 20 + i), lo=300, hi=2500) * np.exp(-tt / 0.03) * 0.35
        at(m, ts, thud.astype(np.float32), 0.35 + 0.22 * i)
    # respiration (inspire / expire), près de l'oreille
    for cyc in range(4):
        t0 = 50.6 + cyc * 2.1
        kk = int(1.9 * SR)
        shape = np.sin(np.pi * np.clip(np.arange(kk) / (1.5 * SR), 0, 1)) ** 2
        breath = fft_filter(noise(kk, 30 + cyc), lo=250, hi=2600) * shape
        at(m, t0, breath * 0.28)
    # bips de fermeture des portes
    kk = int(0.12 * SR)
    for tb in np.arange(53.6, 60.0, 0.34):
        at(m, tb, (np.sin(2 * np.pi * 1000 * np.arange(kk) / SR) * np.hanning(kk) * 0.12).astype(np.float32))
    # la main sur l'épaule (tissu + petit choc), puis les portes se ferment pour de bon
    kk = int(0.4 * SR)
    at(m, 57.9, fft_filter(noise(kk, 40), lo=200, hi=1800) * np.hanning(kk) * 0.25)
    tt = np.arange(int(0.5 * SR)) / SR
    at(m, 58.0, (np.sin(2 * np.pi * (90 - 30 * tt / 0.5) * tt) * np.exp(-tt / 0.08) * 0.5).astype(np.float32))
    at(m, 60.0, (np.sin(2 * np.pi * (70 - 25 * tt / 0.5) * tt) * np.exp(-tt / 0.1) * 0.6).astype(np.float32))
    at(m, 60.0, fft_filter(noise(int(0.7 * SR), 41), lo=1500, hi=9000) * np.hanning(int(0.7 * SR)) * 0.18)
    # la rame repart à vide
    k = int(4.2 * SR)
    tt = np.arange(k) / SR
    leave = fft_filter(noise(k, 42), lo=40, hi=900) * np.clip(tt / 0.8, 0, 1) * np.clip(1 - (tt - 1.2) / 3.0, 0, 1)
    at(m, 64.6, leave * 0.7)
    # la lumière revient : tic-tic puis bourdonnement ; le mug se pose
    for dt in (0.0, 0.12, 0.3):
        kk = int(0.05 * SR)
        at(m, 68.4 + dt, fft_filter(noise(kk, 43), lo=2000) * np.hanning(kk) * 0.3)
    kk = int(0.5 * SR)
    tt = np.arange(kk) / SR
    at(m, 69.6, (np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt / 0.06) * 0.12).astype(np.float32))
    # petite mélodie douce pour la question
    for dt, fr in ((0.0, 784.0), (0.2, 988.0), (0.4, 1175.0), (0.7, 1568.0)):
        kk = int(1.2 * SR)
        tt = np.arange(kk) / SR
        at(m, T_END + 0.3 + dt, (np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.4) * 0.12).astype(np.float32))
    # clic de l'abonnement
    kk = int(0.1 * SR)
    at(m, T_END + 3.3, (np.sin(2 * np.pi * 1500 * np.arange(kk) / SR) * np.hanning(kk) * 0.12).astype(np.float32))
    m = reverb(m, 0.30, 1.6)
    end = int(TOTAL * SR)
    m[end - int(0.8 * SR):end] *= np.linspace(1, 0, int(0.8 * SR))
    m[end:] = 0
    m = m / max(1.0, np.abs(m).max() / 0.9)
    return m


def write_wav(path_, x):
    with wave.open(path_, "wb") as w_:
        w_.setnchannels(1)
        w_.setsampwidth(2)
        w_.setframerate(SR)
        w_.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


# ------------------------------------------------------------------ rendu

def _render(i):
    import cairosvg
    from PIL import Image
    tn = i / FPS
    png = cairosvg.svg2png(bytestring=frame_svg(remap(tn), tn).encode("utf-8"), output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


def montage_audio(src, dst):
    """Découpe le son d'origine selon SEGMAP et ajuste la vitesse de chaque morceau (hauteur conservée)."""
    parts, labels = [], []
    for i, (a, b, A, B) in enumerate(SEGMAP):
        r = (B - A) / (b - a)
        parts.append("[0:a]atrim=%.3f:%.3f,asetpts=PTS-STARTPTS,atempo=%.4f[a%d]" % (A, B, r, i))
        labels.append("[a%d]" % i)
    fc = ";".join(parts) + ";" + "".join(labels) + "concat=n=%d:v=0:a=1,afade=t=out:st=%.2f:d=0.8[out]" % (
        len(SEGMAP), OUT_TOTAL - 0.8)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[out]",
                    "-t", "%.3f" % OUT_TOTAL, dst], check=True)


def main():
    global CAPTIONS_ON
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="")
    ap.add_argument("--captions", action="store_true", help="avec les phrases à l'écran (test)")
    a = ap.parse_args()
    os.makedirs(BUILD, exist_ok=True)
    if a.frames:
        from PIL import Image
        CAPTIONS_ON = a.captions
        for ts in a.frames.split(","):
            p = os.path.join(BUILD, "m_%s.png" % ts)
            Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS))).save(p)
            print(p)
        return
    os.makedirs(OUT, exist_ok=True)
    wav_full = os.path.join(BUILD, "audio_full.wav")
    write_wav(wav_full, build_audio())
    wav = os.path.join(BUILD, "audio.wav")
    montage_audio(wav_full, wav)
    for name, caps in (("le-dernier-metro", False), ("le-dernier-metro-avec-texte", True)):
        CAPTIONS_ON = caps
        out = os.path.join(OUT, name + ".mp4")
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                               "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", wav, "-t", "%.3f" % OUT_TOTAL,
                               "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
                               "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
        n = int(OUT_TOTAL * FPS)
        with Pool(os.cpu_count()) as pool:
            for k, buf in enumerate(pool.imap(_render, range(n), chunksize=4)):
                ff.stdin.write(buf)
                if k % 600 == 0:
                    print("  [%s] image %d / %d" % (name, k, n), flush=True)
        ff.stdin.close()
        ff.wait()
        print("OK ->", out, flush=True)


if __name__ == "__main__":
    sys.exit(main())
