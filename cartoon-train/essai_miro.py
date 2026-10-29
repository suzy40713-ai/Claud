# -*- coding: utf-8 -*-
import argparse
"""Essai de la voix gratuite « Miro » (Piper fr_FR-miro-high) sur la galère du réveil."""
import copy
import sys

import story
import galere3

for s in galere3.STORIES:
    if s["slug"] == "q02-reveil":
        d = copy.deepcopy(s)
        d.update(slug="q02-reveil-miro", out="essai-voix", voice=("fr_FR-miro-high", None, 0.92, 0.0))
        story.load_story(d)
        story.render_story(story.argparse.Namespace(frames="", story=""))
