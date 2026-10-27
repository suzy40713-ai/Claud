# -*- coding: utf-8 -*-
"""Rend les vidéos doublées avec les voix ElevenLabs (Léo, Adina, Aziz) déjà découpées dans build/."""
import os
import sys

os.environ.setdefault("STUDIO_VOICES", "eleven")
import engine  # noqa: E402
import sketches7  # noqa: E402

engine.OUT = os.path.join(engine.HERE, "videos-leo")
only = sys.argv[1:] or ["e01", "e03"]
for sk in sketches7.SKETCHES:
    if any(sk["slug"].startswith(o) for o in only):
        engine.render(sk)
