# -*- coding: utf-8 -*-
"""Vidéo « narration » façon « Et si tu... » : voix off, scènes illustrées, bulles de pensée,
sous-titres mot à mot, retournement final + appel à l'abonnement.

Usage : python3 story.py [--frames 2,10]
"""
import argparse
import io
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np

import engine
import tts
from engine import (person, seated_legs, SCENES, ease, lerp, circle, ellipse, rect, path, line, text_el, f, INK,
                    W, H)
from sketches import P, SKIN

FPS = 60
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos-histoires")
TITLE = "Et si tu entendais les pensées des gens ?"
SLUG = "h1-pensees"
VOICE = "homme1"   # la voix F choisie
SPEED = 0.95

TOI = P(skin=SKIN[1], hair=("sidepart", "#3a2a1f"), top=("hoodie", "#2a9d8f", "#21867a"), bottom=("pants", "#264653"),
        shoes="#ffffff")
SERVEUR = P(skin=SKIN[4], hair=("short", "#1c1412"), top=("apron", "#ffffff", "#5c3d2e"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", mustache="#1c1412")
POTE = P(skin=SKIN[2], hair=("spiky", "#2b211c"), top=("tshirt", "#e76f51"), beard="#2b211c")
DATE = P(skin=SKIN[3], hair=("long", "#1c1412"), top=("cardigan", "#ff70a6", "#ffffff"), earrings="#e8b53a",
         lipstick=True)
PASSANT1 = P(skin=SKIN[0], hair=("bob", "#e8c15a"), top=("blazer", "#8338ec", "#ffffff"), bottom=("skirt", "#3c096c"),
             shoes="#1b1b1b")
PASSANT2 = P(skin=SKIN[5], hair=("buzz", "#1c1412"), top=("polo", "#ffbe0b"), bottom=("pants", "#3d405b"),
             shoes="#1b1b1b")
VOISIN = P(skin=SKIN[2], hair=("bald", "#9a9a9a"), top=("cardigan", "#6c584c", "#f0ead2"), mustache="#9a9a9a")
INCONNU = P(skin=SKIN[1], hair=("sidepart", "#111111"), top=("blazer", "#111111", "#ffffff"), bottom=("pants", "#111111"),
            shoes="#111111", glasses=False, R=112)


def B(text, scene, cast, shot, **fx):
    return dict(text=text, scene=scene, cast=cast, shot=shot, fx=fx)


# cast : (perso, x, options) ; options : expr, look ("CAM" | (dx,dy)), seated, pose, bubble, bubble_at
BEATS = [
    B("Et si tu pouvais entendre les pensées de tout le monde ?", "park",
      [(TOI, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.35), rings=True),
    B("Pas les tiennes. Celles des autres. Toutes. En permanence.", "bus",
      [(TOI, 360, dict(expr="neutral", look=(1, 0))), (PASSANT1, 932, dict(seated=True, expr="neutral",
                                                                           look=(-1, 0), bubble="Il me regarde ?"))],
      (640, 1000, 1.15), rings=True),
    B("Le matin, le serveur te sourit. Mais dans sa tête, tu l'entends penser : encore lui, il ne laisse jamais de pourboire.",
      "cafe",
      [(SERVEUR, 330, dict(expr="smile", look=(1, 0.2), pose="machine",
                           bubble="Encore lui... Jamais de pourboire.", bubble_at=0.35)),
       (TOI, 932, dict(seated=True, expr="annoyed", look=(-1, -0.2)))], (620, 1000, 1.2)),
    B("Alors tu laisses un billet de dix. Et là, il pense : je l'adore.", "cafe",
      [(SERVEUR, 330, dict(expr="smile", look=(1, 0.2), bubble="Je l'adore !", bubble_at=0.5)),
       (TOI, 932, dict(seated=True, expr="smug", look=(-1, -0.2)))], (620, 1000, 1.2)),
    B("Dans le bus, cinquante personnes. Cinquante voix dans ta tête, en même temps.", "bus",
      [(PASSANT2, 150, dict(expr="annoyed", look=(1, 0))), (TOI, 420, dict(expr="sad", look="CAM", pose="up")),
       (PASSANT1, 932, dict(seated=True, expr="neutral", look=(-1, 0)))],
      (540, 1000, 1.05), crowd=["J'ai faim", "Je vais être en retard", "Il sent bizarre", "Elle m'a vu ?",
                                 "Mon chat me manque", "Encore lundi...", "Je l'ai laissé allumé ?"]),
    B("Au poker entre potes, tu gagnes toutes les parties. Ils t'accusent de tricher.", "restaurant",
      [(TOI, 360, dict(expr="smug", look=(1, 0.1), pose="gesture")),
       (POTE, 932, dict(seated=True, expr="angry", look=(-1, -0.1), bubble="Il triche, c'est sûr !",
                        bubble_at=0.5))], (620, 1000, 1.2)),
    B("Premier rendez-vous au cinéma. Tu sais exactement quoi dire, au bon moment.", "cinema",
      [(TOI, 380, dict(expr="smile", look=(1, 0.1))),
       (DATE, 932, dict(seated=True, expr="smile", look=(-1, -0.1), bubble="Il est parfait...", bubble_at=0.45))],
      (640, 1000, 1.2)),
    B("Bientôt, tout le monde parle de toi. Celui qui devine tout.", "supermarket",
      [(PASSANT1, 160, dict(expr="shocked", look=(1, 0), bubble="C'est lui !")),
       (TOI, 520, dict(expr="smug", look="CAM")),
       (PASSANT2, 880, dict(expr="shocked", look=(-1, 0), bubble="Le devin !", bubble_at=0.3))],
      (540, 1000, 1.05)),
    B("Mais il y a un revers. Tu ne peux jamais l'éteindre.", "waiting",
      [(TOI, 540, dict(expr="sad", look="CAM", pose="up"))], (540, 1000, 1.4), dark=0.35, rings=True,
      crowd=["...", "Vite", "Pourquoi moi", "Chut", "J'ai peur", "Bla bla"]),
    B("La nuit, tu entends même les voisins rêver.", "park",
      [(TOI, 380, dict(expr="annoyed", look=(1, -0.5))),
       (VOISIN, 800, dict(expr="neutral", look=(0, 0), blink=1.0, bubble="Des moutons... encore des moutons...",
                          bubble_at=0.2))], (580, 1000, 1.15), dark=0.6),
    B("Un jour, dans le parc, tu croises un homme.", "park",
      [(TOI, 330, dict(expr="neutral", look=(1, 0))), (INCONNU, 820, dict(expr="neutral", look=(-1, 0)))],
      (560, 1000, 1.05), rings=True, crowd=["Il fait beau", "Je veux une glace", "Mes clés ?"]),
    B("Et pour la première fois... le silence. Tu n'entends plus rien.", "park",
      [(TOI, 330, dict(expr="shocked", look=(1, 0)))], (330, 980, 1.6), silence=True),
    B("Il se tourne vers toi. Et il sourit.", "park",
      [(INCONNU, 820, dict(expr="smug", look="CAM"))], (820, 980, 1.7), dark=0.25),
    B("Et dans ta tête, une voix qui n'est pas la tienne murmure : enfin... je t'ai trouvé.", "park",
      [(TOI, 540, dict(expr="shocked", look="CAM"))], (540, 960, 1.8), dark=0.55, red=True,
      inner="Enfin... je t'ai trouvé."),
    B("Abonne-toi pour découvrir la suite.", "park",
      [(TOI, 330, dict(expr="shocked", look=(1, 0))), (INCONNU, 820, dict(expr="smug", look=(-1, 0)))],
      (560, 1000, 1.05), dark=0.45, cta=True),
]


# ------------------------------------------------------------------ audio / timeline

def synth_beats():
    d = os.path.join(tts.BUILD, "story", SLUG)
    os.makedirs(d, exist_ok=True)
    out = []
    for i, b in enumerate(BEATS):
        final = os.path.join(d, "%02d.wav" % i)
        if not os.path.exists(final):
            raw = final.replace(".wav", "_raw.wav")
            engine.kokoro_wav(b["text"].replace("...", ","), VOICE, SPEED, raw)
            tts.to_sr(raw, final, 0.0)
            os.remove(raw)
        out.append(final)
    return out


def build(wavs):
    t = 0.4
    segs = []
    for b, w_ in zip(BEATS, wavs):
        x, sr = tts.read_wav(w_)
        dur = len(x) / sr
        segs.append(dict(b, t0=t, t1=t + dur, wav=w_))
        t += dur + 0.35
    return segs, t + 2.0


# ------------------------------------------------------------------ effets

def bubble(x, y, txt, scale=1.0, red=False):
    rows = engine.wrap(txt, 18)
    w_ = max(len(r) for r in rows) * 19 + 70
    h_ = len(rows) * 46 + 50
    s = ['<g transform="translate(%s %s) scale(%.3f)">' % (f(x), f(y), scale)]
    col = "#fff0f0" if red else "#ffffff"
    for dx, dy, r in ((-w_ * 0.32, -h_ * 0.1, h_ * 0.42), (w_ * 0.3, -h_ * 0.08, h_ * 0.45), (0, -h_ * 0.25, h_ * 0.5),
                      (-w_ * 0.12, h_ * 0.18, h_ * 0.42), (w_ * 0.18, h_ * 0.2, h_ * 0.4)):
        s.append(circle(dx, dy, r, col, sw=6))
    s.append(rect(-w_ / 2, -h_ / 2, w_, h_, col, rx=h_ / 2, stroke="none", sw=0))
    for dx, dy, r in ((-w_ * 0.32, -h_ * 0.1, h_ * 0.42 - 3), (w_ * 0.3, -h_ * 0.08, h_ * 0.45 - 3),
                      (0, -h_ * 0.25, h_ * 0.5 - 3), (-w_ * 0.12, h_ * 0.18, h_ * 0.42 - 3),
                      (w_ * 0.18, h_ * 0.2, h_ * 0.4 - 3)):
        s.append(circle(dx, dy, r, col, stroke="none", sw=0))
    s.append(circle(-w_ * 0.25, h_ * 0.72, 18, col, sw=5) + circle(-w_ * 0.33, h_ * 0.98, 10, col, sw=4))
    for i, r in enumerate(rows):
        s.append(text_el(0, -h_ / 2 + 66 + i * 46 - 10, r, 36, "#b00020" if red else INK, weight=800))
    s.append("</g>")
    return "".join(s)


def rings(x, y, t, col="#7ad7ff"):
    s = []
    for k in range(3):
        p = ((t * 0.8 + k / 3) % 1.0)
        s.append(circle(x, y, 120 + p * 260, "none", stroke=col, sw=10 * (1 - p) + 1,
                        ) .replace("/>", ' opacity="%.2f"/>' % (0.7 * (1 - p))))
    return "".join(s)


def crowd_bubbles(texts, t, t0, center_x):
    s = []
    for i, txt in enumerate(texts):
        appear = t0 + 0.25 * i
        if t < appear:
            continue
        sc = 0.9 * ease((t - appear) / 0.25)
        bx = center_x - 330 + (i % 3) * 330 + (i // 3 % 2) * 120
        by = 430 + (i // 3) * 190 + math.sin(t * 2 + i) * 12
        s.append(bubble(bx, by, txt, sc))
    return "".join(s)


# ------------------------------------------------------------------ image

def frame_svg(segs, total, t):
    cur = segs[0]
    for sg in segs:
        if sg["t0"] - 0.35 <= t:
            cur = sg
    i = segs.index(cur)
    prev = segs[i - 1] if i > 0 else cur
    u_beat = max(0.0, (t - cur["t0"]) / max(0.1, cur["t1"] - cur["t0"]))
    scene = SCENES[cur["scene"]]()

    # caméra : transition douce + léger zoom continu
    def cam(sg):
        x, y, sc = sg["shot"]
        sc *= 1 + 0.05 * min(1.0, max(0.0, (t - sg["t0"]) / 6))
        vw, vh = W / sc, H / sc
        x = min(max(x, -260 + vw / 2), 1340 - vw / 2) if sc > 1 else 540
        y = min(max(y, vh / 2), 1920 - vh / 2)
        return x, y, sc
    c1 = cam(cur)
    tr_u = ease((t - (cur["t0"] - 0.35)) / 0.45)
    if prev is not cur and prev["scene"] == cur["scene"] and tr_u < 1:
        c0 = cam(prev)
        c1 = tuple(lerp(a, b, tr_u) for a, b in zip(c0, c1))
    cx, cy, sc = c1

    world = [scene.back(t), scene.seat_back(t)]
    standing, effects = [], []
    for k, (spec, x, o) in enumerate(cur["cast"]):
        st = dict(x=x, expr=o.get("expr", "neutral"), mouth=0.0, pose=o.get("pose", "down"), pose_amt=1.0,
                  tilt=math.sin(t * 0.9 + k * 1.7) * 1.8,
                  blink=o.get("blink", max(0.0, 1 - abs(((t + k * 0.7) % 3.4) - 0.09) / 0.09)
                              if ((t + k * 0.7) % 3.4) < 0.18 else 0.0))
        lk = o.get("look", (0, 0))
        st["look"] = (0.0, 0.1) if lk == "CAM" else lk
        if o.get("pose") == "up":
            st["pose_amt"] = 0.75 + 0.1 * math.sin(t * 3)
        if o.get("seated"):
            world.append(person(spec, st, t, seated=True))
            world.append(scene.seat_front(t))
            world.append(seated_legs(spec, x, spec.get("R", 108)))
            hy = 905
        else:
            standing.append(person(spec, st, t))
            hy = 1590 - 6.2 * spec.get("R", 108)
        if o.get("bubble"):
            ta = cur["t0"] + o.get("bubble_at", 0.15) * (cur["t1"] - cur["t0"])
            if t >= ta:
                pop = ease((t - ta) / 0.25)
                bx = min(max(x + (110 if x < 540 else -110), 260), 820)
                effects.append(bubble(bx, hy - 300 + math.sin(t * 2) * 8, o["bubble"], pop))
        if cur["fx"].get("rings") and spec is TOI:
            effects.append(rings(x, hy, t))

    world.append(scene.front(t))
    world.extend(standing)
    if cur["fx"].get("crowd"):
        effects.append(crowd_bubbles(cur["fx"]["crowd"], t, cur["t0"] + 0.2, cx))

    tr = "translate(%s %s) scale(%.4f) translate(%s %s)" % (f(W / 2), f(H / 2), sc, f(-cx), f(-cy))
    over = []
    dark = cur["fx"].get("dark", 0)
    if dark:
        a = dark * (ease((t - cur["t0"] + 0.35) / 0.6) if prev["fx"].get("dark", 0) < dark else 1)
        over.append(rect(0, 0, W, H, "#0b1530", stroke="none", sw=0, extra='opacity="%.3f"' % a))
    if cur["fx"].get("red"):
        over.append(rect(0, 0, W, H, "#7a0010", stroke="none", sw=0,
                         extra='opacity="%.3f"' % (0.25 * ease(u_beat) * (0.8 + 0.2 * math.sin(t * 6)))))
    if cur["fx"].get("silence"):
        over.append(rect(0, 0, W, H, "#ffffff", stroke="none", sw=0,
                         extra='opacity="%.3f"' % (0.55 * max(0.0, 1 - (t - cur["t0"]) / 0.5))))
    # vignette
    over.append('<rect width="%d" height="%d" fill="url(#vig)"/>' % (W, H))

    ui = []
    tw = len(TITLE) * 25.5 + 60
    ui.append(rect(540 - tw / 2, 168, tw, 82, "#000000", rx=14, stroke="none", sw=0, extra='opacity="0.85"'))
    ui.append(text_el(540, 225, TITLE, 46, "#ffffff"))
    ui.append(captions(cur, t))
    if cur["fx"].get("inner") and u_beat > 0.55:
        k = ease((u_beat - 0.55) / 0.12)
        ui.append('<g transform="translate(540 520) scale(%.3f)">' % (k * (1 + 0.03 * math.sin(t * 7))))
        ui.append(rect(-420, -80, 840, 160, "#000000", rx=30, stroke="#ff2a3d", sw=8, extra='opacity="0.85"'))
        ui.append(text_el(0, 22, cur["fx"]["inner"], 62, "#ff4757"))
        ui.append("</g>")
    if cur["fx"].get("cta"):
        ui.append(cta(t - cur["t0"]))
    if t > total - 0.5:
        ui.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0,
                       extra='opacity="%.3f"' % min(1, (t - total + 0.5) / 0.5)))
    if t < 0.3:
        ui.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0, extra='opacity="%.3f"' % (1 - t / 0.3)))
    defs = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc6f2"/>'
            '<stop offset="1" stop-color="#d6f0ff"/></linearGradient>'
            '<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s'
            '<rect width="%d" height="%d" fill="#dfe7ec"/><g transform="%s">%s</g>%s<g transform="%s">%s</g>%s</svg>') % (
        W, H, W, H, defs, W, H, tr, "".join(world), "".join(over), tr, "".join(effects), "".join(ui))


_FONT = {}


def text_w(txt, size):
    from PIL import ImageFont
    if size not in _FONT:
        _FONT[size] = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", size)
    return _FONT[size].getlength(txt)


def captions(sg, t):
    """Sous-titres mot à mot (style TikTok) : 3-4 mots à la fois, mot courant en jaune."""
    if t < sg["t0"] or t > sg["t1"] + 0.2:
        return ""
    words = sg["text"].split()
    weights = [len(w_) + 2 for w_ in words]
    tot = sum(weights)
    dur = sg["t1"] - sg["t0"]
    acc, idx = sg["t0"], len(words) - 1
    starts = []
    for k, wt in enumerate(weights):
        starts.append(acc)
        acc += dur * wt / tot
    for k in range(len(words)):
        if t < starts[k] + dur * weights[k] / tot:
            idx = k
            break
    # groupes de mots
    groups, g = [], []
    for k, w_ in enumerate(words):
        g.append(k)
        if len(" ".join(words[j] for j in g)) > 16 or w_.endswith((".", "?", "!", ":", ",")):
            groups.append(g)
            g = []
    if g:
        groups.append(g)
    grp = next(gg for gg in groups if idx in gg)
    txt_parts = []
    total_len = sum(len(words[j]) for j in grp) + len(grp) - 1
    size = 74 if total_len < 14 else 64
    gap = size * 0.32
    full = sum(text_w(words[j], size) for j in grp) + gap * (len(grp) - 1)
    x = 540 - full / 2
    pop = 1 + 0.08 * max(0.0, 1 - (t - starts[grp[0]]) / 0.12)
    out = ['<g transform="translate(540 1500) scale(%.3f) translate(-540 -1500)">' % pop]
    for j in grp:
        w_ = words[j]
        col = "#ffe600" if j == idx else "#ffffff"
        out.append(text_el(x, 1500, w_, size, INK, stroke=INK, sw=16, anchor="start"))
        out.append(text_el(x, 1500, w_, size, col, anchor="start"))
        x += text_w(w_, size) + gap
    out.append("</g>")
    return "".join(out)


def cta(u):
    dy = (1 - ease(u / 0.45)) * 520
    s = ['<g transform="translate(0 %s)">' % f(dy)]
    s.append(rect(110, 1176, 860, 250, "#ffffff", rx=44, sw=6))
    s.append(text_el(540, 1262, "Partie 2 bientôt", 56, INK))
    tap = 1.3
    followed = u > tap + 0.15
    pulse = 1 + (0.06 * math.sin(u * 9) if not followed else 0)
    s.append('<g transform="translate(540 1352) scale(%.3f) translate(-540 -1352)">' % pulse)
    s.append(rect(375, 1310, 330, 84, "#9aa0a6" if followed else "#fe2c55", rx=42, sw=5))
    s.append(text_el(540, 1368, "Abonné" if followed else "+ Suivre", 44, "#ffffff"))
    s.append("</g>")
    hx = lerp(900, 580, ease((u - 0.4) / 0.8))
    hy = lerp(1750, 1380, ease((u - 0.4) / 0.8))
    if u > tap + 0.5:
        hy += ease((u - tap - 0.5) / 0.5) * 500
    s.append('<g transform="translate(%s %s) scale(%.2f)">' % (f(hx), f(hy), 0.85 if tap < u < tap + 0.15 else 1))
    s.append(path("M -14 0 L -14 -70 Q 0 -86 14 -70 L 14 -10 L 40 -16 Q 62 -14 60 14 L 52 70 L -26 70 "
                  "L -48 26 Q -54 6 -36 6 Z", fill="#ffe0bd", sw=6))
    s.append("</g></g>")
    return "".join(s)


# ------------------------------------------------------------------ son

def mix(segs, total, out):
    sr = tts.SR
    n = int((total + 1) * sr)
    tt = np.arange(n) / sr
    # nappe d'ambiance (accord grave qui respire) + légère tension à la fin
    pad = sum(np.sin(2 * np.pi * fr * tt) * a for fr, a in ((55, 0.5), (82.4, 0.3), (110, 0.25), (164.8, 0.12)))
    pad *= 0.022 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * tt))
    m = pad.astype(np.float32)
    rng = np.random.default_rng(3)
    for sg in segs:
        x, srr = tts.read_wav(sg["wav"])
        i0 = int(sg["t0"] * sr)
        m[i0:i0 + len(x)] += engine.room(x, srr, 0.06) * 1.0
        # « whoosh » de transition
        j0 = int((sg["t0"] - 0.35) * sr)
        k = int(0.35 * sr)
        if j0 > 0:
            wn = rng.standard_normal(k) * np.hanning(k) * 0.05
            wn = np.convolve(wn, np.ones(20) / 20, mode="same")
            m[j0:j0 + k] += wn.astype(np.float32)
        if sg["fx"].get("silence"):
            # coupure nette de l'ambiance pendant le « silence »
            a0, a1 = int(sg["t0"] * sr), int(sg["t1"] * sr)
            m[a0:a1] -= pad[a0:a1].astype(np.float32)
        if sg["fx"].get("red"):
            a0, a1 = int(sg["t0"] * sr), int((sg["t1"] + 0.3) * sr)
            beat = np.zeros(a1 - a0, dtype=np.float32)
            for b0 in np.arange(0, (a1 - a0) / sr, 0.85):
                kk = np.arange(int(0.12 * sr))
                ii = int(b0 * sr)
                if ii + len(kk) < len(beat):
                    beat[ii:ii + len(kk)] += 0.25 * np.sin(2 * np.pi * 50 * kk / sr) * np.exp(-kk / (0.03 * sr))
            m[a0:a1] += beat
    end = int(total * sr)
    fade = int(0.5 * sr)
    m[end - fade:end] *= np.linspace(1, 0, fade)
    m[end:] = 0
    tts.write_wav(out, m / max(1.0, np.abs(m).max() / 0.95))


_S = {}


def _init(segs, total):
    _S["segs"], _S["total"] = segs, total


def _render(i):
    import cairosvg
    from PIL import Image
    png = cairosvg.svg2png(bytestring=frame_svg(_S["segs"], _S["total"], i / FPS).encode("utf-8"),
                           output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="")
    a = ap.parse_args()
    segs, total = build(synth_beats())
    print("durée %.1f s" % total)
    _init(segs, total)
    if a.frames:
        from PIL import Image
        for ts in a.frames.split(","):
            p = os.path.join(tts.BUILD, "story_%s.png" % ts)
            Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS))).save(p)
            print(p)
        return
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, SLUG + ".mp4")
    audio = os.path.join(tts.BUILD, "story", SLUG, "mix.wav")
    mix(segs, total, audio)
    nf = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", audio, "-t", "%.3f" % total,
                           "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(segs, total)) as pool:
        for buf in pool.imap(_render, range(nf), chunksize=4):
            ff.stdin.write(buf)
    ff.stdin.close()
    ff.wait()
    print("->", out)


if __name__ == "__main__":
    sys.exit(main())
