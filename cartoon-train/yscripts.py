# -*- coding: utf-8 -*-
"""Série « virale » : 3 histoires écrites et relues par une équipe d'agents (build/viral/scripts.json → ici).

Convertit le format JSON des scripts en plans pour story.py, en corrigeant automatiquement les écarts
aux contraintes du moteur (personnage assis sans siège, chevauchements, textes trop longs).
"""
import json
import os

from story import B
from histoires import FEMME, FEMME2, HOMME, HOMME2, PATRON, SERVEUR, CONTROLEUR, MERE, NOIR
from sketches import P, SKIN

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "viral_scripts.json")

HEROES = [
    P(skin=SKIN[2], hair=("sidepart", "#2b211c"), top=("hoodie", "#e63946", "#c92f3b"), bottom=("pants", "#1d3557"),
      shoes="#ffffff"),
    P(skin=SKIN[4], hair=("curly", "#1c1412"), top=("hoodie", "#118ab2", "#0e7596"), bottom=("pants", "#1b1b1b"),
      shoes="#ffffff"),
    P(skin=SKIN[0], hair=("spiky", "#c26a2b"), top=("hoodie", "#ffbe0b", "#e0a800"), bottom=("pants", "#264653"),
      shoes="#ffffff", freckles=True),
]
WHO = dict(FEMME=FEMME, FEMME2=FEMME2, HOMME=HOMME, HOMME2=HOMME2, PATRON=PATRON, SERVEUR=SERVEUR,
           CONTROLEUR=CONTROLEUR, MERE=MERE, NOIR=NOIR)
LOOK = dict(CAM="CAM", LEFT=(-1, 0), RIGHT=(1, 0), UP=(0, -0.6), DOWN=(0, 0.6))
TAGCOL = dict(green="#25d366", red="#ff4757", yellow="#ffd166", blue="#7fc8f8")
SEATED_OK = {"bus", "cafe", "restaurant", "cinema", "waiting", "pool", "plane", "park", "beach"}


def _clip(s, n):
    s = (s or "").strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def convert(js, idx):
    hero = HEROES[idx % len(HEROES)]
    beats = []
    for b in js["beats"]:
        scene = b["scene"]
        cast = []
        standing_x = []
        seated_used = False
        for c in b["cast"][:3]:
            spec = hero if c["who"] == "HERO" else WHO.get(c["who"], HOMME)
            seated = bool(c.get("seated")) and scene in SEATED_OK and not seated_used
            if seated:
                x = 932
                seated_used = True
            else:
                x = max(150, min(900, int(c.get("x", 540))))
                # éviter de superposer deux personnages debout (ou un debout sur le siège)
                for _ in range(8):
                    clash = [ox for ox in standing_x if abs(ox - x) < 230] + ([932] if seated_used and abs(x - 932) < 230 else [])
                    if not clash:
                        break
                    x = x - 240 if x > 520 else x + 240
                    x = max(150, min(900, x))
                standing_x.append(x)
            o = dict(expr=c.get("expr", "neutral"), look=LOOK.get(c.get("look", "CAM"), "CAM"))
            if seated:
                o["seated"] = True
            if c.get("pose") in ("gesture", "up"):
                o["pose"] = c["pose"]
            if c.get("bubble"):
                o["bubble"] = _clip(c["bubble"], 34)
                o["bubble_at"] = 0.25
            if c.get("tag"):
                o["tag"] = (_clip(c["tag"], 16).upper(), TAGCOL.get(c.get("tag_color", "yellow"), "#ffd166"))
            if c.get("ghost"):
                o["ghost"] = 0.35
            cast.append((spec, x, o))
        # plan de caméra
        main = next((c for c in cast if c[0] is hero), cast[0])
        hx = main[1] - (25 if main[2].get("seated") else -20)
        xs = [c[1] for c in cast]
        shot = dict(wide=(540, 1000, 1.05), hero_close=(hx, 990, 1.6), extreme=(hx, 965, 1.8),
                    two_shot=((min(xs) + max(xs)) / 2, 1000, 1.15 if max(xs) - min(xs) > 300 else 1.3))[b.get("shot", "wide")]
        fx = {}
        for e in b.get("fx", []):
            if e in ("rings", "red", "silence", "rewind", "freeze"):
                fx[e] = True
            elif e == "dark":
                fx["dark"] = float(b.get("dark_level") or 0.45)
            elif e == "mid_cta":
                fx["mid_cta"] = True
            elif e == "final_cta":
                fx["cta"] = True
        if b.get("crowd"):
            fx["crowd"] = [_clip(x, 22) for x in b["crowd"][:6]]
        if b.get("inner"):
            fx["inner"] = _clip(b["inner"], 30)
        if b.get("notif"):
            fx["notif"] = _clip(b["notif"], 34)
            fx["notif_at"] = 0.2
            if b.get("notif_from"):
                fx["notif_from"] = _clip(b["notif_from"], 24)
        beats.append(B(b["narration"].strip(), scene, cast, shot, **fx))
    slug = js["slug"].strip().lower().replace(" ", "-")
    if not slug.startswith("y"):
        slug = "y%02d-%s" % (idx + 1, slug)
    return dict(slug=slug, title=js["title"].strip(), hero=hero, beats=beats, hook_text=_clip(js["hook_text"], 30),
                caption_y=1330, novoice=True, out="videos-viral", caption=js.get("caption"),
                pinned_comment=js.get("pinned_comment"), hashtags=js.get("hashtags"))


STORIES = []
if os.path.exists(SRC):
    with open(SRC) as fh:
        _data = json.load(fh)
    STORIES = [convert(js, i) for i, js in enumerate(_data)]
