# -*- coding: utf-8 -*-
"""Format « FAUX ! » : un narrateur calme énonce une idée reçue, un type furieux débarque en hurlant
« FAUX, espèce de fils de pute ! » puis rétablit la vérité. Narrateur = Léo, le furieux = Aziz (ElevenLabs).
Audio déposé dans build/story-h/<slug>/NN_<voix>.wav (voir momo_leo.py pour le principe)."""
import copy
import math

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


# --- Histoire : un thème par vidéo ---
def histoire(slug, theme, hook, caption, tag, beats):
    d = corps(slug, theme, hook, caption, beats)
    d["hashtags"] = ["#faux", "#histoire", tag, "#lesaviezvous", "#humour", "#animation", "#pourtoi", "#fyp"]
    d["beats"][-1]["fx"]["cta"] = True
    return d


STORIES.append(histoire(
    "fx03-vikings", "Les Vikings : tout ce que tu crois est faux", "Tout ce que tu crois sur les Vikings est FAUX",
    "Tout ce que tu crois sur les Vikings est FAUX 😤 Tu y croyais à combien ?", "#vikings", [
        croit("Tu crois que les Vikings portaient des casques à cornes ?", "burstblue", "CORNES"),
        faux_toi("FAUX, espèce de fils de pute ! On n'en a jamais retrouvé un seul. Les cornes viennent "
                 "des costumes d'un opéra, mille ans plus tard.", "burst"),
        croit("Tu crois que les Vikings étaient sales et puants ?", "burstyellow", "SALES"),
        faux_toi("FAUX, fils de pute ! On a retrouvé leurs peignes, leurs pinces à épiler et même leurs "
                 "cure-oreilles.", "burstblue"),
        croit("Tu crois que les Vikings, c'était un peuple ?", "park", "UN PEUPLE"),
        faux_toi("Encore FAUX, espèce de gros fils de pute ! Partir en viking, c'était partir en expédition. "
                 "Le reste du temps, ils étaient paysans.", "burst", "ENCORE FAUX"),
        croit("Tu crois qu'ils buvaient dans les crânes de leurs ennemis ?", "burstblue", "CRÂNES"),
        faux_toi("FAUX, fils de pute ! C'est une erreur de traduction. Ils buvaient dans des cornes.",
                 "burstyellow"),
        croit("Et tu crois que Christophe Colomb a été le premier Européen en Amérique ?", "burst", "1492"),
        faux_toi("FAUX, fils de pute ! Un Viking, Leif Erikson, y est arrivé vers l'an mille. "
                 "Presque cinq cents ans avant lui.", "burstblue"),
        faux_toi("Alors, tu y croyais à combien ? Écris-le en commentaire, espèce de fils de pute. "
                 "Et abonne-toi.", "burst", "ABONNE-TOI"),
    ]))

STORIES.append(histoire(
    "fx04-egypte", "L'Égypte ancienne : tout ce que tu crois est faux", "Tout ce que tu crois sur l'Égypte est FAUX",
    "Tout ce que tu crois sur l'Égypte ancienne est FAUX 😤 Tu y croyais à combien ?", "#egypte", [
        croit("Tu crois que les pyramides ont été construites par des esclaves ?", "burstyellow", "ESCLAVES"),
        faux_toi("FAUX, espèce de fils de pute ! Pour les archéologues, c'étaient surtout des ouvriers "
                 "payés, nourris et soignés. On a même retrouvé leurs tombes.", "burst"),
        croit("Tu crois que Cléopâtre était égyptienne ?", "burstblue", "CLÉOPÂTRE"),
        faux_toi("FAUX, fils de pute ! Sa famille venait de Grèce, de Macédoine.", "burstyellow"),
        croit("Tu crois que Cléopâtre vivait à l'époque où on a construit les pyramides ?", "burst", "PYRAMIDES"),
        faux_toi("Encore FAUX, espèce de gros fils de pute ! Elle a vécu plus près de l'invention de l'iPhone "
                 "que de la construction de la grande pyramide.", "burstblue", "ENCORE FAUX"),
        croit("Tu crois qu'on ne momifiait que les pharaons ?", "burstyellow", "MOMIES"),
        faux_toi("FAUX, fils de pute ! On a momifié plein de gens normaux. Et des millions d'animaux : "
                 "des chats, des oiseaux, même des crocodiles.", "burst"),
        croit("Et tu crois que Toutânkhamon était un pharaon très puissant ?", "burstblue", "TOUTÂNKHAMON"),
        faux_toi("FAUX, fils de pute ! Il est mort vers dix-neuf ans. Il est célèbre parce que sa tombe "
                 "a été retrouvée presque intacte.", "burstyellow"),
        faux_toi("Alors, tu y croyais à combien ? Écris-le en commentaire, espèce de fils de pute. "
                 "Et abonne-toi.", "burst", "ABONNE-TOI"),
    ]))


# --- Lot 2 histoire (titres courts dans la bulle jaune) ---
def lot(slug, sujet, tag, items, hook=None):
    beats = []
    scenes = ["burstblue", "burst", "burstyellow", "burstblue", "burst"]
    for k, (q, label, rep) in enumerate(items):
        beats.append(croit(q, scenes[k % 5], label))
        beats.append(faux_toi(rep, scenes[(k + 2) % 5], "ENCORE FAUX" if k == 2 else "FAUX !"))
    beats.append(faux_toi("Alors, tu y croyais à combien ? Écris-le en commentaire, espèce de fils de pute. "
                          "Et abonne-toi.", "burst", "ABONNE-TOI"))
    return histoire(slug, "%s : tout ce que tu crois est faux" % sujet, hook or "%s ? TOUT est FAUX" % sujet,
                    "%s : tout ce que tu crois est FAUX 😤 Tu y croyais à combien ?" % sujet, tag, beats)


STORIES += [
    lot("fx05-egypte-2", "L'Égypte, partie 2", "#egypte", [
        ("Tu crois que les Égyptiens écrivaient tout en hiéroglyphes ?", "HIÉROGLYPHES",
         "FAUX, espèce de fils de pute ! Au quotidien, ils utilisaient une écriture beaucoup plus rapide. "
         "Les hiéroglyphes, c'était pour les monuments."),
        ("Tu crois que le Sphinx a perdu son nez à cause des canons de Napoléon ?", "NAPOLÉON",
         "FAUX, fils de pute ! Des dessins faits avant la naissance de Napoléon le montrent déjà sans nez."),
        ("Tu crois que la malédiction de Toutânkhamon a tué ceux qui ont ouvert sa tombe ?", "MALÉDICTION",
         "Encore FAUX, espèce de gros fils de pute ! Howard Carter, celui qui l'a ouverte, a vécu encore "
         "dix-sept ans."),
        ("Tu crois que les pharaons étaient tous des hommes ?", "PHARAONS",
         "FAUX, fils de pute ! Hatchepsout a régné comme pharaon pendant une vingtaine d'années."),
        ("Et tu crois qu'on gardait le cerveau des momies dans un vase ?", "CERVEAU",
         "FAUX, fils de pute ! Le cerveau était souvent retiré et jeté. Les vases, c'était pour les autres "
         "organes."),
    ], hook="L'Égypte, partie 2 : TOUT est FAUX"),
    lot("fx06-romains", "Les Romains", "#rome", [
        ("Tu crois que les gladiateurs se battaient toujours jusqu'à la mort ?", "GLADIATEURS",
         "FAUX, espèce de fils de pute ! La plupart des combats ne finissaient pas par une mort. Un gladiateur, "
         "ça coûtait trop cher à former."),
        ("Tu crois que le pouce vers le bas voulait dire « tue-le » ?", "POUCE",
         "FAUX, fils de pute ! On ne sait pas vraiment quel geste voulait dire quoi. Cette image vient "
         "surtout d'un tableau peint au dix-neuvième siècle."),
        ("Tu crois que les Romains vomissaient dans un vomitorium pendant les banquets ?", "VOMITORIUM",
         "Encore FAUX, espèce de gros fils de pute ! Le vomitorium, c'était les couloirs de sortie "
         "des amphithéâtres."),
        ("Tu crois que Jules César était empereur ?", "CÉSAR",
         "FAUX, fils de pute ! Il n'a jamais été empereur. Le premier empereur, c'est Auguste."),
        ("Et tu crois que Néron jouait de la lyre pendant que Rome brûlait ?", "NÉRON",
         "FAUX, fils de pute ! D'après l'historien Tacite, il n'était même pas à Rome quand l'incendie "
         "a commencé."),
    ]),
    lot("fx07-pirates", "Les pirates", "#pirates", [
        ("Tu crois que les pirates faisaient marcher leurs prisonniers sur la planche ?", "LA PLANCHE",
         "FAUX, espèce de fils de pute ! Il n'y en a presque aucune trace. C'est surtout une invention "
         "des romans et des films."),
        ("Tu crois que les pirates enterraient leurs trésors ?", "TRÉSOR",
         "FAUX, fils de pute ! Ils dépensaient leur butin très vite. Les trésors enterrés, c'est presque "
         "toujours une légende."),
        ("Tu crois que les pirates parlaient en disant « Arrr » ?", "ARRR",
         "Encore FAUX, espèce de gros fils de pute ! Ce « Arrr » vient surtout d'un acteur, dans un film "
         "des années cinquante."),
        ("Tu crois que les pirates n'avaient aucune règle ?", "AUCUNE RÈGLE",
         "FAUX, fils de pute ! Beaucoup avaient des codes écrits : partage du butin, argent pour les blessés, "
         "et ils votaient pour choisir leur capitaine."),
        ("Et tu crois que les pirates, c'était seulement des hommes ?", "QUE DES HOMMES",
         "FAUX, fils de pute ! Anne Bonny et Mary Read étaient de vraies pirates, et elles faisaient peur "
         "à tout le monde."),
    ]),
    lot("fx08-grece", "La Grèce antique", "#grece", [
        ("Tu crois que les statues grecques étaient toutes blanches ?", "BLANCHES",
         "FAUX, espèce de fils de pute ! Elles étaient peintes de couleurs vives. La peinture s'est "
         "effacée avec le temps."),
        ("Tu crois que les athlètes des Jeux olympiques portaient une tenue ?", "JEUX OLYMPIQUES",
         "FAUX, fils de pute ! Ils concouraient complètement nus."),
        ("Tu crois que les Spartiates n'étaient que trois cents aux Thermopyles ?", "300",
         "Encore FAUX, espèce de gros fils de pute ! Ils étaient accompagnés de plusieurs milliers "
         "d'autres Grecs."),
        ("Tu crois que les Grecs pensaient que la Terre était plate ?", "TERRE PLATE",
         "FAUX, fils de pute ! Un Grec, Ératosthène, a même calculé la taille de la Terre, "
         "et il ne s'est pas beaucoup trompé."),
        ("Et tu crois que tout le monde votait dans la démocratie athénienne ?", "DÉMOCRATIE",
         "FAUX, fils de pute ! Seulement les hommes citoyens. Ni les femmes, ni les esclaves, "
         "ni les étrangers."),
    ]),
    lot("fx09-revolution", "La Révolution française", "#revolution", [
        ("Tu crois que Marie-Antoinette a dit « Qu'ils mangent de la brioche » ?", "BRIOCHE",
         "FAUX, espèce de fils de pute ! Aucune preuve. Cette phrase circulait déjà avant qu'elle "
         "arrive en France."),
        ("Tu crois que la Bastille était pleine de prisonniers ?", "BASTILLE",
         "FAUX, fils de pute ! Le quatorze juillet mille sept cent quatre-vingt-neuf, il n'y en avait "
         "que sept."),
        ("Tu crois que le docteur Guillotin a inventé la guillotine ?", "GUILLOTIN",
         "Encore FAUX, espèce de gros fils de pute ! Il a seulement proposé de l'utiliser. C'est un "
         "autre médecin qui l'a mise au point. Au début, on l'appelait même la louisette."),
        ("Tu crois que le quatorze juillet fête seulement la prise de la Bastille ?", "14 JUILLET",
         "FAUX, fils de pute ! Il fête aussi la fête de la Fédération, un an plus tard, en "
         "mille sept cent quatre-vingt-dix."),
        ("Et tu crois que Louis XVI était un roi idiot qui ne faisait rien ?", "LOUIS XVI",
         "FAUX, fils de pute ! Il adorait la géographie, et il a préparé lui-même une grande "
         "expédition autour du monde."),
    ]),
]


# --- Nouvelle animation : décor du thème, costume, quiz VRAI / FAUX, écran qui tremble ---
import engine
from story import SCENES
from render import rect as _rect, path as _path, line as _line, circle as _circle, ellipse as _ellipse


class Colisee(engine.Scene):
    """Ciel, gradins du Colisée en arcades, sable de l'arène."""

    def back(self, t):
        s = [_rect(-800, 0, 2700, 1300, "url(#sky)", stroke="none", sw=0)]
        for row, (y0, h, col) in enumerate(((260, 300, "#d9b38c"), (560, 300, "#cfa57c"), (860, 330, "#c4986d"))):
            s.append(_rect(-800, y0, 2700, h, col, stroke="#8a6440", sw=6))
            for k in range(-6, 16):
                ax = k * 170 + (85 if row % 2 else 0)
                s.append(_path("M %d %d L %d %d A 55 55 0 0 1 %d %d L %d %d Z" % (
                    ax - 55, y0 + h - 20, ax - 55, y0 + 110, ax + 55, y0 + 110, ax + 55, y0 + h - 20),
                    fill="#6e4b2e", stroke="#8a6440", sw=5))
        s.append(_rect(-800, 1190, 2700, 730, "#e9c98f", stroke="none", sw=0))
        s.append(_line(-800, 1190, 1900, 1190, sw=6))
        for x in (-300, 200, 700, 1300):
            s.append(_ellipse(x, 1500, 90, 18, "#d8b277", stroke="none", sw=0))
        return "".join(s)


class Navire(engine.Scene):
    """Mer, mât avec drapeau pirate, pont en bois."""

    def back(self, t):
        s = [_rect(-800, 0, 2700, 1000, "url(#sky)", stroke="none", sw=0),
             _rect(-800, 1000, 2700, 300, "#1d6fa3", stroke="none", sw=0)]
        for k in range(14):
            x = -800 + k * 200 + (t * 40) % 200
            s.append(_path("M %d 1040 q 50 -30 100 0" % x, stroke="#ffffff", sw=6))
        s.append(_rect(880, 120, 34, 1180, "#7a4a24", sw=6))
        s.append(_line(700, 420, 1100, 420, sw=16, stroke="#7a4a24"))
        s.append(_path("M 914 160 L 1180 200 L 914 300 Z", fill="#1b1b1b", sw=5))
        s.append(_circle(1000, 222, 26, "#ffffff", sw=4))
        s.append(_rect(-800, 1200, 2700, 720, "#a0683a", stroke="none", sw=0))
        for k in range(12):
            s.append(_line(-800, 1260 + k * 60, 1900, 1260 + k * 60, sw=4, stroke="#7a4a24"))
        s.append(_rect(-800, 1170, 2700, 40, "#7a4a24", sw=6))
        return "".join(s)


SCENES["colisee"], SCENES["navire"] = Colisee, Navire

ROMAIN = P(skin=SKIN[2], hair=("short", "#1c1412"), top=("tank", "#ffffff"), bottom=("shorts", "#ffffff"),
           shoes="#8a5a2b", hat=("laurel", "#3fa34d"), R=116)
PIRATE = P(skin=SKIN[3], hair=("curly", "#1c1412"), top=("tshirt", "#e63946"), bottom=("pants", "#1f1f1f"),
           shoes="#1b1b1b", beard="#1c1412", hat=("pirate", "#1b1b1b"), R=116)


def shout(rep):
    """« FAUX, espèce de fils de pute ! » -> « FAUX ! Espèce de fils de pute ! » (crié plus fort par Léo)."""
    for old, new in (("Encore FAUX, espèce de gros fils de pute !", "Encore FAUX ! Espèce de gros fils de pute !"),
                     ("FAUX, espèce de fils de pute !", "FAUX ! Espèce de fils de pute !"),
                     ("FAUX, fils de pute !", "FAUX ! Fils de pute !")):
        if rep.startswith(old):
            return new + rep[len(old):]
    return rep


SHOUTED = ("FAUX ! Espèce", "FAUX ! Fils", "Encore FAUX !", "Alors, tu y croyais")


def tts_prompt(text):
    """Texte envoyé à ElevenLabs : on fait hurler les répliques « FAUX ! … fils de pute ! »."""
    if text.startswith(SHOUTED):
        return "[shouting] " + text
    return text


def lot2(slug, sujet, tag, scene, hero, items):
    beats, total = [], len(items)
    for k, (q, label, rep) in enumerate(items):
        rep = shout(rep)
        o = dict(expr="smug", look="CAM", tag=(label, "#ffd166"))
        beats.append(B(q, scene, [(hero, 540, o)], (540, 1000, 1.25), quiz=(k + 1, total, False)))
        beats.append(B(rep, scene, [(hero, 540, dict(expr="angry", look="CAM", pose="gesture"))], (540, 960, 1.5),
                       red=True, dark=0.25, shake=True, stamp="ENCORE FAUX" if k == 2 else "FAUX !",
                       quiz=(k + 1, total, True)))
    beats.append(B("Alors, tu y croyais à combien ? Écris-le en commentaire, espèce de fils de pute. Et abonne-toi.",
                   scene, [(hero, 540, dict(expr="angry", look="CAM", pose="gesture"))], (540, 960, 1.5),
                   stamp="ABONNE-TOI", cta=True))
    d = dict(slug=slug, title="%s : tout ce que tu crois est faux" % sujet, hero=hero, beats=beats,
             hook_text="%s ? TOUT est FAUX" % sujet, caption_y=1390, caps="keywords", out="videos-faux",
             caption="%s : tout ce que tu crois est FAUX 😤 Tu y croyais à combien ?" % sujet,
             hashtags=["#faux", "#histoire", tag, "#lesaviezvous", "#humour", "#animation", "#pourtoi", "#fyp"])
    return d


_ROM = next(x for x in STORIES if x["slug"] == "fx06-romains")
_PIR = next(x for x in STORIES if x["slug"] == "fx07-pirates")


def _items(st):
    b = st["beats"]
    return [(b[i]["text"], b[i]["cast"][0][2]["tag"][0], b[i + 1]["text"]) for i in range(0, 10, 2)]


STORIES[STORIES.index(_ROM)] = lot2("fx06-romains", "Les Romains", "#rome", "colisee", ROMAIN, _items(_ROM))
STORIES[STORIES.index(_PIR)] = lot2("fx07-pirates", "Les pirates", "#pirates", "navire", PIRATE, _items(_PIR))


# --- Lot 3 (voix Léo, insultes criées) : Révolution, Napoléon, Préhistoire ---
import tendances  # noqa: F401  (enregistre le décor « chateau »)


class Bastille(engine.Scene):
    """Forteresse de la Bastille, ciel orageux, drapeau tricolore."""

    def back(self, t):
        s = [_rect(-800, 0, 2700, 1300, "#f4a261", stroke="none", sw=0),
             _rect(-800, 0, 2700, 500, "#e76f51", stroke="none", sw=0, extra='opacity="0.6"')]
        for tx in (-260, 140, 940, 1340):
            s.append(_rect(tx - 130, 260, 260, 980, "#6c757d", sw=6))
            for k in range(-2, 3):
                s.append(_rect(tx + k * 52 - 20, 220, 40, 50, "#6c757d", sw=5))
            s.append(_rect(tx - 25, 520, 50, 90, "#343a40", rx=20, sw=4))
        s.append(_rect(140, 520, 800, 720, "#868e96", sw=6))
        for k in range(8):
            s.append(_rect(160 + k * 100, 480, 50, 50, "#868e96", sw=5))
        s.append(_path("M 440 1240 L 440 950 A 100 100 0 0 1 640 950 L 640 1240 Z", fill="#343a40", sw=6))
        s.append(_line(1340, 260, 1340, 60, sw=8))
        wave = 10 * math.sin(t * 4)
        for i, c in enumerate(("#1d4ed8", "#ffffff", "#e63946")):
            s.append(_rect(1344 + i * 60, 70 + wave * (i / 3), 60, 120, c, sw=4))
        s.append(_rect(-800, 1240, 2700, 700, "#a8a29e", stroke="none", sw=0))
        s.append(_line(-800, 1240, 1900, 1240, sw=6))
        return "".join(s)


class Prehistoire(engine.Scene):
    """Volcan qui fume, rochers, herbe sèche."""

    def back(self, t):
        s = [_rect(-800, 0, 2700, 1300, "#ffd6a5", stroke="none", sw=0),
             _path("M 500 1220 L 900 380 L 1060 380 L 1500 1220 Z", fill="#6d4c41", sw=6),
             _path("M 900 380 L 940 460 L 1000 420 L 1060 470 L 1060 380 Z", fill="#e63946", sw=5)]
        for k in range(4):
            u = ((t * 0.3 + k * 0.25) % 1.0)
            s.append('<g opacity="%.2f">' % (0.9 - u * 0.8)
                     + _circle(980 + 40 * math.sin(u * 6 + k), 340 - u * 300, 40 + u * 50, "#adb5bd", sw=4) + "</g>")
        s.append(_path("M -800 1000 Q -300 880 200 1000 T 1300 980 L 1900 1000 L 1900 1240 L -800 1240 Z",
                       fill="#bc8a5f", sw=6))
        for x, w in ((-200, 160), (60, 110), (1180, 140)):
            s.append(_path("M %d 1240 Q %d %d %d 1240 Z" % (x - w, x, 1240 - w * 1.4, x + w), fill="#8d8d8d", sw=6))
        s.append(_rect(-800, 1240, 2700, 700, "#c9a227", stroke="none", sw=0))
        s.append(_line(-800, 1240, 1900, 1240, sw=6))
        return "".join(s)


SCENES["bastille"], SCENES["prehistoire"] = Bastille, Prehistoire

REVOLUTION = P(skin=SKIN[1], hair=("short", "#3a2a1f"), top=("vest", "#1d4ed8", "#ffffff"), bottom=("pants", "#f2e8cf"),
               shoes="#1b1b1b", hat=("phrygien", "#e63946"), R=116)
NAPOLEON = P(skin=SKIN[0], hair=("short", "#3a2a1f"), top=("blazer", "#1d3a8a", "#ffffff"), bottom=("pants", "#ffffff"),
             shoes="#1b1b1b", hat=("bicorne", "#1b1b1b"), R=116)
CAVERNE = P(skin=SKIN[2], hair=("long", "#3a2a1f"), top=("tank", "#a1683a"), bottom=("shorts", "#7a4a24"),
            shoes="#a1683a", beard="#3a2a1f", R=118)

_REV = next(x for x in STORIES if x["slug"] == "fx09-revolution")
STORIES[STORIES.index(_REV)] = lot2("fx09-revolution", "La Révolution française", "#revolution", "bastille",
                                    REVOLUTION, _items(_REV))

STORIES += [
    lot2("fx10-napoleon", "Napoléon", "#napoleon", "chateau", NAPOLEON, [
        ("Tu crois que Napoléon était tout petit ?", "PETIT",
         "FAUX, espèce de fils de pute ! Il mesurait environ un mètre soixante-neuf. Normal pour l'époque. "
         "La légende vient des caricatures anglaises."),
        ("Tu crois que Napoléon parlait français depuis tout petit ?", "FRANÇAIS",
         "FAUX, fils de pute ! Il est né en Corse. Sa langue, c'était le corse. Il a appris le français à neuf ans, "
         "et il a gardé un accent toute sa vie."),
        ("Tu crois qu'il mettait la main dans son gilet parce qu'il avait mal au ventre ?", "LA MAIN",
         "Encore FAUX, espèce de gros fils de pute ! C'était une pose classique des portraits de l'époque. "
         "Ça voulait dire : je suis calme et distingué."),
        ("Tu crois que le pape l'a couronné empereur ?", "COURONNE",
         "FAUX, fils de pute ! Le pape était là, mais c'est Napoléon qui s'est mis la couronne lui-même sur la tête."),
        ("Et tu crois qu'à Waterloo, il a perdu contre les Anglais tout seuls ?", "WATERLOO",
         "FAUX, fils de pute ! L'armée de Wellington venait de plusieurs pays. Et c'est l'arrivée des Prussiens "
         "qui a tout changé."),
    ]),
    lot2("fx11-prehistoire", "La Préhistoire", "#prehistoire", "prehistoire", CAVERNE, [
        ("Tu crois que les hommes préhistoriques chassaient les dinosaures ?", "DINOSAURES",
         "FAUX, espèce de fils de pute ! Les dinosaures ont disparu soixante-six millions d'années avant le "
         "premier humain."),
        ("Tu crois que les hommes préhistoriques vivaient dans des grottes ?", "GROTTES",
         "FAUX, fils de pute ! Ils vivaient surtout dans des huttes et des campements. Les grottes, c'était "
         "pour s'abriter ou pour peindre."),
        ("Tu crois que l'homme de Néandertal était une brute stupide qui grognait ?", "NÉANDERTAL",
         "Encore FAUX, espèce de gros fils de pute ! Il enterrait ses morts, fabriquait des outils et faisait de "
         "l'art. Et toi, tu as sûrement un peu de son ADN."),
        ("Tu crois que les mammouths ont disparu bien avant les pyramides ?", "MAMMOUTHS",
         "FAUX, fils de pute ! Sur une île de Sibérie, les derniers mammouths vivaient encore quand les "
         "pyramides étaient déjà construites."),
        ("Et tu crois qu'ils ne mangeaient que de la viande ?", "VIANDE",
         "FAUX, fils de pute ! Ils mangeaient aussi des plantes, des fruits, des graines. Et ils les faisaient "
         "même cuire."),
    ]),
]


# --- Lot 4 : retour au style « Égypte » (perso au sweat rouge, fonds en rayons) + insultes criées ---
def lot_classique(slug, sujet, sur, tag, items):
    d = lot(slug, sujet, tag, [(q, label, shout(rep)) for q, label, rep in items],
            hook="Tout ce que tu crois sur %s est FAUX" % sur)
    d["caption"] = "Tout ce que tu crois sur %s est FAUX 😤 Tu y croyais à combien ?" % sur
    return d


STORIES += [
    lot_classique("fx12-egypte-3", "L'Égypte, partie 3", "l'Égypte (partie 3)", "#egypte", [
        ("Tu crois que les pyramides étaient perdues au milieu du désert ?", "LE DÉSERT",
         "FAUX, espèce de fils de pute ! Elles étaient tout près du Nil, avec des villages d'ouvriers, "
         "des boulangeries et des ports autour."),
        ("Tu crois que les pyramides ont toujours été couleur sable ?", "LA COULEUR",
         "FAUX, fils de pute ! Elles étaient recouvertes de pierres blanches polies qui brillaient au soleil. "
         "On les voyait de très loin."),
        ("Tu crois que les ouvriers des tombes royales ne prenaient jamais de congé ?", "LES CONGÉS",
         "Encore FAUX, espèce de gros fils de pute ! On a retrouvé leurs feuilles d'absence : malade, piqué par "
         "un scorpion… ou occupé à faire de la bière pour une fête."),
        ("Tu crois que les Égyptiens se maquillaient les yeux juste pour être beaux ?", "LE MAQUILLAGE",
         "FAUX, fils de pute ! Le khôl aidait aussi à protéger les yeux du soleil et des infections. "
         "Les hommes en mettaient aussi."),
        ("Et tu crois qu'on a trouvé les pyramides pleines de trésors ?", "LES TRÉSORS",
         "FAUX, fils de pute ! Elles avaient presque toutes été pillées il y a des milliers d'années. "
         "Les trésors de Toutankhamon, c'est l'exception."),
    ]),
    lot_classique("fx13-gaulois", "Les Gaulois", "les Gaulois", "#gaulois", [
        ("Tu crois que les Gaulois portaient des casques avec des ailes ?", "LES AILES",
         "FAUX, espèce de fils de pute ! Les vrais casques gaulois n'avaient pas d'ailes. C'est une image "
         "inventée bien plus tard, au dix-neuvième siècle."),
        ("Tu crois que les Gaulois vivaient dans des huttes au fond des forêts, sans villes ?", "LES VILLES",
         "FAUX, fils de pute ! Ils avaient de vraies villes fortifiées, avec des rues, des artisans et des "
         "marchés. Comme Bibracte."),
        ("Tu crois que les Gaulois avaient peur que le ciel leur tombe sur la tête ?", "LE CIEL",
         "Encore FAUX, espèce de gros fils de pute ! D'après un auteur antique, des chefs celtes ont dit "
         "qu'ils ne craignaient que ça. Ça voulait dire : on n'a peur de rien."),
        ("Tu crois que les Gaulois mangeaient du sanglier à tous les repas ?", "LE SANGLIER",
         "FAUX, fils de pute ! Les archéologues trouvent surtout des os de cochon, de bœuf et de mouton. "
         "Le sanglier, c'était rare."),
        ("Et tu crois que Vercingétorix est mort à la bataille d'Alésia ?", "VERCINGÉTORIX",
         "FAUX, fils de pute ! Il s'est rendu à César. Il a été emmené à Rome, et exécuté environ six ans "
         "plus tard."),
    ]),
    lot_classique("fx14-mayas", "Les Mayas", "les Mayas", "#mayas", [
        ("Tu crois que les Mayas avaient prédit la fin du monde en deux mille douze ?", "2012",
         "FAUX, espèce de fils de pute ! C'était juste la fin d'un grand cycle de leur calendrier. Comme "
         "un compteur qui repasse à zéro."),
        ("Tu crois que les Mayas ont tous disparu ?", "DISPARUS",
         "FAUX, fils de pute ! Des millions de Mayas vivent encore aujourd'hui, au Mexique et au Guatemala. "
         "Et ils parlent encore leurs langues."),
        ("Tu crois que le chocolat a été inventé en Europe ?", "LE CHOCOLAT",
         "Encore FAUX, espèce de gros fils de pute ! Les Mayas buvaient déjà du cacao il y a plus de deux "
         "mille ans."),
        ("Tu crois que les Mayas, les Aztèques et les Incas, c'est le même peuple ?", "MÊME PEUPLE",
         "FAUX, fils de pute ! Trois peuples différents, dans des régions différentes, à des époques "
         "différentes."),
        ("Et tu crois que les Mayas ne connaissaient pas le zéro ?", "LE ZÉRO",
         "FAUX, fils de pute ! Ils utilisaient le zéro, parmi les tout premiers au monde."),
    ]),
]
