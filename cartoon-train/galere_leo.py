# -*- coding: utf-8 -*-
"""Vidéos « galère » doublées par Léo (ElevenLabs). L'audio de chaque réplique est déjà découpé dans
build/story-h/<slug>/NN.wav ; story.py le réutilise tel quel."""
import copy

import galere2

PICK = {"p01-grand": "l01-grand", "p06-retard": "l02-retard", "p02-roux": "l03-roux", "p04-timide": "l04-timide",
        "p08-celibataire": "l05-celibataire", "p09-enfant-unique": "l06-enfant-unique", "p10-gourmand": "l07-gourmand"}
STORIES = []
for s in galere2.STORIES:
    if s["slug"] in PICK:
        d = copy.copy(s)
        d["slug"] = PICK[s["slug"]]
        d["out"] = "videos-leo"
        STORIES.append(d)
