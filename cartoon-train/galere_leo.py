# -*- coding: utf-8 -*-
"""Vidéos « galère » doublées par Léo (ElevenLabs). L'audio de chaque réplique est déjà découpé dans
build/story-h/<slug>/NN.wav ; story.py le réutilise tel quel."""
import copy

import galere2

PICK = {"p01-grand": "l01-grand", "p06-retard": "l02-retard"}
STORIES = []
for s in galere2.STORIES:
    if s["slug"] in PICK:
        d = copy.copy(s)
        d["slug"] = PICK[s["slug"]]
        d["out"] = "videos-leo"
        STORIES.append(d)
