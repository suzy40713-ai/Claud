# -*- coding: utf-8 -*-
"""Sketch « normal » de ~3 minutes au format YouTube (16:9, 1920x1080) : « Gérard, le client est roi ».

Réutilise les personnages (engine.person) et les voix Piper/Kokoro du moteur vertical.

Usage :
    python3 youtube.py --frames 3,40,100     # images fixes de contrôle
    python3 youtube.py                       # rend videos-youtube/le-client-est-roi.mp4
    python3 youtube.py --fps 30              # (par défaut 30 images/s)
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
from engine import person, lamp, darker
from render import (INK, f, ease, lerp, circle, ellipse, rect, line, path, text_el, wrap)
from sketches import SKIN

W, H = 1920, 1080
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos-youtube")
SLUG = "le-client-est-roi"
TITLE = "LE CLIENT EST ROI"
SC = 0.86                       # échelle des personnages (espace vertical -> 1080 de haut)
FLOOR = 850                     # ligne des pieds
TY = FLOOR - 1590 * SC

CAST = {
    "G": dict(name="Gérard", voice="pierre", col="#ffb36b",
              spec=dict(skin=SKIN[2], hair=("sidepart", "#3a2a1f"), top=("blazer", "#3d405b", "#ffffff"),
                        bottom=("pants", "#2b2d42"), shoes="#1b1b1b", glasses=True, mustache="#3a2a1f", R=112)),
    "L": dict(name="Léa", voice="siwis", col="#ff9ecb",
              spec=dict(skin=SKIN[1], hair=("ponytail", "#e8c15a"), top=("hoodie", "#2a9d8f", "#21867a"),
                        bottom=("pants", "#264653"), shoes="#ffffff", earrings="#ffd166")),
    "K": dict(name="Karim", voice="tom", col="#9fd3ff",
              spec=dict(skin=SKIN[4], hair=("short", "#1c1412"), top=("polo", "#e63946"),
                        bottom=("pants", "#1f1f1f"), shoes="#1f1f1f", beard="#1c1412")),
    "O": dict(name="Odile", voice="jessica", col="#d7b8ff",
              spec=dict(skin=SKIN[0], hair=("bob", "#8d5a3b"), top=("uniform", "#9d0208", "#f2c23a"),
                        bottom=("pants", "#1f1f1f"), shoes="#1f1f1f", lipstick=True)),
}

# ---------------------------------------------------------------- scénario
# ("@SCENE", décor, titre)  ("@IN", qui, x)  ("@OUT", qui)  ("@SIGN", texte)
# (qui, humeur, geste, texte)   humeurs : n s m a g k d   gestes : d(own) g(esture) p(oint) u(p) w(ave)
SCRIPT = [
    ("@SCENE", "cafe", "Chez Léa, 8 h 15"),
    ("@IN", "G", 1180),
    ("G", "n", "d", "Bonjour. Je voudrais un café. Mais sans café."),
    ("L", "s", "d", "Un déca, donc ?"),
    ("G", "a", "g", "Non, pas un déca. Un café sans café. Très chaud, mais froid."),
    ("L", "n", "d", "D'accord. Donc... de l'eau tiède."),
    ("G", "g", "p", "De l'eau ? Je ne paie pas pour de l'eau ! Alors c'est gratuit !"),
    ("L", "a", "d", "Monsieur, c'est vous qui avez demandé de l'eau."),
    ("G", "m", "g", "Le client est roi. Et un roi ne paie jamais."),
    ("L", "s", "d", "Les rois paient aussi. Surtout ceux qui ont deux euros dans la poche."),
    ("G", "a", "g", "J'ai un coupon de réduction. Périmé depuis deux mille neuf, mais l'intention est là."),
    ("L", "s", "d", "L'intention est adorable. La réduction, beaucoup moins."),
    ("G", "g", "p", "Je veux parler au responsable !"),
    ("L", "s", "w", "Avec plaisir. Karim ! Un client veut te voir !"),
    ("@IN", "K", 1560),
    ("K", "n", "d", "Bonjour monsieur. Un problème ?"),
    ("G", "a", "g", "Cette employée refuse de me servir un café sans café."),
    ("K", "n", "d", "Ah. Gérard. C'est vous."),
    ("G", "k", "d", "Vous... vous me connaissez ?"),
    ("@SIGN", "GÉRARD : PAYEZ D'ABORD"),
    ("K", "s", "p", "Tout le quartier vous connaît. On a même fait une affiche."),
    ("G", "m", "g", "Je suis flatté. Je prends un autographe... non, un café. Gratuit."),
    ("K", "n", "g", "Le café, c'est deux euros. Les excuses, c'est gratuit. Choisissez."),
    ("G", "a", "p", "Je vais écrire un avis. Une étoile !"),
    ("L", "s", "d", "Tu as déjà écrit trois cents avis. Tous une étoile. On les a mis en vitrine."),
    ("G", "g", "p", "Vous allez le regretter ! Je vais au cinéma ! Eux, au moins, ils respectent leurs clients !"),
    ("@OUT", "G"),

    ("@SCENE", "cinema", "Au cinéma, 20 h 00"),
    ("@IN", "G", 1180),
    ("O", "s", "w", "Bonsoir, bienvenue au cinéma ! Une place ?"),
    ("G", "m", "g", "Oui. Premier rang, au milieu, et que personne ne respire."),
    ("O", "n", "d", "Personne ne respire... Ça ne va pas être possible."),
    ("G", "a", "g", "Alors je veux un siège en velours. Avec un coussin. Et un majordome."),
    ("O", "s", "g", "On a un siège avec un ressort. Et un contrôleur qui s'appelle Jean-Paul."),
    ("G", "g", "p", "Quel scandale ! Le film dure combien de temps ?"),
    ("O", "n", "d", "Deux heures dix."),
    ("G", "a", "g", "Trop long. Je paie deux heures. Pas deux heures dix."),
    ("O", "m", "g", "D'accord. Je vous coupe les dix dernières minutes. C'est la fin, ça tombe bien."),
    ("G", "k", "u", "Quoi ? Mais je veux voir la fin !"),
    ("O", "m", "d", "Alors c'est deux heures dix. Au même prix."),
    ("G", "a", "d", "Hmm. Très bien. Mais si le film est nul, je me fais rembourser."),
    ("O", "s", "d", "Vous avez ma parole."),
    ("@SCENE", "cinema", "Deux heures dix plus tard"),
    ("G", "g", "p", "Cette fin est nulle ! Je veux être remboursé !"),
    ("O", "n", "d", "Monsieur, vous n'avez pas vu la fin. Vous dormiez."),
    ("G", "k", "d", "Je... dormais ?"),
    ("O", "m", "g", "Vous avez ronflé pendant tout le film. Les gens ont applaudi."),
    ("G", "d", "d", "Ah. Personne ne m'avait jamais applaudi."),
    ("O", "s", "g", "Voilà. Vous êtes un artiste."),
    ("@OUT", "G"),

    ("@SCENE", "resto", "Au restaurant, 21 h 30"),
    ("@IN", "G", 520),
    ("@IN", "K", 1000),
    ("K", "n", "d", "Bonsoir monsieur. Vous avez réservé ?"),
    ("G", "s", "d", "Non. Mais je voudrais une table. S'il vous plaît."),
    ("K", "k", "u", "Il a dit... s'il vous plaît ?"),
    ("G", "s", "g", "Oui. Et je paierai. D'avance. Même le pourboire."),
    ("K", "k", "w", "Léa ! Odile ! Venez voir, il a changé !"),
    ("@IN", "L", 1400),
    ("@IN", "O", 1700),
    ("L", "k", "u", "Gérard ! Tu as dit s'il vous plaît ?"),
    ("O", "s", "g", "Il a même dit merci hier, à la caisse. J'ai pleuré."),
    ("G", "m", "g", "Qu'est-ce que vous croyez ? Ça m'a coûté cher d'être gentil."),
    ("K", "s", "g", "Pour fêter ça, le café est offert."),
    ("G", "g", "p", "Offert ? Alors j'en prends dix ! Et sans café !"),
    ("L", "a", "d", "Et voilà. Il n'a pas tenu cinq minutes."),
    ("K", "n", "p", "Gérard. Dehors."),
    ("G", "a", "u", "Mais... le client est roi !"),
    ("O", "s", "g", "Et le roi... est viré."),
    ("@OUT", "G"),
    ("L", "s", "w", "Si tu connais un Gérard, dis-le moi en commentaire !"),
    ("K", "s", "w", "Et abonne-toi : sa prochaine aventure arrive très vite !"),
]
EXPR = {"n": "neutral", "s": "smile", "m": "smug", "a": "annoyed", "g": "angry", "k": "shocked", "d": "sad"}
POSE = {"d": "down", "g": "gesture", "p": "point", "u": "up", "w": "wave"}
AMBI = {"cafe": "cafe", "cinema": "room", "resto": "cafe"}
INTRO = 3.2
IN_DUR = 1.5
OUT_DUR = 1.6
SCENE_GAP = 1.4
OUTRO = 6.0


# ---------------------------------------------------------------- voix
def synth():
    d = os.path.join(tts.BUILD, "yt")
    os.makedirs(d, exist_ok=True)
    out = {}
    for i, it in enumerate(SCRIPT):
        if it[0].startswith("@"):
            continue
        who, _, _, text = it
        vkey = CAST[who]["voice"]
        final = os.path.join(d, "%03d_%s.wav" % (i, who))
        if not os.path.exists(final):
            raw = final.replace(".wav", "_raw.wav")
            sp = 0.97
            if vkey in engine.PIPER_FR:
                engine.piper_say(text.replace("...", ","), vkey, sp, raw)
            else:
                engine.kokoro_wav(text.replace("...", ","), "femme1", 1.0 / sp, raw)
            tts.to_sr(raw, final, 0)
            os.remove(raw)
        out[i] = final
    return out


# ---------------------------------------------------------------- timeline
class T:
    pass


def build(wavs, gap=0.25):
    tl = T()
    tl.items = []        # événements : dict(kind, t0, t1, ...)
    t = INTRO
    scene = None
    for i, it in enumerate(SCRIPT):
        k = it[0]
        if k == "@SCENE":
            if scene is not None:
                t += 0.3
            tl.items.append(dict(kind="scene", t0=t, t1=t + SCENE_GAP, scene=it[1], title=it[2]))
            t += SCENE_GAP
            scene = it[1]
        elif k == "@IN":
            tl.items.append(dict(kind="in", t0=t, t1=t + IN_DUR, who=it[1], x=it[2]))
            t += IN_DUR * (0.55 if it[1] in ("L", "O") else 0.8)
        elif k == "@OUT":
            tl.items.append(dict(kind="out", t0=t, t1=t + OUT_DUR, who=it[1]))
            t += OUT_DUR * 0.9
        elif k == "@SIGN":
            tl.items.append(dict(kind="sign", t0=t, t1=t + 4.5, text=it[1]))
        else:
            who, mood, pose, text = it
            x, sr = tts.read_wav(wavs[i])
            dur = len(x) / sr
            hop = sr // FPS
            env = np.array([np.sqrt(np.mean(x[j * hop:(j + 1) * hop] ** 2) + 1e-12)
                            for j in range(int(math.ceil(len(x) / hop)))])
            env = env / (np.percentile(env, 90) + 1e-9)
            tl.items.append(dict(kind="line", t0=t, t1=t + dur, who=who, mood=EXPR[mood], pose=POSE[pose],
                                 text=text, wav=wavs[i], env=env))
            t += dur + gap
    tl.last_line_end = t
    tl.total = t + 0.6 + OUTRO
    tl.end_card = t + 0.6
    return tl


def scene_at(tl, t):
    cur = None
    for it in tl.items:
        if it["kind"] == "scene" and it["t0"] <= t:
            cur = it
    return cur


def char_state(tl, t, who):
    """Position / visibilité / marche d'un personnage selon les événements @IN / @OUT, par décor."""
    sc = scene_at(tl, t)
    t_scene = sc["t0"] if sc else 0
    vis, x, walk = False, 0.0, None
    # personnages présents dès le début d'un décor (le vendeur / la vendeuse / le personnel)
    base = {"cafe": {"L": 700}, "cinema": {"O": 700}, "resto": {}}.get(sc["scene"] if sc else "cafe", {})
    if who in base:
        vis, x = True, base[who]
    for it in tl.items:
        if it["t0"] < t_scene or it["t0"] > t:
            continue
        if it["kind"] == "in" and it["who"] == who:
            u = (t - it["t0"]) / IN_DUR
            side = 1 if it["x"] > 960 else -1
            x0 = W + 250 if side > 0 else -250
            if u < 1:
                x = lerp(x0, it["x"], ease(u))
                walk = (t - it["t0"]) * 9
            else:
                x = it["x"]
            vis = True
        elif it["kind"] == "out" and it["who"] == who and vis:
            u = (t - it["t0"]) / OUT_DUR
            x = lerp(x, W + 300, ease(min(1, u))) if u < 1 else W + 300
            walk = (t - it["t0"]) * 10
            if u >= 1:
                vis = False
    return vis, x, walk


# ---------------------------------------------------------------- décors 1920x1080
def beams(x, y, w, h):
    return rect(x, y, w, h, "#8b5e3c", sw=5)


def bg_cafe(t):
    s = [rect(-200, -200, 2400, 1100, "#2f5d50", stroke="none", sw=0)]
    for xx in range(-200, 2200, 160):
        s.append(line(xx, 0, xx, 760, sw=3, stroke="#27504a"))
    s.append(rect(-200, 700, 2400, 60, "#8b5e3c", stroke="none", sw=0))
    s.append(rect(-200, 760, 2400, 600, "#b5651d", stroke="none", sw=0))
    for yy in range(760, 1100, 52):
        s.append(line(-200, yy, 2200, yy, sw=3, stroke="#8d4f17"))
    s.append(line(-200, 760, 2200, 760, sw=7))
    s.append(rect(60, 120, 520, 380, "#1b1b1b", rx=10, stroke="#8b5e3c", sw=18))
    s.append(text_el(320, 205, "CHEZ LÉA", 62, "#ffffff"))
    for k, txt in enumerate(("Café ........ 2 €", "Thé ......... 3 €", "Croissant .. 2 €")):
        s.append(text_el(320, 285 + k * 62, txt, 38, "#f1faee", weight=500))
    s.append(rect(760, 150, 300, 220, "#a8dadc", rx=8, sw=9))
    s.append(line(910, 150, 910, 370, sw=7))
    s.append(line(760, 260, 1060, 260, sw=7))
    for lx in (420, 1380, 1760):
        s.append(lamp(lx, 0, 80, "#e9c46a"))
    for k in range(5):
        s.append(rect(1180 + k * 100, 500, 62, 80, ["#f1faee", "#e9c46a", "#e76f51"][k % 3], rx=10, sw=5))
    s.append(rect(1150, 585, 560, 22, "#8b5e3c", sw=5))
    return "".join(s)


def bg_cinema(t):
    s = [rect(-200, -200, 2400, 1100, "#5a0f1d", stroke="none", sw=0)]
    for xx in range(-200, 2200, 120):
        s.append(rect(xx, 0, 60, 760, "#4a0c18", stroke="none", sw=0))
    s.append(rect(-200, 760, 2400, 600, "#2b2d42", stroke="none", sw=0))
    for xx in range(-200, 2200, 160):
        s.append(rect(xx, 760, 80, 600, "#22243a", stroke="none", sw=0))
    s.append(line(-200, 760, 2200, 760, sw=7))
    for k, (c1, c2, ttl) in enumerate((("#264653", "#e9c46a", "LA FIN"), ("#6a040f", "#ffd166", "DRAME"),
                                       ("#023e8a", "#caf0f8", "ESPACE"))):
        x = 1050 + k * 270
        s.append(rect(x, 150, 220, 330, c1, rx=6, stroke="#ffd166", sw=8))
        s.append(circle(x + 110, 280, 52, c2, sw=6))
        s.append(text_el(x + 110, 430, ttl, 34, "#ffffff"))
    s.append(rect(120, 120, 760, 90, "#111111", rx=10, sw=7))
    s.append(text_el(500, 186, "CINÉMA  LE PARADIS", 54, "#ffd166"))
    for k in range(14):
        s.append(circle(150 + k * 53, 100, 7, "#ffd166" if (k + int(t * 3)) % 2 else "#fff3b0", sw=3))
    return "".join(s)


def bg_resto(t):
    s = [rect(-200, -200, 2400, 1100, "#e9d8a6", stroke="none", sw=0)]
    for xx in range(-200, 2200, 200):
        s.append(rect(xx, 0, 100, 760, "#e0cb94", stroke="none", sw=0))
    s.append(rect(-200, 760, 2400, 600, "#7f5539", stroke="none", sw=0))
    for xx in range(-200, 2200, 200):
        s.append(line(xx, 760, xx - 120, 1100, sw=3, stroke="#5b3a29"))
    s.append(line(-200, 760, 2200, 760, sw=7))
    s.append(rect(1200, 110, 560, 380, "#7cc6f2", rx=10, stroke="#8b5e3c", sw=16))
    s.append(line(1480, 110, 1480, 490, sw=8, stroke="#8b5e3c"))
    s.append(line(1200, 300, 1760, 300, sw=8, stroke="#8b5e3c"))
    s.append(circle(1600, 200, 36, "#ffd166", sw=5))
    s.append(rect(160, 130, 420, 260, "#ffffff", rx=6, stroke="#8b5e3c", sw=14))
    s.append(path("M 190 350 Q 280 200 360 290 T 540 240", stroke="#2a9d8f", sw=10))
    for lx in (700, 1000):
        s.append(lamp(lx, 0, 150, "#ffd166"))
    return "".join(s)


def front_cafe(t):
    s = [rect(260, 650, 800, 450, "#8d6346", sw=7)]
    s.append(rect(240, 628, 840, 40, "#d9b38c", rx=10, sw=7))
    for xx in range(300, 1060, 130):
        s.append(line(xx, 668, xx, 1090, sw=4, stroke="#6f4b33"))
    # machine à café sur le comptoir
    s.append(rect(300, 520, 230, 112, "#adb5bd", rx=14, sw=7))
    s.append(rect(325, 590, 40, 40, "#1b1b1b", rx=4, sw=4))
    s.append(circle(460, 560, 16, "#e63946", sw=4))
    for k in range(2):
        yy = 505 - ((t * 36 + k * 20) % 50)
        s.append(path("M %s %s q 10 -10 0 -20" % (f(410 + k * 40), f(yy)), stroke="#ffffff", sw=4,
                      extra='opacity="0.7"'))
    s.append(rect(880, 580, 60, 50, "#ffffff", rx=8, sw=5))
    return "".join(s)


def front_cinema(t):
    s = [rect(260, 650, 800, 450, "#3a0ca3", sw=7)]
    s.append(rect(240, 628, 840, 40, "#7209b7", rx=10, sw=7))
    s.append(rect(380, 700, 560, 110, "#111111", rx=12, sw=5))
    s.append(text_el(660, 775, "BILLETS", 56, "#ffd166"))
    s.append(rect(740, 585, 90, 44, "#ffd166", rx=6, sw=5))
    s.append(rect(300, 560, 60, 70, "#e63946", rx=6, sw=5))
    s.append(text_el(330, 610, "POP", 20, "#ffffff"))
    return "".join(s)


def front_resto(t):
    s = []
    for tx in (80, 1000, 1500):
        s.append(rect(tx, 770, 300, 20, "#ffffff", rx=8, sw=5))
        s.append(rect(tx + 130, 790, 40, 150, "#6f4b33", sw=6))
        s.append(rect(tx + 120, 750, 18, 22, "#e63946", sw=4))
        yy = 738 - (math.sin(t * 6 + tx) * 2)
        s.append(path("M %s %s q 5 -12 0 -20 q -6 8 0 20" % (f(tx + 129), f(yy)), fill="#ffd166", sw=3))
    return "".join(s)


SCN = {"cafe": (bg_cafe, front_cafe), "cinema": (bg_cinema, front_cinema), "resto": (bg_resto, front_resto)}
BEHIND = {"cafe": ("L",), "cinema": ("O",), "resto": ()}


# ---------------------------------------------------------------- image
def speaking_state(tl, t):
    cur = None
    for it in tl.items:
        if it["kind"] == "line" and it["t0"] <= t:
            cur = it
    return cur


def mouth_at(seg, t):
    if seg is None or t >= seg["t1"]:
        return 0.0
    env = seg["env"]
    k = (t - seg["t0"]) * FPS
    i0 = int(k)
    a = env[min(i0, len(env) - 1)]
    b = env[min(i0 + 1, len(env) - 1)]
    e = lerp(a, b, k - i0)
    e = 0.6 * e + 0.4 * env[max(0, min(i0 - 2, len(env) - 1))]
    m = max(0.0, min(1.0, (e - 0.18) / 0.85))
    return m * min(1.0, (seg["t1"] - t) / 0.08)


def moods_at(tl, t):
    moods = {k: "neutral" for k in CAST}
    poses = {k: ("down", -99.0) for k in CAST}
    last_who = None
    for it in tl.items:
        if it["kind"] == "line" and it["t0"] <= t:
            moods[it["who"]] = it["mood"]
            poses[it["who"]] = (it["pose"], it["t0"])
            last_who = it["who"]
    return moods, poses


def draw_char(tl, t, who, x, walk, moods, poses, cur, prev_speaker, xs):
    seg_speaking = cur is not None and cur["who"] == who and t < cur["t1"]
    mouth = mouth_at(cur, t) if seg_speaking else 0.0
    # regard : le locuteur regarde son interlocuteur, les autres regardent le locuteur
    target = None
    if seg_speaking:
        target = prev_speaker if prev_speaker in xs and prev_speaker != who else \
            next((k for k in xs if k != who), None)
    elif cur is not None and cur["who"] in xs and cur["who"] != who:
        target = cur["who"]
    look = (0.0, 0.1)
    if target is not None:
        dx = xs[target] - x
        look = (max(-1.0, min(1.0, dx / 500.0)) * 0.95, 0.05)
    ph = (t + x * 0.003 + hash(who) % 7) % 3.6
    blink = max(0.0, 1 - abs(ph / 0.07 - 1)) if ph < 0.14 else 0.0
    pose, pt = poses[who]
    if who == (cur or {}).get("who") and t >= cur["t1"] + 0.4:
        pose = "down"
    amt = ease((t - pt) / 0.25) if pose != "down" else 1.0
    if seg_speaking and pose != "down":
        amt = min(1.0, amt) * (0.85 + 0.15 * math.sin(t * 7))
    st = dict(x=0, expr=moods[who], mouth=mouth, blink=blink, look=look, pose=pose, pose_amt=amt,
              walk=walk, tilt=(0.05 * math.sin(t * 3) if seg_speaking else 0.0))
    body = person(CAST[who]["spec"], st, t)
    # on retourne le personnage vers son interlocuteur (miroir) si besoin
    flip = -1 if (target is not None and xs[target] < x - 1) else 1
    if walk is not None:
        flip = -1 if (x > 960 and walk is not None and who in xs and False) else flip
    return '<g transform="translate(%s %s) scale(%s %s)">%s</g>' % (f(x), f(TY), f(SC * flip), f(SC), body)


def captions(c, cur, t):
    if cur is None or t > cur["t1"] + 0.15:
        return ""
    info = CAST[cur["who"]]
    rows = wrap(cur["text"], 74)
    s = []
    y0 = 1030 - 56 * (len(rows) - 1)
    tag = info["name"].upper()
    w_ = max(len(r) for r in rows) * 22 + 80
    s.append(rect(960 - w_ / 2, y0 - 46, w_, 56 * len(rows) + 22, "#000000", rx=16, stroke="none", sw=0,
                  extra='opacity="0.72"'))
    s.append(text_el(960 - w_ / 2 + 22, y0 - 54, tag, 26, info["col"], anchor="start"))
    for i, r in enumerate(rows):
        s.append(text_el(960, y0 + 4 + 56 * i, r, 42, "#ffffff", weight=700))
    return "".join(s)


def intro_svg(t):
    u = ease(t / 0.5) * (1 - ease((t - INTRO + 0.6) / 0.6))
    if u <= 0:
        return ""
    s = ['<g opacity="%.3f">' % u, rect(0, 0, W, H, "#0d1b2a", stroke="none", sw=0)]
    for k in range(18):
        a = k * math.pi / 9 + t * 0.2
        s.append(path("M 960 540 L %s %s L %s %s Z" % (f(960 + 1600 * math.cos(a)), f(540 + 1600 * math.sin(a)),
                                                       f(960 + 1600 * math.cos(a + 0.12)),
                                                       f(540 + 1600 * math.sin(a + 0.12))),
                      fill="#1b263b", stroke="none", sw=0))
    s.append(rect(300, 330, 1320, 330, "#ffd166", rx=30, sw=12))
    s.append(text_el(960, 505, TITLE, 150, "#1b1b1b"))
    s.append(text_el(960, 610, "un sketch en 3 actes", 52, "#3d405b", weight=600))
    s.append("</g>")
    return "".join(s)


def scene_card(tl, t, c):
    sc = scene_at(tl, t)
    if sc is None:
        return ""
    u = t - sc["t0"]
    if u < 0 or u > SCENE_GAP + 0.3:
        return ""
    a = min(1.0, u / 0.25) * (1 - ease((u - SCENE_GAP + 0.2) / 0.5))
    if a <= 0:
        return ""
    return ('<g opacity="%.3f">%s%s</g>' % (a, rect(0, 0, W, H, "#000000", stroke="none", sw=0),
                                            text_el(960, 560, sc["title"], 84, "#ffffff")))


def sign_svg(tl, t):
    for it in tl.items:
        if it["kind"] == "sign" and it["t0"] <= t < it["t1"]:
            u = ease((t - it["t0"]) / 0.35) * (1 - ease((t - it["t1"] + 0.4) / 0.4))
            return ('<g opacity="%.3f" transform="translate(1400 330) rotate(-5) scale(%.3f)">%s%s%s</g>' % (
                u, 0.6 + 0.4 * u, rect(-330, -90, 660, 180, "#ffffff", rx=8, stroke=INK, sw=8),
                text_el(0, -20, "AVIS DE RECHERCHE", 38, "#e63946"),
                text_el(0, 50, it["text"], 44, INK)))
    return ""


def end_card(tl, t):
    u0 = t - tl.end_card
    if u0 < 0:
        return ""
    u = ease(u0 / 0.6)
    s = ['<g opacity="%.3f">' % u, rect(0, 0, W, H, "#0d1b2a", stroke="none", sw=0)]
    s.append(rect(260, 190, 1400, 700, "#ffd166", rx=40, sw=12))
    s.append(text_el(960, 360, "TU AS AIMÉ ?", 120, "#1b1b1b"))
    s.append(text_el(960, 470, "Abonne-toi pour la suite des aventures de Gérard", 50, "#3d405b", weight=600))
    pulse = 1 + 0.05 * math.sin(u0 * 6)
    s.append('<g transform="translate(960 650) scale(%.3f)">%s%s</g>' % (
        pulse, rect(-320, -80, 640, 160, "#ff0033", rx=80, sw=8), text_el(0, 28, "S'ABONNER", 84, "#ffffff")))
    s.append(text_el(960, 820, "Écris en commentaire : le pire client que tu aies connu", 40, "#1b1b1b", weight=600))
    s.append("</g>")
    return "".join(s)


def frame_svg(c, t):
    tl = c
    sc = scene_at(tl, t)
    name = sc["scene"] if sc else "cafe"
    bg, fr = SCN[name]
    cur = speaking_state(tl, t)
    moods, poses = moods_at(tl, t)
    chars = {}
    for who in CAST:
        vis, x, walk = char_state(tl, t, who)
        if vis and -200 < x < W + 200:
            chars[who] = (x, walk)
    xs = {k: v[0] for k, v in chars.items()}
    prev = None
    if cur is not None:
        for it in tl.items:
            if it["kind"] == "line" and it["t0"] < cur["t0"]:
                if it["who"] != cur["who"]:
                    prev = it["who"]
    behind, ahead = [], []
    for who, (x, walk) in sorted(chars.items(), key=lambda kv: kv[1][0]):
        g = draw_char(tl, t, who, x, walk, moods, poses, cur, prev, xs)
        (behind if who in BEHIND[name] else ahead).append(g)
    world = [bg(t)] + behind + [fr(t)] + ahead
    # caméra : petit push-in sur celui qui parle
    cx, cy, z = 960.0, 540.0, 1.0
    if cur is not None and cur["who"] in xs and t < cur["t1"] + 0.3:
        u = (t - cur["t0"]) / max(0.5, cur["t1"] - cur["t0"])
        z = 1.0 + 0.07 * ease(min(1.0, u * 1.2))
        cx = 960 + (xs[cur["who"]] - 960) * 0.3
    half_w, half_h = 960 / z, 540 / z
    cx = max(half_w, min(W - half_w, cx))
    cy = max(half_h, min(H - half_h, cy))
    tr = "translate(960 540) scale(%.4f) translate(%s %s)" % (z, f(-cx), f(-cy))
    over = captions(c, cur, t) + sign_svg(tl, t) + scene_card(tl, t, c) + intro_svg(t) + end_card(tl, t)
    if t >= tl.end_card:
        over = end_card(tl, t)
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
            '<rect width="%d" height="%d" fill="#dfe7ec"/><g transform="%s">%s</g>%s</svg>') % (
        W, H, W, H, W, H, tr, "".join(world), over)


# ---------------------------------------------------------------- rendu
_C = {}


def _init(c):
    _C["c"] = c


def _render(i):
    import cairosvg
    from PIL import Image
    png = cairosvg.svg2png(bytestring=frame_svg(_C["c"], i / FPS).encode("utf-8"), output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB").tobytes()


def mix_audio(tl, out):
    n = int(tl.total * tts.SR) + tts.SR
    mix = np.zeros(n, dtype=np.float32)
    for it in tl.items:
        pass
    # ambiances par décor
    scenes = [it for it in tl.items if it["kind"] == "scene"]
    for i, sc in enumerate(scenes):
        t1 = scenes[i + 1]["t0"] if i + 1 < len(scenes) else tl.total
        a = engine.ambience(AMBI[sc["scene"]], t1 - sc["t0"] + 0.5)
        i0 = int(sc["t0"] * tts.SR)
        seg = a[:max(0, min(len(a), n - i0))]
        mix[i0:i0 + len(seg)] += seg
    for it in tl.items:
        if it["kind"] == "line":
            x, sr = tts.read_wav(it["wav"])
            x = engine.room(x, sr)
            i0 = int(it["t0"] * sr)
            mix[i0:i0 + len(x)] += x * 0.95
        elif it["kind"] == "in":
            mix += tts.footsteps(np.arange(it["t0"], it["t0"] + IN_DUR * 0.9, 0.33), n)
            kk = np.arange(int(0.35 * tts.SR))
            j = int(it["t0"] * tts.SR)
            mix[j:j + len(kk)] += (0.12 * np.sin(2 * np.pi * 1760 * kk / tts.SR) *
                                   np.exp(-kk / (0.08 * tts.SR))).astype(np.float32)   # clochette de porte
        elif it["kind"] == "out":
            mix += tts.footsteps(np.arange(it["t0"], it["t0"] + OUT_DUR * 0.9, 0.22), n)
        elif it["kind"] == "sign":
            kk = np.arange(int(0.25 * tts.SR))
            j = int(it["t0"] * tts.SR)
            mix[j:j + len(kk)] += (0.2 * np.sin(2 * np.pi * (500 - 300 * kk / len(kk)) * kk / tts.SR) *
                                   np.exp(-kk / (0.07 * tts.SR))).astype(np.float32)
    fade = int(0.8 * tts.SR)
    end = int(tl.total * tts.SR)
    mix[end - fade:end] *= np.linspace(1, 0, fade)
    mix[end:] = 0
    tts.write_wav(out, mix / max(1.0, np.abs(mix).max() / 0.95))


def main():
    global FPS
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="")
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()
    FPS = engine.FPS = a.fps
    wavs = synth()
    tl = build(wavs)
    print("durée %.1f s (%d:%02d)" % (tl.total, tl.total // 60, tl.total % 60), flush=True)
    if a.frames:
        _init(tl)
        from PIL import Image
        for ts in a.frames.split(","):
            p = os.path.join(tts.BUILD, "yt_%s.png" % ts)
            Image.frombytes("RGB", (W, H), _render(int(float(ts) * FPS))).save(p)
            print(p)
        return
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, SLUG + ".mp4")
    audio = os.path.join(tts.BUILD, "yt", "mix.wav")
    mix_audio(tl, audio)
    nframes = int(tl.total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-", "-i", audio,
                           "-t", "%.3f" % tl.total, "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out],
                          stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(tl,)) as pool:
        for k, buf in enumerate(pool.imap(_render, range(nframes), chunksize=4)):
            ff.stdin.write(buf)
            if k % 600 == 0:
                print("  %d/%d" % (k, nframes), flush=True)
    ff.stdin.close()
    ff.wait()
    print("  -> %s" % out, flush=True)


if __name__ == "__main__":
    main()
