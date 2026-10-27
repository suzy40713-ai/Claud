# -*- coding: utf-8 -*-
"""Liste des vidéos à doubler avec ElevenLabs : textes par personnage, voix et destination des répliques découpées."""
import copy
import os

os.environ.setdefault("STUDIO_VOICES", "eleven")
import engine  # noqa: E402
import galere2  # noqa: E402
import sketches5  # noqa: E402
import sketches7  # noqa: E402

LEO, ADINA, AGATHE, MAXENCE, AZIZ = ("jsScnYkNNda9Q1NES5nn", "FvmvwvObRqIHojkEGh5N", "SptHT9PQ49isQvxFm28t",
                                     "GGkMUTZaJ8IyPwaHimUq", "3r8pRm4HfmSf9lO6MOMl")
SEP = " [long pause] "

SKETCH_VOICES = {
    "e02-story": dict(E=LEO, V=MAXENCE, A=AZIZ),
    "e04-live": dict(E=LEO, V=MAXENCE, A=AZIZ),
    "e05-clip": dict(E=LEO, V=ADINA, A=AZIZ),
    "g01-anniversaire": dict(E=LEO, V=ADINA, A=AZIZ),
    "g02-avion": dict(E=LEO, V=ADINA, A=AGATHE),
}
GALERE = {"p02-roux": "l03-roux", "p04-timide": "l04-timide", "p08-celibataire": "l05-celibataire",
          "p09-enfant-unique": "l06-enfant-unique", "p10-gourmand": "l07-gourmand"}


def sketches():
    out = []
    for sk in sketches7.SKETCHES + sketches5.SKETCHES:
        if sk["slug"] in SKETCH_VOICES:
            d = copy.deepcopy(sk)
            d["voice_mode"] = "eleven"
            d["slug"] = "leo-" + sk["slug"]
            out.append(d)
    return out


def jobs():
    js = []
    for sk in sketches():
        voices = SKETCH_VOICES[sk["slug"][4:]]
        for role in "EVA":
            idx = [i for i, l in enumerate(sk["lines"]) if not l[0].startswith("@") and l[0] == role]
            js.append(dict(name="%s_%s" % (sk["slug"], role), voice=voices[role], text=SEP.join(sk["lines"][i][2].lstrip("§") for i in idx),
                           n=len(idx), dest=[os.path.join(engine.audio_dir(sk), "%02d_%s_1.000.wav" % (i, role)) for i in idx]))
    for s in galere2.STORIES:
        if s["slug"] in GALERE:
            slug = GALERE[s["slug"]]
            js.append(dict(name=slug, voice=LEO, text=SEP.join(b["text"] for b in s["beats"]), n=len(s["beats"]),
                           dest=[os.path.join(engine.tts.BUILD, "story-h", slug, "%02d.wav" % k) for k in range(len(s["beats"]))]))
    return js


if __name__ == "__main__":
    import json
    j = jobs()
    json.dump(j, open("/tmp/claude-0/leo/jobs.json", "w"), ensure_ascii=False, indent=1)
    for x in j:
        print("%-28s %-22s %2d répliques %4d car." % (x["name"], x["voice"], x["n"], len(x["text"])))
    print("total caractères", sum(len(x["text"]) for x in j))
