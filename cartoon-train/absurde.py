# -*- coding: utf-8 -*-
"""Format « science absurde » : une question folle (« Et si tu sautais par-dessus la tour Eiffel ? ») expliquée
pas à pas avec de vrais ordres de grandeur, ton pince-sans-rire, narration de Léo (ElevenLabs).
Calculs (sans résistance de l'air) : v = racine(2 g h) = racine(2 x 9,81 x 330) = 80 m/s, soit 290 km/h ;
accélération sur 1 m de poussée = 80² / 2 = 3 200 m/s², environ 330 fois la pesanteur ;
freinage à 10 g depuis 80 m/s = 80² / (2 x 98) = 33 m de mousse, environ 10 étages."""
import copy

import engine
import story
from story import B, SCENES
from render import rect, path, line, circle
from histoires3 import Z7, CLOSE

TINY = copy.deepcopy(Z7)
TINY["R"] = 34


class Eiffel(engine.Scene):
    """Ciel, pelouse du Champ-de-Mars et une tour Eiffel immense derrière le héros."""

    def back(self, t):
        s = [rect(-800, 0, 2700, 1150, "url(#sky)", stroke="none", sw=0)]
        for cx, cy in ((120, 260), (1250, 200), (-400, 420)):
            xx = engine.scroll(cx, 12, t, 2700, -800)
            for dx, dy, r in ((0, 0, 50), (50, -20, 60), (110, 0, 48)):
                s.append(circle(xx + dx, cy + dy, r, "#ffffff", stroke="none", sw=0))
        s.append(rect(-800, 1150, 2700, 770, "#74c69d", stroke="none", sw=0))
        s.append(line(-800, 1150, 1900, 1150, sw=6))
        col, dark, base, top = "#9c6b45", "#6f4a2e", 1600, 150
        s.append(line(760, top, 760, top - 110, sw=10, stroke=dark))
        s.append(path("M 400 %d Q 640 900 738 %d L 782 %d Q 880 900 1120 %d L 960 %d Q 760 1200 560 %d Z"
                      % (base, top + 10, top + 10, base, base, base), fill=col, stroke=dark, sw=8))
        for y_, hw in ((1230, 290), (800, 140), (430, 66)):
            s.append(rect(760 - hw, y_ - 16, 2 * hw, 32, dark, rx=4, stroke="none", sw=0))
        for k in range(12):  # treillis
            y1 = base - 40 - k * 115
            hw = 330 - k * 26
            s.append(line(760 - hw, y1, 760 + hw - 24, y1 - 100, sw=4, stroke=dark))
            s.append(line(760 + hw, y1, 760 - hw + 24, y1 - 100, sw=4, stroke=dark))
        return "".join(s)


SCENES["eiffel"] = Eiffel


def tiny(expr, tag=None, **kw):
    o = dict(expr=expr, look=(0.4, -0.7))
    if tag:
        o["tag"] = (tag, "#ffd166")
    return [(TINY, 300, o)]


def big(expr, tag=None, col="#ffd166", **kw):
    o = dict(expr=expr, look="CAM", **kw)
    if tag:
        o["tag"] = (tag, col)
    return [(Z7, 540, o)]


WIDE = (540, 1000, 1.0)

STORIES = [
    dict(slug="ab01-tour-eiffel", title="Et si tu essayais de sauter par-dessus la tour Eiffel ?", hero=Z7,
         hook_text="Sauter par-dessus la tour Eiffel ?", caption_y=1330, out="videos-formats",
         caption="Et si tu sautais par-dessus la tour Eiffel ? 🗼 La physique dit non… presque.",
         hashtags=["#etsi", "#science", "#physique", "#toureiffel", "#animation", "#pourtoi", "#fyp"],
         beats=[
             B("Et si tu essayais de sauter par-dessus la tour Eiffel ?", "eiffel", tiny("shocked", "330 m"), WIDE,
               rings=True),
             B("Un humain normal saute à environ cinquante centimètres. La tour en mesure trois cent trente.",
               "burst", big("smug", "50 cm", pose="up"), CLOSE),
             B("Même avec une perche, le record du monde est d'environ six mètres. Il t'en manque trois cent vingt-quatre.",
               "eiffel", tiny("sad", "6 m"), WIDE),
             B("Pour monter aussi haut, tu devrais décoller à près de trois cents kilomètres heure. "
               "Plus vite qu'une voiture de course.", "burstyellow", big("shocked", "290 km/h", "#ff4757"), CLOSE),
             B("Et tes jambes devraient pousser avec une force de plus de trois cents fois ton poids.", "burst",
               big("angry", "x 300", "#ff4757", pose="up"), CLOSE),
             B("Les pilotes de chasse perdent connaissance vers neuf fois leur poids. Toi, tu serais à trois cents.",
               "burstblue", big("sad", "9 G"), CLOSE, dark=0.3),
             B("Admettons que tu survives. Tu passes le sommet… et maintenant, il faut redescendre.", "eiffel",
               tiny("shocked"), WIDE),
             B("Tu retombes à presque trois cents kilomètres heure.", "burstblue",
               big("shocked", "290 km/h", "#ff4757"), CLOSE, dark=0.2),
             B("Pour survivre, il te faudrait un matelas en mousse de trente mètres d'épaisseur. "
               "Haut comme un immeuble de dix étages.", "burstyellow", big("smug", "MATELAS : 10 ÉTAGES"), CLOSE),
             B("Conclusion : prends l'ascenseur. C'est moins cher qu'un matelas de dix étages.", "eiffel",
               tiny("smile", "ASCENSEUR"), WIDE),
             B("Abonne-toi pour le prochain « Et si ».", "burst", big("smile"), CLOSE, cta=True),
         ]),
]
