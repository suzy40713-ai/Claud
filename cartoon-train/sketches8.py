# -*- coding: utf-8 -*-
"""Série 8 : sketchs animés en ANGLAIS pour la campagne UGC Rift (application de vols pas chers).
Exemples à montrer à la marque : à remplacer par ses propres scripts une fois la candidature acceptée.
Aucun chiffre d'économie inventé : seulement la promesse que Rift met en avant (« cheap flights other sites miss »)."""
from sketches import P, SKIN
from sketches4 import L
from sketches5 import GERARD

VOICES = dict(E=("am_michael", 1.0, 0.0))


def sk(n, name, title, hook, scene, prop, amb, V, A, v_voice, a_voice, lines, **kw):
    d = dict(slug="r%02d-%s" % (n, name), title=title, hook_text=hook, scene=scene, prop=prop, ambience=amb,
             cast=dict(E=GERARD, V=V, A=A),
             voices=dict(E=("am_michael", 1.0, 0.0), V=(v_voice, 1.0, 0.0), A=(a_voice, 1.0, 0.0)),
             lines=L(*lines), cta=True, cta_dy=-120, caption_y=1440, voice_mode="en",
             cta_title="Check out Rift", cta_sub="Cheap flights other sites miss", cta_btn="Try Rift")
    d.update(kw)
    return d


END = "Vs Before you book your next flight, check Rift first."

SKETCHES = [
    sk(1, "overpaid", "Gerald always overpays · #ad", "He paid WAY too much", "plane", "phone", "vehicle",
       P(skin=SKIN[4], hair=("bob", "#1c1412"), top=("cardigan", "#8338ec", "#ffffff"), glasses=True),
       P(skin=SKIN[1], hair=("bun", "#e8c15a"), top=("uniform", "#14213d", "#e63946"), bottom=("skirt", "#14213d"),
         shoes="#1b1b1b", held="tray", lipstick=True),
       "af_heart", "af_bella",
       ["Em Excuse me. I paid full price for this seat. The expensive way. The classy way.",
        "Vn Okay. I'm in the same row.",
        "Eg Impossible. You clearly found some kind of trick.",
        "Vs Kind of. I used Rift. It finds cheap flights that other sites miss.",
        "Ea Cheap flights are for people with no taste.",
        "@ENTER",
        "An Everything okay here?",
        "Eg Tell her. My ticket is better than hers.",
        "An Same flight. Same row. Same tiny pretzels.",
        "Ek Then why did I pay so much more?",
        "Aa Because you didn't check Rift, sir.",
        "@EXIT",
        END]),
    sk(2, "tabs", "Gerald and his 47 tabs · #ad", "47 tabs open. Still no flight.", "waiting", "magazine", "room",
       P(skin=SKIN[3], hair=("curly", "#1c1412"), top=("tshirt", "#06d6a0")),
       P(skin=SKIN[0], hair=("sidepart", "#d9d9d9"), top=("blazer", "#1f1f1f", "#ffffff"), bottom=("pants", "#1f1f1f"),
         shoes="#1b1b1b", glasses=True, R=112),
       "am_adam", "bm_george",
       ["Ea Don't talk to me. I have forty seven tabs open. I'm finding the perfect flight.",
        "Vn You've been doing that for three days.",
        "Eg Prices keep changing! It's a conspiracy!",
        "Vs I just open Rift. It finds the cheap flights for me.",
        "Em Apps are for amateurs. I'm a professional searcher.",
        "@ENTER",
        "An Gerald, the trip is tomorrow. Did you book it?",
        "Eg Almost. I just need to refresh forty seven more times.",
        "An Your friend booked hers in two minutes. On Rift.",
        "Ek Two minutes? That's not a search. That's magic.",
        "Aa It's called an app, Gerald.",
        "@EXIT",
        END]),
    sk(3, "staycation", "Gerald says travel is too expensive · #ad", "“Travel is only for rich people”",
       "cafe", "laptop", "cafe",
       P(skin=SKIN[1], hair=("ponytail", "#e8c15a"), top=("hoodie", "#2a9d8f", "#21867a")),
       P(skin=SKIN[4], hair=("short", "#1c1412"), top=("polo", "#e63946"), bottom=("pants", "#1f1f1f"),
         shoes="#1f1f1f", beard="#1c1412", held="clipboard"),
       "af_bella", "am_eric",
       ["Eg Traveling is only for rich people. Everyone knows that.",
        "Vn I'm flying to Lisbon next month.",
        "Em You must have won the lottery.",
        "Vs No. I found a cheap flight on Rift. It finds deals other sites miss.",
        "Ea There are no deals. Only lies and hidden fees.",
        "@ENTER",
        "An Hey, I heard someone say Rift. I booked my weekend trip with it too.",
        "Eg You too? Is everyone traveling except me?",
        "An Basically, yes.",
        "Ek Fine. Show me this app. Just for science.",
        "Aa Welcome to cheap flights, Gerald.",
        "@EXIT",
        END]),
]
