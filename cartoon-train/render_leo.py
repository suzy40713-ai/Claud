# -*- coding: utf-8 -*-
"""Rend les vidéos doublées avec les voix ElevenLabs (répliques déjà découpées dans build/).
Usage : python3 render_leo.py leo-e02 leo-g01 ...   (préfixes de slug ; e01/e03 = premiers sketchs)"""
import os
import sys

os.environ.setdefault("STUDIO_VOICES", "eleven")
import engine  # noqa: E402
import leo_jobs  # noqa: E402
import sketches7  # noqa: E402

engine.OUT = os.path.join(engine.HERE, "videos-leo")
only = sys.argv[1:] or ["e01", "e03"]
for sk in sketches7.SKETCHES + leo_jobs.sketches():
    if any(sk["slug"].startswith(o) for o in only):
        engine.render(sk)
