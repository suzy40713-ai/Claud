# -*- coding: utf-8 -*-
"""Lot « tendances » (veille vidIQ du 27/11/2026) : formats qui explosent en ce moment dans la niche FR.
tn01 Dans ce monde, tes dessins deviennent réels (partie 1)
tn02 Dans ce monde, à 18 ans tu reçois un super-pouvoir (partie 1)
tn03 Voici le Marseillais (clichés, en animation)
tn04 Dépenser 2 milliards en 1 journée (partie 2)
tn05 Le roi promet sa fille… mais la fin est incroyable (conte)
Narration de Léo (ElevenLabs), déposée dans build/story-h/<slug>/NN.wav."""
import engine
from engine import SCENES, rect, path, line, circle, f
from story import B
from sketches import P, SKIN
from galere import POTE, FILLE, MERE
from histoires import FEMME, HOMME
from histoires3 import Z2, Z9, Z10, CLOSE, WIDE, TIGHT, one, duo, hero

OUT = "videos-tendances"
M = 1_000_000


class Chateau(engine.Scene):
    """Salle du trône : murs de pierre, bannières rouges, trône doré."""

    def back(self, t):
        s = [rect(-800, 0, 2700, 1300, "#9aa3ad", stroke="none", sw=0)]
        for r_ in range(13):
            for c in range(-6, 18):
                x = c * 160 + (80 if r_ % 2 else 0)
                s.append(rect(x, r_ * 100, 160, 100, "none", stroke="#7d8790", sw=4))
        for bx in (-60, 1040):
            s.append(rect(bx - 70, 120, 140, 560, "#c1121f", sw=6))
            s.append(path("M %s 680 L %s 760 L %s 680 Z" % (f(bx - 70), f(bx), f(bx + 70)), fill="#c1121f", sw=6))
            s.append(circle(bx, 330, 46, "#ffd166", sw=5))
        s.append(rect(330, 470, 420, 760, "#d4a017", rx=40, sw=8))
        s.append(rect(380, 530, 320, 500, "#8b1e3f", rx=30, sw=6))
        s.append(rect(-800, 1230, 2700, 700, "#6d4c41", stroke="none", sw=0))
        s.append(rect(240, 1230, 600, 700, "#b5172b", stroke="none", sw=0))
        s.append(line(-800, 1230, 1900, 1230, sw=6))
        return "".join(s)


SCENES["chateau"] = Chateau

# personnages
DESSIN = hero(SKIN[0], ("curly", "#c26a2b"), ("hoodie", "#ffb703", "#e09e00"), freckles=True)
POUVOIR = Z10
MARSEILLAIS = P(skin=SKIN[1], hair=("short", "#1c1412"), top=("tshirt", "#2fa4e7"), bottom=("shorts", "#ffffff"),
                shoes="#ffffff", hat=("cap", "#ffffff"), R=112)
RICHE = Z9
ROI = P(skin=SKIN[1], hair=("bald", "#d9d9d9"), top=("blazer", "#6a1b9a", "#ffd166"), bottom=("pants", "#4a148c"),
        shoes="#1b1b1b", beard="#e8e8e8", hat=("crown", "#ffcc00"), R=116)
PRINCESSE = P(skin=SKIN[0], hair=("long", "#e8c15a"), top=("dress", "#ff8fab"), bottom=("pants", "#ff8fab"),
              shoes="#ff4d6d", hat=("crown", "#ffcc00"), R=108)
CHEVALIER = P(skin=SKIN[2], hair=("short", "#3a2a1f"), top=("uniform", "#9aa3ad"), bottom=("pants", "#7d8790"),
              shoes="#4a4a4a", R=116)
MAGICIEN = P(skin=SKIN[0], hair=("long", "#e8e8e8"), top=("cardigan", "#3d348b", "#7678ed"),
             bottom=("pants", "#3d348b"), shoes="#1b1b1b", beard="#f2f2f2", hat=("paper", "#5a189a"), R=112)
BOULANGER = P(skin=SKIN[3], hair=("buzz", "#1c1412"), top=("apron", "#ffffff", "#f4a261"),
              bottom=("pants", "#264653"), shoes="#1b1b1b", R=112)
MONSTRE = P(skin="#6a994e", hair=("spiky", "#2d4a22"), top=("tank", "#386641"), bottom=("shorts", "#2d4a22"),
            shoes="#2d4a22", R=150)


def tag(h, txt, expr="smug", x=540, col="#ffd166", **kw):
    return [(h, x, dict(expr=expr, look="CAM", tag=(txt, col), **kw))]


def story(slug, title, hero_, hook, caption, hashtags, beats, **kw):
    return dict(slug="tn" + slug, title=title, hero=hero_, beats=beats, hook_text=hook, caption_y=1330, out=OUT,
                caption=caption, hashtags=hashtags + ["#animation", "#pourtoi", "#fyp"], **kw)


def mb(text, scene, cast, shot, money, clock, **kw):
    return B(text, scene, cast, shot, money=money, clock=clock, **kw)


STORIES = [
    story("01-dessins-reels", "Dans ce monde, tes dessins deviennent réels", DESSIN, "TES DESSINS DEVIENNENT RÉELS",
          "Dans ce monde, tout ce que tu dessines devient réel… une fois par jour ✏️😳 Partie 2 ? 👇",
          ["#danscemonde", "#histoire", "#etsi"], [
        B("Dans ce monde, tout ce que tu dessines devient réel. Mais seulement un dessin par jour.", "burst",
          one(DESSIN, "shocked"), CLOSE, rings=True),
        B("Lundi, tu dessines une pizza. Pouf. Une pizza géante apparaît sur ton bureau.", "cafe",
          one(DESSIN, "smile"), WIDE, poof="UNE PIZZA GÉANTE"),
        B("Mardi, tu dessines un chien. Problème : tu dessines très mal. Il a cinq pattes.", "park",
          one(DESSIN, "shocked"), WIDE, poof="UN CHIEN À 5 PATTES"),
        B("Mercredi, tu dessines un billet de cent euros. Mais avec ta tête dessus. La police arrive en dix minutes.",
          "supermarket", duo(DESSIN, "shocked", HOMME, "angry"), WIDE, poof="UN FAUX BILLET"),
        B("Jeudi, tu dessines le prof de maths… en vacances. Le lendemain, il n'est plus là. Pas de contrôle.",
          "waiting", one(DESSIN, "smug"), CLOSE, poof="PROF EN VACANCES",
          crowd=["Il est où ?", "Pas de contrôle !", "Merci !!"]),
        B("Toute l'école te demande des dessins. Des chaussures, des téléphones, un chat qui parle.", "burstyellow",
          one(DESSIN, "smile"), WIDE, crowd=["Dessine-moi un iPhone", "Un chat qui parle !", "Des baskets !",
                                             "Moi d'abord", "Un dragon !"]),
        B("Mais vendredi matin, tu trouves un dessin sur ta table. Ce n'est pas toi qui l'as fait.", "waiting",
          one(DESSIN, "shocked"), TIGHT, dark=0.4, shake=True),
        B("C'est toi. Avec une énorme gomme au-dessus de ta tête.", "waiting", one(DESSIN, "shocked"), TIGHT,
          dark=0.55, red=True, inner="Quelqu'un dessine aussi…"),
        B("Quelqu'un d'autre a le même pouvoir. Et il veut t'effacer. Abonne-toi pour la partie deux.", "waiting",
          one(DESSIN, "shocked"), CLOSE, dark=0.45, cta=True),
    ]),
    story("02-super-pouvoir", "Dans ce monde, à 18 ans tu reçois un super-pouvoir", POUVOIR,
          "À 18 ANS : UN SUPER-POUVOIR", "Dans ce monde, à 18 ans tu reçois UN super-pouvoir… et le sien est nul 😭 Partie 2 ? 👇",
          ["#danscemonde", "#superpouvoir", "#histoire"], [
        B("Dans ce monde, le jour de tes dix-huit ans, tu reçois un super-pouvoir. Un seul. Pour toute ta vie.",
          "burst", one(POUVOIR, "smile"), CLOSE, rings=True),
        B("Ton meilleur pote a eu le sien la semaine dernière : il peut voler.", "park",
          tag(POTE, "VOLER", "smug", x=760) + [(POUVOIR, 330, dict(expr="shocked", look=(1, -0.3)))], WIDE),
        B("Ta sœur, elle, devient invisible quand elle veut. Surtout quand il faut faire la vaisselle.", "cafe",
          tag(FILLE, "INVISIBLE", "smug", x=760, ghost=0.35) + [(POUVOIR, 330, dict(expr="annoyed", look=(1, 0)))],
          WIDE),
        B("Minuit. C'est ton anniversaire. Tu sens une chaleur dans tes mains. Ton pouvoir arrive.", "park",
          one(POUVOIR, "shocked", pose="up"), TIGHT, dark=0.5, rings=True),
        B("Et ton pouvoir, c'est… parler aux pigeons. Uniquement aux pigeons.", "park",
          tag(POUVOIR, "PARLER AUX PIGEONS", "sad", col="#adb5bd"), CLOSE, dark=0.2,
          crowd=["Rou rou", "Du pain ?", "Rou ?"]),
        B("Tout le monde se moque de toi. Au lycée, on t'appelle le roi des pigeons.", "waiting",
          one(POUVOIR, "sad"), WIDE, crowd=["Le roi des pigeons !", "Hahaha", "Rou rou !", "Nul !"]),
        B("Mais un soir, un pigeon se pose sur ta fenêtre. Et il te dit : on voit tout, de là-haut.", "park",
          one(POUVOIR, "shocked"), TIGHT, dark=0.45, inner="On voit tout, de là-haut."),
        B("Il y a des millions de pigeons. Dans chaque ville. Sur chaque toit. Et ils connaissent tous les secrets.",
          "park", one(POUVOIR, "smug"), CLOSE, dark=0.35, crowd=["Rou… secret", "Je l'ai vu", "Rou rou…"]),
        B("Et le premier secret qu'ils te racontent… concerne ton meilleur pote. Abonne-toi pour la partie deux.",
          "park", one(POUVOIR, "shocked"), CLOSE, dark=0.45, red=True, cta=True),
    ]),
    story("03-marseillais", "Voici le Marseillais", MARSEILLAIS, "VOICI LE MARSEILLAIS",
          "Voici le Marseillais ☀️⚽ Tague un Marseillais qui fait EXACTEMENT ça 👇",
          ["#marseille", "#cliche", "#humour", "#relatable"], [
        B("Voici le Marseillais. Tu le reconnais tout de suite : il parle fort, même quand il chuchote.", "beach",
          one(MARSEILLAIS, "smile"), CLOSE),
        B("Un : il exagère tout. Il a pêché un poisson de trente centimètres… il en raconte un de trois mètres.",
          "beach", tag(MARSEILLAIS, "1. IL EXAGÈRE", "smug"), CLOSE),
        B("D'ailleurs, à Marseille, une sardine a bouché le port. Ça, c'est historique. Enfin… presque.",
          "beach", tag(MARSEILLAIS, "LA SARDINE", "smug"), CLOSE, poof="UNE SARDINE GÉANTE"),
        B("Deux : il a froid à vingt degrés. Doudoune, écharpe, bonnet. En avril.", "park",
          tag(MARSEILLAIS, "2. IL A FROID", "sad", col="#a8dadc"), CLOSE),
        B("Trois : quand l'OM gagne, toute la ville est en fête. Quand l'OM perd… c'est la faute de l'arbitre.",
          "burstblue", tag(MARSEILLAIS, "3. ALLEZ L'OM", "smile", col="#2fa4e7"), CLOSE,
          crowd=["Allez l'OM !", "Arbitre !!", "On est les meilleurs"]),
        B("Quatre : la pétanque, c'est pas un jeu. C'est une affaire d'honneur. Ça peut durer quatre heures.",
          "park", duo(MARSEILLAIS, "angry", HOMME, "angry"), WIDE, crowd=["Il tire ou il pointe ?", "Mesure !!"]),
        B("Cinq : il te dit « on se voit à quatorze heures ». Il arrive à seize heures. Et c'est toi qui es en avance.",
          "cafe", tag(MARSEILLAIS, "5. À L'HEURE… OU PAS", "smug"), CLOSE),
        B("Mais si t'as un problème, le Marseillais est le premier à venir t'aider. Avec tout son quartier.",
          "beach", one(MARSEILLAIS, "smile"), WIDE, crowd=["On arrive !", "T'inquiète", "Qui t'embête ?"]),
        B("Tague un Marseillais qui fait exactement ça. Et dis-moi quelle ville je fais après.", "beach",
          one(MARSEILLAIS, "smile"), WIDE, cta=True),
    ]),
    story("04-milliard-2", "2 milliards en 1 jour — Partie 2", RICHE, "2 MILLIARDS. NOUVELLE RÈGLE.",
          "Partie 2 : 2 milliards avant minuit… mais interdit de dépenser plus d'1 million à la fois 💸😱",
          ["#milliard", "#argent", "#defi"], [
        mb("Partie deux. Deux milliards avant minuit. Mais nouvelle règle : interdit de dépenser plus d'un million à la fois.",
           "burst", one(RICHE, "shocked"), CLOSE, 2000 * M, "08:00", bills=True, rings=True),
        mb("Donc il faut au moins deux mille achats. En seize heures. Un achat toutes les trente secondes.",
           "waiting", one(RICHE, "shocked"), TIGHT, 2000 * M, "08:00", shake=True),
        mb("Huit heures. Tu achètes une voiture de sport. Puis une autre. Puis une autre. Cent voitures. Cent millions.",
           "park", one(RICHE, "smug"), WIDE, 1900 * M, "08:30"),
        mb("Dix heures. Tu offres un appartement à chaque prof de ton collège. Même celui qui t'a mis zéro.",
           "burstyellow", one(RICHE, "smile"), CLOSE, 1700 * M, "10:00",
           crowd=["Merci !!", "C'est mon élève !", "Je pleure"]),
        mb("Midi. Au restaurant, tu laisses un million de pourboire. Puis tu fais pareil… dans deux cents restaurants.",
           "restaurant", one(RICHE, "smug"), WIDE, 1500 * M, "12:00"),
        mb("Quatorze heures. Ta mère t'appelle pour savoir si tu as mangé. Tu lui achètes cinquante maisons.",
           "cafe", duo(RICHE, "smile", MERE, "shocked"), WIDE, 1450 * M, "14:00"),
        mb("Seize heures. Tu as une crampe au doigt à force de payer. Il reste un milliard quatre cent cinquante millions.",
           "waiting", one(RICHE, "sad"), TIGHT, 1450 * M, "16:00", dark=0.3, shake=True),
        mb("Alors tu engages mille personnes. Chacune reçoit un million… et doit tout dépenser avant minuit.",
           "park", [(POTE, 200, dict(expr="shocked", look=(1, 0))), (RICHE, 540, dict(expr="smug", look="CAM")),
                    (FEMME, 880, dict(expr="shocked", look=(-1, 0)))], WIDE, 450 * M, "18:00", bills=True,
           crowd=["Un million ?!", "Pour moi ?", "Je dépense tout !"]),
        mb("Vingt-deux heures. Tu finances quatre cent cinquante écoles. Une par une. Il reste… zéro. Tu as réussi.",
           "burstblue", one(RICHE, "smile"), CLOSE, 0, "22:00", stamp="RÉUSSI", shake=True),
        mb("Et là, le numéro inconnu t'écrit : demain, la règle s'inverse. Tu pars de zéro… et tu dois gagner un milliard.",
           "park", one(RICHE, "shocked"), TIGHT, 0, "22:01", notif="Demain : GAGNE 1 milliard.",
           notif_from="Numéro inconnu", notif_at=0.3, dark=0.4),
        mb("Partie trois : gagner un milliard en un jour. Abonne-toi pour la voir.", "burst", one(RICHE, "smile"),
           WIDE, 0, "22:01", cta=True),
    ]),
    story("05-roi-princesse", "Le roi promet sa fille… mais la fin est incroyable", BOULANGER,
          "LA FIN EST INCROYABLE", "Le roi promet sa fille à celui qui vaincra le monstre… mais la fin 😱👑",
          ["#conte", "#histoire", "#storytime"], [
        B("Un roi promet sa fille à celui qui vaincra le monstre qui terrorise le royaume.", "chateau",
          duo(ROI, "angry", PRINCESSE, "annoyed"), WIDE, talk=-1),
        B("Le premier à essayer, c'est le chevalier le plus fort du pays. Il revient… sans son armure. Et en pleurant.",
          "chateau", [(CHEVALIER, 540, dict(expr="sad", look="CAM"))], CLOSE, talk=-1),
        B("Le deuxième, c'est le grand magicien. Il lance un sort. Le monstre l'avale. Puis le recrache. Trop amer.",
          "park", duo(MAGICIEN, "shocked", MONSTRE, "angry"), WIDE, talk=-1, shake=True),
        B("Le troisième, c'est le boulanger du village. Pas d'épée. Juste un panier de croissants.", "park",
          one(BOULANGER, "smile"), CLOSE),
        B("Il s'approche du monstre. Et il lui tend un croissant.", "park",
          duo(BOULANGER, "smile", MONSTRE, "angry"), WIDE),
        B("Le monstre goûte. Silence. Puis il se met à pleurer. Personne ne lui avait jamais donné à manger.",
          "park", [(MONSTRE, 540, dict(expr="sad", look="CAM"))], CLOSE, talk=-1, dark=0.2),
        B("Le monstre n'était pas méchant. Il avait juste faim. Depuis trois cents ans.", "park",
          duo(BOULANGER, "smile", MONSTRE, "smile"), WIDE),
        B("Le roi est ravi : tu as gagné, tu épouses ma fille !", "chateau",
          duo(ROI, "smile", BOULANGER, "shocked"), WIDE, talk=-1),
        B("Mais la princesse se lève. Et elle dit : je ne suis pas une récompense.", "chateau",
          [(PRINCESSE, 540, dict(expr="annoyed", look="CAM"))], CLOSE, talk=-1, shake=True),
        B("Elle prend la couronne de son père. Elle devient reine. Et son premier ordre : le boulanger devient boulanger du royaume.",
          "chateau", [(PRINCESSE, 330, dict(expr="smug", look=(1, 0))), (BOULANGER, 760, dict(expr="smile", look=(-1, 0)))],
          WIDE, talk=-1, stamp="REINE"),
        B("Et le monstre ? Il est devenu le garde du château. Payé en croissants.", "chateau",
          [(MONSTRE, 540, dict(expr="smile", look="CAM"))], CLOSE, talk=-1),
        B("Et toi, à la place du boulanger, tu aurais fait quoi ? Dis-le en commentaire.", "chateau",
          duo(BOULANGER, "smile", PRINCESSE, "smile"), WIDE, cta=True),
    ]),
]
