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
# voix H choisie : vraie voix d'homme française (Piper upmc, locuteur « pierre »), sans accent
VOICE_MODEL, VOICE_SPK = "fr_FR-upmc-medium", 1
LENGTH = 1.05

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


HERO = TOI


class Burst(engine.Scene):
    """Fond à rayons (style vidéos « Pourquoi c'est la galère d'être... »)."""
    c1, c2 = "#ff8fb1", "#ffb3c8"

    def back(self, t):
        s_ = [rect(-800, 0, 2700, 1920, self.c1, stroke="none", sw=0)]
        cx, cy, n = 540, 1050, 22
        rot = t * 4
        for k in range(n):
            if k % 2:
                continue
            a0 = math.radians(rot + k * 360 / n)
            a1 = math.radians(rot + (k + 1) * 360 / n)
            s_.append(path("M %s %s L %s %s L %s %s Z" % (f(cx), f(cy), f(cx + 3000 * math.cos(a0)),
                                                         f(cy + 3000 * math.sin(a0)), f(cx + 3000 * math.cos(a1)),
                                                         f(cy + 3000 * math.sin(a1))), fill=self.c2, stroke="none", sw=0))
        s_.append(ellipse(540, 1620, 700, 60, "#000000", stroke="none", sw=0, extra='opacity="0.08"'))
        return "".join(s_)


class BurstBlue(Burst):
    c1, c2 = "#5aa9e6", "#7fc8f8"


class BurstYellow(Burst):
    c1, c2 = "#ffcf56", "#ffe08a"


SCENES["burst"], SCENES["burstblue"], SCENES["burstyellow"] = Burst, BurstBlue, BurstYellow
HEADER = None  # (ligne1, ligne2, sujet) pour le style « galère »
CAPTION_Y = 1500   # hauteur des sous-titres (remontés pour la zone sûre TikTok si besoin)
HOOK_TEXT = None   # gros texte d'accroche pendant le premier plan
STORY = {}


def header_svg(t):
    l1, l2, subj = HEADER
    s_ = []
    def outlined(x, y, txt, size, col, sw_):
        return text_el(x, y, txt, size, INK, stroke=INK, sw=sw_) + text_el(x, y, txt, size, col)
    s_.append(outlined(540, 218, l1, 64, "#ffd166", 16))
    s_.append(outlined(540, 298, l2, 64, "#ffd166", 16))
    size = 124
    while text_w(subj, size) > 860 and size > 92:
        size -= 4
    pop = 1 + 0.04 * math.sin(t * 3)
    s_.append('<g transform="translate(540 410) scale(%.3f) translate(-540 -410)">' % pop)
    if text_w(subj, size) > 860:
        w_ = subj.split()
        k_ = min(range(1, len(w_)), key=lambda i: abs(len(" ".join(w_[:i])) - len(subj) / 2))
        size = 96
        s_.append(outlined(540, 405, " ".join(w_[:k_]), size, "#ffffff", 22))
        s_.append(outlined(540, 500, " ".join(w_[k_:]), size, "#ffffff", 22))
        s_.append("</g>")
        return "".join(s_)
    s_.append(outlined(540, 420 + (124 - size) * 0.3, subj, size, "#ffffff", 22))
    sw_ = text_w(subj, size)
    if sw_ > 720:
        s_.append("</g>")
        return "".join(s_)
    # petit nuage d'orage
    nx, ny = 540 + sw_ / 2 + 60, 355
    s_.append(circle(nx - 22, ny, 26, "#9aa4ab", sw=5) + circle(nx + 10, ny - 14, 32, "#9aa4ab", sw=5)
              + circle(nx + 38, ny + 2, 24, "#9aa4ab", sw=5)
              + rect(nx - 40, ny, 100, 26, "#9aa4ab", rx=12, stroke="none", sw=0)
              + path("M %s %s l -14 34 l 16 0 l -10 32 l 30 -44 l -16 0 l 10 -22 Z" % (f(nx + 8), f(ny + 20)),
                     fill="#ffd166", sw=4))
    s_.append("</g>")
    return "".join(s_)


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

_PV = {}


def piper_wav(text, path_):
    import wave
    from piper import PiperVoice, SynthesisConfig
    if "v" not in _PV:
        _PV["v"] = PiperVoice.load(engine.voice_model(VOICE_MODEL))
    with wave.open(path_, "wb") as w_:
        _PV["v"].synthesize_wav(text, w_, syn_config=SynthesisConfig(speaker_id=VOICE_SPK, length_scale=LENGTH,
                                                                     noise_scale=0.667, noise_w_scale=0.8))


def synth_beats():
    d = os.path.join(tts.BUILD, "story-h", SLUG)
    os.makedirs(d, exist_ok=True)
    out = []
    for i, b in enumerate(BEATS):
        final = os.path.join(d, "%02d.wav" % i)
        if not os.path.exists(final):
            raw = final.replace(".wav", "_raw.wav")
            piper_wav(b["text"].replace("...", ","), raw)
            tts.to_sr(raw, final, 0.0)
            os.remove(raw)
        out.append(final)
    return out


def build(wavs):
    t = 0.15 if HOOK_TEXT else 0.4
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
        if cur["fx"].get("freeze") and spec is not HERO:
            st["blink"], st["tilt"] = 0.0, 0.0
        lk = o.get("look", (0, 0))
        st["look"] = (0.0, 0.1) if lk == "CAM" else lk
        if o.get("pose") == "up":
            st["pose_amt"] = 0.75 + 0.1 * math.sin(t * 3)
        op = o.get("ghost")
        g0, g1 = ('<g opacity="%.2f">' % op, "</g>") if op is not None else ("", "")
        if o.get("seated"):
            world.append(g0 + person(spec, st, t, seated=True) + g1)
            world.append(scene.seat_front(t))
            world.append(seated_legs(spec, x, spec.get("R", 108)))
            hy = 905
        else:
            if o.get("mirror"):
                standing.append(rect(x - 190, 600, 380, 1040, "#d9eef7", rx=30, stroke="#b8c4cc", sw=26)
                                + rect(x - 203, 587, 406, 1066, "none", rx=36, sw=6)
                                + path("M %s 700 l 90 -70 M %s 780 l 140 -120" % (f(x - 150), f(x - 150)),
                                       stroke="#ffffff", sw=12, extra='opacity="0.7"'))
            standing.append(g0 + person(spec, st, t) + g1)
            hy = 1590 - 6.2 * spec.get("R", 108)
        if o.get("tag"):
            txt, col = o["tag"] if isinstance(o["tag"], tuple) else (o["tag"], "#ffd166")
            ta = cur["t0"] + o.get("tag_at", 0.1) * (cur["t1"] - cur["t0"])
            if t >= ta:
                k_ = ease((t - ta) / 0.25)
                tw_ = text_w(txt, 46) + 60
                effects.append('<g transform="translate(%s %s) scale(%.3f)">' % (f(x), f(hy - 190 + math.sin(t * 2.5) * 6), k_)
                               + rect(-tw_ / 2, -40, tw_, 80, col, rx=40, sw=6) + text_el(0, 16, txt, 46, INK) + "</g>")
        if o.get("bubble"):
            ta = cur["t0"] + o.get("bubble_at", 0.15) * (cur["t1"] - cur["t0"])
            if t >= ta:
                pop = ease((t - ta) / 0.25)
                bx = min(max(x + (110 if x < 540 else -110), 260), 820)
                effects.append(bubble(bx, hy - 300 + math.sin(t * 2) * 8, o["bubble"], pop))
        if cur["fx"].get("rings") and spec is HERO:
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
    if cur["fx"].get("freeze"):
        over.append(rect(0, 0, W, H, "#a8dadc", stroke="none", sw=0, extra='opacity="0.22"'))
        over.append(rect(900, 560, 34, 110, "#ffffff", rx=8, sw=6) + rect(960, 560, 34, 110, "#ffffff", rx=8, sw=6))
    if cur["fx"].get("rewind"):
        u_ = min(1.0, (t - cur["t0"] + 0.35) / 1.2)
        if u_ < 1:
            over.append(rect(0, 0, W, H, "#1d3557", stroke="none", sw=0, extra='opacity="%.2f"' % (0.35 * (1 - u_))))
            for k_ in range(0, H, 24):
                yy = (k_ + t * 900) % H
                over.append(rect(0, yy, W, 5, "#ffffff", stroke="none", sw=0, extra='opacity="0.12"'))
            over.append('<g opacity="%.2f">' % (1 - u_) + path("M 600 820 L 470 960 L 600 1100 Z", fill="#ffffff", sw=8)
                        + path("M 760 820 L 630 960 L 760 1100 Z", fill="#ffffff", sw=8) + "</g>")
    # vignette
    over.append('<rect width="%d" height="%d" fill="url(#vig)"/>' % (W, H))

    ui = []
    if HEADER:
        tlines = []
        ui.append(header_svg(t))
    elif len(TITLE) <= 36:
        tlines = [TITLE]
    else:
        words_ = TITLE.split()
        best = min(range(1, len(words_)), key=lambda k: abs(len(" ".join(words_[:k])) - len(TITLE) / 2))
        tlines = [" ".join(words_[:best]), " ".join(words_[best:])]
    tsize = 46
    if tlines:
        tw = max(text_w(l_, tsize) for l_ in tlines) + 70
        th = 82 + (len(tlines) - 1) * 56
        ui.append(rect(540 - tw / 2, 168, tw, th, "#000000", rx=14, stroke="none", sw=0, extra='opacity="0.85"'))
    for li, l_ in enumerate(tlines):
        ui.append(text_el(540, 225 + li * 56, l_, tsize, "#ffffff"))
    if cur["fx"].get("notif") and u_beat > cur["fx"].get("notif_at", 0.1):
        k_ = ease((u_beat - cur["fx"].get("notif_at", 0.1)) / 0.1)
        y0 = lerp(-200, 560 if HEADER else 330, k_)
        ui.append(rect(80, y0, 920, 150, "#ffffff", rx=36, sw=5, extra='opacity="0.97"'))
        ui.append(rect(110, y0 + 30, 90, 90, "#25d366", rx=22, stroke="none", sw=0))
        ui.append(text_el(155, y0 + 92, "!", 60, "#ffffff"))
        ui.append(text_el(230, y0 + 62, cur["fx"].get("notif_from", "Message de demain"), 30, "#777777",
                          weight=700, anchor="start"))
        ui.append(text_el(230, y0 + 112, cur["fx"]["notif"], 44, INK, anchor="start"))
    ui.append(captions(cur, t))
    if cur["fx"].get("inner") and u_beat > 0.55:
        k = ease((u_beat - 0.55) / 0.12)
        ui.append('<g transform="translate(540 520) scale(%.3f)">' % (k * (1 + 0.03 * math.sin(t * 7))))
        ui.append(rect(-420, -80, 840, 160, "#000000", rx=30, stroke="#ff2a3d", sw=8, extra='opacity="0.85"'))
        ui.append(text_el(0, 22, cur["fx"]["inner"], 62, "#ff4757"))
        ui.append("</g>")
    if HOOK_TEXT and cur is segs[0]:
        ui.append(hook_svg(t + 0.25, cur["t1"]))
    if cur["fx"].get("mid_cta"):
        ui.append(mid_cta_svg(t - cur["t0"], cur["t1"] - cur["t0"]))
    if cur["fx"].get("cta"):
        ui.append(cta(t - cur["t0"]))
    if t > total - 0.5:
        ui.append(rect(0, 0, W, H, "#000000", stroke="none", sw=0,
                       extra='opacity="%.3f"' % min(1, (t - total + 0.5) / 0.5)))
    if t < 0.3 and not HOOK_TEXT:
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
    out = ['<g transform="translate(540 %d) scale(%.3f) translate(-540 -%d)">' % (CAPTION_Y, pop, CAPTION_Y)]
    for j in grp:
        w_ = words[j]
        col = "#ffe600" if j == idx else "#ffffff"
        out.append(text_el(x, CAPTION_Y, w_, size, INK, stroke=INK, sw=16, anchor="start"))
        out.append(text_el(x, CAPTION_Y, w_, size, col, anchor="start"))
        x += text_w(w_, size) + gap
    out.append("</g>")
    return "".join(out)


def hook_svg(u, dur):
    """Gros texte d'accroche qui « claque » dès la première seconde."""
    if u < 0 or u > dur + 0.3:
        return ""
    words = HOOK_TEXT.split()
    lines_ = [HOOK_TEXT]
    if text_w(HOOK_TEXT, 92) > 900 and len(words) > 1:
        k = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(HOOK_TEXT) / 2))
        lines_ = [" ".join(words[:k]), " ".join(words[k:])]
    size = 92
    while max(text_w(l_, size) for l_ in lines_) > 920 and size > 60:
        size -= 4
    sc = 1.45 - 0.45 * ease(u / 0.22)
    out_a = 1.0 if u < dur else max(0.0, 1 - (u - dur) / 0.3)
    shake = math.sin(u * 60) * 10 * max(0.0, 1 - u / 0.35)
    y0 = 640
    s_ = ['<g opacity="%.2f" transform="translate(%s %d) scale(%.3f) rotate(-3) translate(-540 -%d)">'
          % (out_a, f(540 + shake), y0, sc, y0)]
    hh = len(lines_) * (size + 14) + 50
    bw = max(text_w(l_, size) for l_ in lines_) + 80
    s_.append(rect(540 - bw / 2, y0 - hh / 2 - 10, bw, hh, "#ffe600", rx=24, sw=8))
    for i, l_ in enumerate(lines_):
        yy = y0 - hh / 2 + 25 + (i + 1) * (size + 14) - 26
        s_.append(text_el(540, yy, l_, size, INK, weight=900))
    s_.append("</g>")
    return "".join(s_)


def mid_cta_svg(u, dur):
    """Bandeau d'abonnement compact au milieu de la vidéo (ne cache pas les personnages)."""
    if u < 0:
        return ""
    k = ease(u / 0.35)
    if u > dur:
        k = max(0.0, 1 - (u - dur) / 0.3)
    dx = (1 - k) * 1100
    y0 = 520
    s_ = ['<g transform="translate(%s 0)">' % f(dx)]
    s_.append(rect(90, y0, 900, 170, "#000000", rx=40, stroke="none", sw=0, extra='opacity="0.25"'))
    s_.append(rect(80, y0 - 10, 900, 170, "#ffffff", rx=40, sw=6))
    s_.append(circle(170, y0 + 75, 52, "#ffd166", sw=5))
    s_.append(circle(152, y0 + 64, 9, INK, stroke="none", sw=0) + circle(188, y0 + 64, 9, INK, stroke="none", sw=0))
    s_.append(path("M 145 %s Q 170 %s 195 %s" % (f(y0 + 92), f(y0 + 116), f(y0 + 92)), sw=6))
    s_.append(text_el(250, y0 + 62, "Ne rate pas la suite", 44, INK, anchor="start"))
    s_.append(text_el(250, y0 + 112, "Abonne-toi maintenant", 34, "#555555", weight=700, anchor="start"))
    tap = 1.1
    followed = u > tap + 0.15
    pulse = 1 + (0.07 * math.sin(u * 10) if not followed else 0)
    if tap < u < tap + 0.15:
        pulse = 0.9
    cx, cy = 840, y0 + 75
    s_.append('<g transform="translate(%s %s) scale(%.3f) translate(%s %s)">' % (f(cx), f(cy), pulse, f(-cx), f(-cy)))
    s_.append(rect(cx - 115, cy - 42, 230, 84, "#9aa0a6" if followed else "#fe2c55", rx=42, sw=5))
    s_.append(text_el(cx, cy + 15, "Abonné" if followed else "+ Suivre", 38, "#ffffff"))
    s_.append("</g>")
    hx = lerp(1050, cx + 30, ease((u - 0.3) / 0.6))
    hy = lerp(y0 + 420, cy + 25, ease((u - 0.3) / 0.6))
    if u > tap + 0.4:
        hy += ease((u - tap - 0.4) / 0.4) * 500
    s_.append('<g transform="translate(%s %s) scale(%.2f)">' % (f(hx), f(hy), 0.85 if tap < u < tap + 0.15 else 1))
    s_.append(path("M -14 0 L -14 -70 Q 0 -86 14 -70 L 14 -10 L 40 -16 Q 62 -14 60 14 L 52 70 L -26 70 "
                   "L -48 26 Q -54 6 -36 6 Z", fill="#ffe0bd", sw=6))
    s_.append("</g></g>")
    return "".join(s_)


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

def mix(segs, total, out, voice=True):
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
        if voice:
            m[i0:i0 + len(x)] += engine.room(x, srr, 0.06) * 1.0
        if HOOK_TEXT and sg is segs[0]:
            kk = np.arange(int(0.5 * sr))
            boom = 0.5 * np.sin(2 * np.pi * (60 - 25 * kk / len(kk)) * kk / sr) * np.exp(-kk / (0.12 * sr))
            boom += rng.standard_normal(len(kk)) * 0.15 * np.exp(-kk / (0.02 * sr))
            m[i0:i0 + len(kk)] += boom.astype(np.float32)
        if sg["fx"].get("mid_cta"):
            for dt, fr in ((0.0, 880.0), (1.1, 1320.0)):
                kk = np.arange(int(0.18 * sr))
                pop = 0.18 * np.sin(2 * np.pi * fr * kk / sr) * np.exp(-kk / (0.04 * sr))
                j = int((sg["t0"] + dt) * sr)
                m[j:j + len(kk)] += pop.astype(np.float32)
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


def load_story(d):
    global TITLE, SLUG, BEATS, HERO, HEADER, OUT, CAPTION_Y, HOOK_TEXT, STORY
    TITLE, SLUG, BEATS, HERO = d["title"], d["slug"], d["beats"], d["hero"]
    HEADER = d.get("header")
    CAPTION_Y = d.get("caption_y", 1500)
    HOOK_TEXT = d.get("hook_text")
    STORY = d
    OUT = os.path.join(HERE, d.get("out", "videos-histoires"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="")
    ap.add_argument("--story", default="h1", help="h1 (pensées) | all | préfixe de slug de histoires.py")
    a = ap.parse_args()
    if a.story == "h1":
        stories = [dict(title=TITLE, slug=SLUG, beats=BEATS, hero=TOI)]
    elif a.story.startswith("y"):
        from yscripts import STORIES as Y
        stories = [s_ for s_ in Y if a.story == "yall" or s_["slug"].startswith(a.story)]
    elif a.story.startswith("x"):
        from histoires2 import STORIES as X
        stories = [s_ for s_ in X if a.story == "xall" or s_["slug"].startswith(a.story)]
    elif a.story.startswith("g"):
        from galere import STORIES as G
        stories = [s_ for s_ in G if a.story == "gall" or s_["slug"].startswith(a.story)]
    else:
        from histoires import STORIES
        stories = [s_ for s_ in STORIES if a.story == "all" or s_["slug"].startswith(a.story)]
    for d in stories:
        load_story(d)
        render_story(a)


def render_story(a):
    segs, total = build(synth_beats())
    print("durée %.1f s" % total)
    _init(segs, total)
    if a.frames:
        from PIL import Image
        for ts in a.frames.split(","):
            p = os.path.join(tts.BUILD, "story_%s_%s.png" % (SLUG, ts))
            Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS))).save(p)
            print(p)
        return
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, SLUG + ".mp4")
    audio = os.path.join(tts.BUILD, "story-h", SLUG, "mix.wav")
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
    if STORY.get("novoice"):
        quiet = os.path.join(tts.BUILD, "story-h", SLUG, "mix_sans_voix.wav")
        mix(segs, total, quiet, voice=False)
        out2 = os.path.join(OUT, SLUG + "-sans-voix.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-i", quiet, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out2],
                       check=True)
        txt = os.path.join(OUT, SLUG + "-texte-a-enregistrer.txt")
        with open(txt, "w") as fh:
            fh.write("%s\n\nTexte à lire (les temps indiquent quand commencer chaque phrase) :\n\n" % TITLE)
            for sg in segs:
                fh.write("[%05.1f s -> %05.1f s]  %s\n" % (sg["t0"], sg["t1"], sg["text"]))
            for key in ("caption", "pinned_comment"):
                if STORY.get(key):
                    fh.write("\n%s :\n%s\n" % ({"caption": "Légende TikTok", "pinned_comment": "Commentaire à épingler"}[key],
                                                 STORY[key]))
            if STORY.get("hashtags"):
                fh.write("\nHashtags : %s\n" % " ".join(STORY["hashtags"]))
        print("->", out2, txt)


if __name__ == "__main__":
    sys.exit(main())
