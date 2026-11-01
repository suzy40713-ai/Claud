# -*- coding: utf-8 -*-
"""Série Momo doublée avec ElevenLabs : Momo = Léo, Léa = Agathe. Les répliques de chaque personnage sont générées
en un seul appel (séparées par [long pause]) puis découpées dans build/story-h/<slug>/NN_<voix>.wav.
python3 momo_leo.py        -> écrit /tmp/claude-0/leo/jobs.json
python3 momo_leo.py render -> fabrique les vidéos dans videos-momo-leo/"""
import copy
import json
import os
import sys

import story
import momo

LEO, AGATHE = "jsScnYkNNda9Q1NES5nn", "SptHT9PQ49isQvxFm28t"
V = {id(momo.V_MOMO): ("eleven-leo", None, 1.0, 0.0), id(momo.V_LEA): ("eleven-agathe", None, 1.0, 0.0)}
SEP = " [long pause] "


def stories():
    out = []
    for s in momo.STORIES:
        d = copy.deepcopy(s)
        d["slug"] = "ml" + s["slug"][1:]
        d["out"] = "videos-momo-leo"
        for b, b0 in zip(d["beats"], s["beats"]):
            b["fx"]["voice"] = V[id(b0["fx"]["voice"])]
        out.append(d)
    return out


def jobs():
    js = []
    for d in stories():
        for name, vid in (("eleven-leo", LEO), ("eleven-agathe", AGATHE)):
            idx = [i for i, b in enumerate(d["beats"]) if b["fx"]["voice"][0] == name]
            js.append(dict(name="%s_%s" % (d["slug"], name.split("-")[1]), voice=vid,
                           text=SEP.join(d["beats"][i]["text"] for i in idx), n=len(idx),
                           dest=[os.path.join(story.tts.BUILD, "story-h", d["slug"], "%02d_%s.wav" % (i, name))
                                 for i in idx]))
    return js


if __name__ == "__main__":
    if sys.argv[1:] == ["render"] or sys.argv[1:2] == ["render"]:
        only = sys.argv[2:]
        for d in stories():
            if not only or any(d["slug"].startswith(o) for o in only):
                story.load_story(d)
                story.render_story(story.argparse.Namespace(frames="", story=""))
    else:
        j = jobs()
        json.dump(j, open("/tmp/claude-0/leo/jobs.json", "w"), ensure_ascii=False, indent=1)
        for x in j:
            print("%-30s %2d répliques %4d car." % (x["name"], x["n"], len(x["text"])))
        print("total caractères", sum(len(x["text"]) for x in j))
