# -*- coding: utf-8 -*-
"""Format « FAUX ! » : un narrateur calme énonce une idée reçue, un type furieux débarque en hurlant
« FAUX, espèce de fils de pute ! » puis rétablit la vérité. Narrateur = Léo, le furieux = Aziz (ElevenLabs).
Audio déposé dans build/story-h/<slug>/NN_<voix>.wav (voir momo_leo.py pour le principe)."""
import copy

from story import B
from sketches import P, SKIN

NARR = P(skin=SKIN[1], hair=("sidepart", "#3a2a1f"), top=("cardigan", "#6a994e", "#f2e8cf"), bottom=("pants", "#264653"),
         shoes="#1b1b1b", glasses=True)
FURIEUX = P(skin=SKIN[4], hair=("buzz", "#1c1412"), top=("tshirt", "#e63946"), bottom=("pants", "#1f1f1f"),
            shoes="#ffffff", beard="#1c1412", R=118)
V_N = ("eleven-leo", None, 1.0, 0.0)
V_F = ("eleven-aziz", None, 1.0, 0.0)
XN, XF = 300, 790


def calm(text, scene, tag=None):
    o = dict(expr="smile", look="CAM")
    if tag:
        o["tag"] = (tag, "#ffd166")
    return B(text, scene, [(NARR, XN, o)], (XN + 120, 1000, 1.15), talk=0, voice=V_N)


def faux(text, scene, tag="FAUX !"):
    cast = [(NARR, XN, dict(expr="shocked", look=(1, 0))),
            (FURIEUX, XF, dict(expr="angry", look=(-1, 0)))]
    return B(text, scene, cast, (XF - 120, 1000, 1.18), talk=1, voice=V_F, red=True, stamp=tag)


STORIES = [
    dict(slug="fx01-idees-recues", title="Les idées reçues que tout le monde croit", hero=NARR,
         hook_text="Tu crois encore à ça ?", caption_y=1390, caps="keywords", no_title=True, out="videos-faux",
         caption="Les idées reçues que TOUT le monde croit 😤 Tu y croyais à laquelle ?",
         hashtags=["#faux", "#ideesrecues", "#lesaviezvous", "#humour", "#animation", "#pourtoi", "#fyp"],
         beats=[
             calm("Les poissons rouges ont une mémoire de trois secondes.", "park", "3 SECONDES"),
             faux("FAUX, espèce de fils de pute ! Un poisson rouge se souvient des choses pendant des mois.",
                  "burstblue"),
             calm("On n'utilise que dix pour cent de notre cerveau.", "waiting", "10 %"),
             faux("FAUX, fils de pute ! On utilise presque tout notre cerveau. Juste pas tout en même temps.",
                  "burst"),
             calm("La Grande Muraille de Chine se voit depuis l'espace.", "park", "ESPACE"),
             faux("Encore FAUX, espèce de gros fils de pute ! À l'œil nu, depuis l'orbite, on ne la voit "
                  "pratiquement pas.", "burstyellow"),
             calm("Les taureaux détestent la couleur rouge.", "park", "ROUGE"),
             faux("Mais t'es sérieux ? FAUX, fils de pute ! Ils voient mal le rouge. C'est le mouvement de la cape "
                  "qui les énerve.", "burst", "FAUX FAUX FAUX"),
             calm("Napoléon était tout petit.", "waiting", "TOUT PETIT"),
             faux("FAUX, fils de pute ! Environ un mètre soixante-neuf. Normal pour l'époque.", "burstblue"),
             calm("Euh… abonnez-vous pour d'autres idées reçues ?", "burst"),
             faux("Abonne-toi, fils de pute. Et dis en commentaire à laquelle tu croyais.", "burst",
                  "ABONNE-TOI"),
         ]),
]
for b in STORIES[0]["beats"]:
    if b["fx"]["voice"] is V_F and b is STORIES[0]["beats"][-1]:
        b["fx"]["cta"] = True


# --- Version 2 : un seul thème, et l'insulte vise le spectateur (le perso regarde la caméra) ---
PROF = P(skin=SKIN[2], hair=("spiky", "#1c1412"), top=("hoodie", "#e63946", "#c92f3b"), bottom=("pants", "#264653"),
         shoes="#ffffff", R=116)
CLOSE = (540, 1000, 1.3)


def croit(text, scene, tag=None):
    o = dict(expr="smug", look="CAM")
    if tag:
        o["tag"] = (tag, "#ffd166")
    return B(text, scene, [(PROF, 540, o)], CLOSE)


def faux_toi(text, scene, stamp="FAUX !"):
    return B(text, scene, [(PROF, 540, dict(expr="angry", look="CAM", pose="gesture"))], (540, 980, 1.45),
             red=True, stamp=stamp)


def corps(slug, theme, hook, caption, beats):
    return dict(slug=slug, title=theme, hero=PROF, beats=beats, hook_text=hook, caption_y=1390, caps="keywords",
                out="videos-faux", caption=caption,
                hashtags=["#faux", "#corpshumain", "#lesaviezvous", "#humour", "#animation", "#pourtoi", "#fyp"])


STORIES.append(corps(
    "fx02-corps-humain", "Le corps humain : tout ce que tu crois est faux", "Tout ce que tu crois sur ton corps est FAUX",
    "Tout ce que tu crois sur ton corps est FAUX 😤 Tu y croyais à combien ?", [
        croit("Tu crois que les ongles et les cheveux continuent de pousser après la mort ?", "burstblue",
              "APRÈS LA MORT"),
        faux_toi("FAUX, espèce de fils de pute ! La peau sèche et se rétracte. Ça donne juste l'impression qu'ils "
                 "poussent.", "burst"),
        croit("Tu crois qu'on perd presque toute sa chaleur par la tête ?", "park", "LA TÊTE"),
        faux_toi("FAUX, fils de pute ! La tête perd à peu près autant de chaleur que n'importe quelle partie "
                 "de ton corps qui n'est pas couverte.", "burstyellow"),
        croit("Tu crois que faire craquer ses doigts donne de l'arthrose ?", "waiting", "CRAC"),
        faux_toi("Encore FAUX, espèce de gros fils de pute ! Les études n'ont trouvé aucun lien.", "burst",
                 "ENCORE FAUX"),
        croit("Tu crois qu'il faut attendre deux heures après avoir mangé avant de te baigner ?", "pool",
              "2 HEURES"),
        faux_toi("FAUX, fils de pute ! Aucune étude ne montre que manger avant de nager fait couler qui que ce soit.",
                 "burstblue"),
        croit("Et tu crois qu'on avale des araignées en dormant ?", "burstyellow", "ARAIGNÉES"),
        faux_toi("FAUX, fils de pute ! Une araignée fuit un humain qui respire, qui bouge et qui ronfle. "
                 "Même toi.", "burst"),
        faux_toi("Alors, tu y croyais à combien ? Écris-le en commentaire, espèce de fils de pute. "
                 "Et abonne-toi.", "burst", "ABONNE-TOI"),
    ]))
STORIES[-1]["beats"][-1]["fx"]["cta"] = True
