# -*- coding: utf-8 -*-
"""Lot « percer » : basé sur ce qui a le mieux marché sur la chaîne.
- 3 suites des vidéos les plus vues (« tout le monde dit la vérité », « recommencer à dix ans », « parents à ton âge »)
- 5 nouveaux « Et si tu… » sur la vie de tous les jours (école, téléphone, amis)
- 2 galères universelles
Narration de Léo (ElevenLabs), déposée dans build/story-h/<slug>/NN.wav."""
import histoires3
import histoires4
import galere2
from story import B
from galere import MERE, PERE, POTE, FILLE, CHEF
from histoires import FEMME, HOMME, HOMME2, NOIR
from histoires3 import Z2, Z3, Z6, Z9, CLOSE, WIDE, TIGHT, one, seated, duo

H = "H"
OUT = "videos-percer"
END = "Abonne-toi pour la partie deux."
HASH = ["#etsi", "#histoire", "#storytime", "#animation", "#pourtoi", "#fyp"]


def hero_of(slug):
    return next(s["hero"] for s in histoires3.STORIES + histoires4.STORIES if s["slug"] == slug)


def etsi(slug, title, hero, hook, caption, beats):
    return dict(slug="pc" + slug, title=title, hero=hero, beats=beats, hook_text=hook, caption_y=1330, out=OUT,
                caption=caption, hashtags=HASH)


def end(h, scene, text=END, **kw):
    return B(text, scene, one(h, "shocked"), CLOSE, cta=True, **kw)


VERITE, DIXANS, PARENTS = hero_of("z10-verite"), hero_of("z08-recommencer"), hero_of("y4-05-parents-ton-age")

ETSI = [
    etsi("01-verite-2", "Et si tout le monde te disait la vérité ? Partie 2", VERITE,
         "Partie 2 : son seul mensonge", "Partie 2 : le seul mensonge de ton meilleur ami… 😳", [
        B("Partie deux. Minuit une. Les vingt-quatre heures de vérité sont terminées.", "park",
          one(VERITE, "shocked"), CLOSE, rings=True, dark=0.3),
        B("Mais ton meilleur ami t'a promis de te dire son seul mensonge. Alors tu l'appelles.", "park",
          one(VERITE, "annoyed"), CLOSE, dark=0.3),
        B("Il soupire. Et il dit : « Le jour où on s'est rencontrés, ce n'était pas un hasard. »", "cafe",
          duo(VERITE, "shocked", HOMME2, "sad"), WIDE, mid_cta=True),
        B("« Ta mère m'a donné dix euros pour que je devienne ton ami. On avait six ans. »", "cafe",
          one(HOMME2, "sad", tag=("10 €", "#ff4757")), CLOSE),
        B("Tu restes sans voix. Tu appelles ta mère, en pleine nuit.", "waiting", one(VERITE, "angry"), CLOSE),
        B("Elle répond : « Oui, je lui ai donné dix euros. Mais il me les a rendus le lendemain. »", "waiting",
          duo(VERITE, "shocked", MERE, "smile"), WIDE),
        B("« Il m'a dit : je n'en veux pas. Je l'aime bien, pour de vrai. »", "park", one(VERITE, "smile"), TIGHT),
        end(VERITE, "park", "Abonne-toi pour la partie trois."),
    ]),
    etsi("02-dix-ans-2", "Et si tu recommençais ta vie à dix ans ? Partie 2", DIXANS,
         "Partie 2 : il ne te reconnaît pas", "Partie 2 : tu retrouves ton meilleur ami d'enfance… 😶", [
        B("Partie deux. Tu as refusé de recommencer une deuxième fois. L'inconnu a disparu.", "park",
          one(DIXANS, "sad"), CLOSE, rings=True),
        B("Alors tu décides de retrouver ton meilleur ami d'enfance. Celui que tu avais oublié.", "bus",
          seated(DIXANS, "neutral"), (900, 1000, 1.4)),
        B("Il habite toujours dans la même rue. Il ouvre la porte… et il ne te reconnaît pas.", "park",
          duo(DIXANS, "smile", HOMME, "neutral"), WIDE, mid_cta=True),
        B("Tu lui parles de vos cabanes, de vos goûters, de vos secrets. Il sourit poliment.", "park",
          duo(DIXANS, "smile", HOMME, "annoyed"), WIDE),
        B("Puis il te dit : « Désolé. Un inconnu m'a aussi proposé de recommencer ma vie. »", "park",
          one(HOMME, "sad"), CLOSE, dark=0.3),
        B("« J'ai accepté. Et dans ma nouvelle vie… je ne t'ai jamais rencontré. »", "park",
          one(DIXANS, "shocked"), TIGHT, dark=0.5, red=True),
        end(DIXANS, "park", "Abonne-toi pour la partie trois.", dark=0.4),
    ]),
    etsi("03-parents-2", "Et si tes parents avaient ton âge ? Partie 2", PARENTS,
         "Partie 2 : ça n'a pas marché", "Partie 2 : tes parents ont TOUJOURS ton âge 😭", [
        B("Partie deux. Le lendemain matin, tes parents ont toujours ton âge. Ça n'a pas marché.", "burst",
          one(PARENTS, "shocked"), CLOSE, rings=True),
        B("Ton père veut un téléphone. Ta mère veut un compte TikTok. Ils te supplient.", "waiting",
          duo(PARENTS, "annoyed", FEMME, "smile", bubble="S'il te plaît !"), WIDE),
        B("Ta mère publie une vidéo. Un million de vues en une nuit. Toi, tu en es toujours à quatre-vingts abonnés.",
          "burstblue", one(PARENTS, "angry", tag=("1 000 000", "#25d366")), CLOSE, mid_cta=True),
        B("Ton père refuse de faire ses devoirs. Et c'est toi qu'on convoque chez le directeur.", "waiting",
          duo(PARENTS, "sad", CHEF, "angry"), WIDE),
        B("Le soir, tu leur fais à manger, tu ranges leur chambre, tu leur dis d'aller se coucher.", "burst",
          one(PARENTS, "annoyed"), CLOSE),
        B("Et là, tu comprends enfin pourquoi ta mère est toujours fatiguée.", "burst", one(PARENTS, "sad"), TIGHT),
        end(PARENTS, "burst", "Abonne-toi pour la partie trois."),
    ]),
    etsi("04-vraie-raison", "Et si ton téléphone affichait la vraie raison de chaque message ?", Z2,
         "La VRAIE raison de chaque message", "Ton téléphone affiche la vraie raison de chaque message… 📱", [
        B("Et si, sous chaque message, ton téléphone affichait la vraie raison pour laquelle on te l'a envoyé ?",
          "burst", one(Z2, "shocked"), CLOSE, rings=True),
        B("Ta mère : « Tu rentres à quelle heure ? » Vraie raison : elle a fait des crêpes, et ton frère les mange.",
          "waiting", one(Z2, "smug", bubble="Des crêpes ?!"), CLOSE),
        B("Ton pote : « T'es libre samedi ? » Vraie raison : il a besoin de quelqu'un pour porter son canapé.", "cafe",
          duo(Z2, "annoyed", HOMME2, "smile"), WIDE, mid_cta=True),
        B("Ton crush : « Mdr. » Vraie raison : il n'a pas rigolé. Il voulait juste te répondre.", "bus",
          seated(Z2, "smile", tag=("IL VOULAIT RÉPONDRE", "#25d366")), (900, 1000, 1.4)),
        B("Un numéro inconnu : « Salut, c'est moi. » Vraie raison… le téléphone n'arrive pas à l'afficher.", "burst",
          one(Z2, "shocked", tag=("???", "#ff4757")), CLOSE, dark=0.3),
        B("Puis un deuxième message arrive : « Ne crois pas tout ce que ton téléphone t'affiche. »", "burst",
          one(Z2, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z2, "burst", dark=0.45),
    ]),
    etsi("05-commentateur", "Et si un commentateur sportif décrivait ta vie en direct ?", Z3,
         "Un commentateur commente TA vie", "Un commentateur sportif décrit ta vie en direct… 🎙️😂", [
        B("Et si chaque matin, un commentateur sportif décrivait ta vie en direct ?", "burst",
          one(Z3, "shocked"), CLOSE, rings=True),
        B("« Il se lève… non ! Il appuie sur rappel ! Quelle erreur tactique ! »", "burstblue",
          one(Z3, "annoyed", tag=("RAPPEL", "#ffd166")), CLOSE),
        B("En contrôle : « Il regarde la copie du voisin… carton jaune ! »", "waiting",
          one(Z3, "shocked", tag=("CARTON JAUNE", "#ffd166")), CLOSE, mid_cta=True),
        B("Ton crush passe : « Il tente un sourire… et c'est le raté complet ! »", "park",
          duo(Z3, "smile", FILLE, "neutral"), WIDE),
        B("Toute la classe l'entend. Ils commencent à parier sur toi.", "burstyellow",
          one(Z3, "sad"), CLOSE, crowd=["Il va rater", "Je parie 2 €", "Allez !"]),
        B("Mais un jour, le commentateur se tait. Et une autre voix dit : « Bonsoir. C'est le dernier match. »",
          "burst", one(Z3, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z3, "burst", dark=0.45),
    ]),
    etsi("06-vitesse-x2", "Et si tu pouvais mettre ta vie en vitesse x2 ?", Z6,
         "Ta vie en vitesse x2", "Un bouton pour passer les moments ennuyeux en accéléré… ⏩", [
        B("Et si tu avais un bouton pour mettre ta vie en vitesse fois deux ?", "burst",
          one(Z6, "shocked", tag=("x2", "#ffd166")), CLOSE, rings=True),
        B("Le cours de maths ? Fois deux. Une heure devient trente minutes.", "waiting",
          one(Z6, "smug", tag=("x2", "#25d366")), CLOSE),
        B("Les files d'attente, les trajets en bus, les dimanches pluvieux : fois deux.", "bus",
          seated(Z6, "smile"), (900, 1000, 1.4), mid_cta=True),
        B("Les semaines défilent. Tu ne gardes que les bons moments.", "park", one(Z6, "smile"), CLOSE),
        B("Un matin, tu te regardes dans le miroir. Tu as vingt-cinq ans. Tu ne te souviens de presque rien.",
          "burst", one(Z6, "shocked"), TIGHT, dark=0.4),
        B("Alors tu cherches un bouton pour revenir en arrière. Mais il n'y en a qu'un autre : fois quatre.",
          "burst", one(Z6, "shocked", tag=("x4", "#ff4757")), TIGHT, dark=0.55, red=True),
        end(Z6, "burst", dark=0.45),
    ]),
    etsi("07-sommeil", "Et si tu pouvais acheter des heures de sommeil ?", Z9,
         "Acheter du sommeil", "Tu pourrais acheter des heures de sommeil… 😴", [
        B("Et si tu pouvais acheter des heures de sommeil, comme on achète du pain ?", "supermarket",
          one(Z9, "shocked"), CLOSE, rings=True),
        B("Une heure coûte deux euros. Tu dors huit heures en dix secondes.", "supermarket",
          one(Z9, "smile", tag=("2 € / HEURE", "#25d366")), CLOSE),
        B("Plus besoin de te coucher. Tu révises toute la nuit. Tu joues toute la nuit.", "burstblue",
          one(Z9, "smug"), CLOSE, mid_cta=True),
        B("Mais les prix montent. Cinq euros l'heure. Puis vingt. Puis cent.", "supermarket",
          one(Z9, "shocked", tag=("100 € / HEURE", "#ff4757")), CLOSE),
        B("Les riches dorment. Les autres, non. Toute la ville a des cernes.", "bus",
          seated(Z9, "sad"), (900, 1000, 1.4), dark=0.3),
        B("Un soir, tu n'as plus d'argent. Tu fermes les yeux… et tu as oublié comment on dort tout seul.",
          "burst", one(Z9, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z9, "burst", dark=0.45),
    ]),
    etsi("08-musique-de-fond", "Et si ta vie avait une musique de fond que tout le monde entend ?", NOIR,
         "La musique de fond de TA vie", "Ta vie a une musique de fond… et tout le monde l'entend 🎵", [
        B("Et si ta vie avait une musique de fond… que tout le monde pouvait entendre ?", "burst",
          one(NOIR, "shocked"), CLOSE, rings=True),
        B("Tu entres en classe : musique de héros. Tout le monde se retourne.", "waiting",
          one(NOIR, "smug", tag=("HÉROS", "#25d366")), CLOSE),
        B("Tu rates une marche : petite musique de dessin animé. Tout le monde rit.", "park",
          one(NOIR, "sad"), CLOSE, mid_cta=True, crowd=["Ha ha !", "Encore !", "Trop drôle"]),
        B("Ton crush te regarde : des violons. Très forts. Beaucoup trop forts.", "park",
          duo(NOIR, "shocked", FILLE, "smile"), WIDE),
        B("Tu ne peux plus rien cacher. Ni ta peur, ni ta joie, ni tes mensonges.", "burstblue",
          one(NOIR, "annoyed"), CLOSE),
        B("Mais un soir, seul dans ta chambre, tu entends une musique de film d'horreur.", "burst",
          one(NOIR, "shocked"), TIGHT, dark=0.6, red=True),
        end(NOIR, "burst", dark=0.5),
    ]),
]


def galere(slug, subject, beats, line2="D'AVOIR"):
    d = galere2.p(slug, subject, beats, line2=line2)
    d["slug"] = "pg" + slug
    d["out"] = OUT
    return d


GEND = "Abonne-toi pour la prochaine galère, et tague quelqu'un qui est concerné."


def gend():
    return B(GEND, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True)


GALERES = [
    galere("01-prenom-rare", "UN PRÉNOM RARE", [
        B("Pourquoi c'est la galère d'avoir un prénom rare ?", "burst", [], (540, 1000, 1.0)),
        B("Tu ne trouveras jamais ton prénom sur un porte-clés. Jamais.", "supermarket",
          [(H, 540, dict(expr="sad", look="CAM", tag=("INTROUVABLE", "#ff4757")))], (540, 1000, 1.25)),
        B("Le premier jour de l'année, le prof s'arrête sur la liste. Silence. Il essaie. Il échoue.", "waiting",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (CHEF, 760, dict(expr="shocked", look=(-1, 0), bubble="Euh…"))], (540, 1000, 1.1)),
        B("Au café, ils écrivent ton prénom sur le gobelet. Ce n'est jamais le tien.", "cafe",
          [(H, 540, dict(expr="annoyed", look="CAM", tag=("???", "#ffd166")))], (540, 1000, 1.2), mid_cta=True),
        B("Tu l'épelles tellement souvent au téléphone que tu connais l'alphabet par cœur.", "burstblue",
          [(H, 540, dict(expr="sad", look=(0, 0.5)))], (540, 1000, 1.3)),
        B("Et les gens te demandent : « Mais tu l'aimes, ton prénom ? »", "park",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (FILLE, 760, dict(expr="smile", look=(-1, 0), bubble="Tu l'aimes ?"))], (540, 1000, 1.1)),
        B("Mais personne ne t'oublie jamais. Tu es le seul à t'appeler comme ça.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        gend(),
    ]),
    galere("02-parents-techno", "DES PARENTS NULS EN TECHNOLOGIE", [
        B("Pourquoi c'est la galère d'avoir des parents nuls en technologie ?", "burst", [], (540, 1000, 1.0)),
        B("Ta mère t'appelle pour savoir comment envoyer une photo. Elle est dans la cuisine. À trois mètres.",
          "waiting", [(H, 330, dict(expr="annoyed", look=(1, 0))),
                      (MERE, 760, dict(expr="smile", look=(-1, 0), bubble="Ça marche pas !"))], (540, 1000, 1.1)),
        B("Ton père écrit tous ses messages en majuscules. Tu crois toujours qu'il est en colère.", "burstyellow",
          [(H, 540, dict(expr="shocked", look=(0, 0.5), tag=("TU RENTRES QUAND", "#ff4757")))], (540, 1000, 1.25)),
        B("Ils signent leurs messages : « Bisous, Maman. » Comme si tu ne savais pas qui c'était.", "burst",
          [(H, 540, dict(expr="annoyed", look="CAM"))], (540, 1000, 1.3), mid_cta=True),
        B("Ils ont cinquante onglets ouverts, et ils demandent pourquoi le téléphone est lent.", "burstblue",
          [(H, 330, dict(expr="annoyed", look=(1, 0))), (PERE, 760, dict(expr="shocked", look=(-1, 0)))],
          (540, 1000, 1.1)),
        B("Et ils t'envoient des vidéos que tu as déjà vues… il y a trois ans.", "burst",
          [(H, 540, dict(expr="sad", look="CAM", tag=("VU EN 2023", "#ffd166")))], (540, 1000, 1.3)),
        B("Mais grâce à eux, tu es devenu le meilleur dépanneur du monde. Gratuitement.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        gend(),
    ]),
]

STORIES = ETSI + GALERES
