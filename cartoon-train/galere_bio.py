# -*- coding: utf-8 -*-
"""Série « galère du créateur » : même héros que galere2, sujets liés à la création de vidéos.
Au milieu et à la fin, la voix et un bandeau renvoient vers le lien en bio (le guide Beacons)."""
from story import B
from galere import POTE, POTE2, FILLE, MERE, CHEF
from galere2 import HERO

H = "H"
MID = "Petite pause : tu veux lancer ta chaîne d'animation et apprendre à la monétiser ? Le guide est dans ma bio."
END = "Tu veux créer tes propres animations et faire grandir ta chaîne ? Tout est expliqué dans le guide, en bio."


def b(slug, subject, beats, line2="D'ÊTRE"):
    if not beats[0]["cast"]:
        beats[0]["cast"] = [(H, 540, dict(expr="annoyed", look="CAM"))]
    for x in beats:
        x["cast"] = [(HERO if c[0] == H else c[0], c[1], c[2]) for c in x["cast"]]
    return dict(slug="b" + slug, title="Pourquoi c'est la galère %s %s" % (line2.lower(), subject.lower()),
                hero=HERO, beats=beats, header=("POURQUOI C'EST LA GALÈRE", line2, subject), out="videos-galere-bio",
                mid_title="Fais pareil !", mid_sub="Le guide est en bio", mid_btn="Voir la bio",
                cta_title="Le guide est dans ma bio", cta_btn="Voir la bio",
                caption="Pourquoi c'est la galère %s %s 😩 Le guide pour faire les mêmes vidéos est dans ma bio 👆" % (
                    line2.lower(), subject.lower()),
                hashtags=["#galere", "#youtube", "#animation", "#createur", "#pourtoi", "#fyp"])


def mid(scene="burst"):
    return B(MID, scene, [(H, 540, dict(expr="smile", look="CAM", pose="gesture"))], (540, 1000, 1.25), mid_cta=True)


def end():
    return B(END, "burst", [(H, 540, dict(expr="smile", look="CAM", pose="gesture"))], (540, 1000, 1.25), cta=True)


STORIES = [
    b("01-youtubeur", "YOUTUBEUR", [
        B("Pourquoi c'est la galère d'être youtubeur ?", "burst", [], (540, 1000, 1.0)),
        B("Tu passes six heures sur une vidéo. Elle fait douze vues. Dont trois de ta mère.", "burstblue",
          [(H, 540, dict(expr="sad", look="CAM", tag=("12 VUES", "#ff4757")))], (540, 1000, 1.3)),
        B("Ta famille pense que tu ne travailles pas. Tu joues sur l'ordinateur, c'est tout.", "waiting",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (MERE, 760, dict(expr="smile", look=(-1, 0), bubble="Et ton vrai métier ?"))], (540, 1000, 1.1)),
        mid(),
        B("Tu refais la même phrase vingt fois parce que tu as bafouillé sur un seul mot.", "burstyellow",
          [(H, 540, dict(expr="angry", look="CAM", tag=("PRISE 20", "#ffd166")))], (540, 1000, 1.3)),
        B("Et dès que tu postes, tu actualises les statistiques toutes les trente secondes.", "burst",
          [(H, 540, dict(expr="shocked", look=(0, 0.6)))], (540, 1000, 1.3)),
        B("Mais le jour où une vidéo décolle, tu oublies toutes les galères d'avant.", "burst",
          [(H, 540, dict(expr="smile", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        end(),
    ]),
    b("02-zero-abonne", "ZÉRO ABONNÉ", [
        B("Pourquoi c'est la galère d'avoir zéro abonné ?", "burst", [], (540, 1000, 1.0)),
        B("Tu publies ta première vidéo. Le seul commentaire, c'est toi qui l'as écrit.", "burstblue",
          [(H, 540, dict(expr="sad", look="CAM", bubble="Trop bien cette vidéo !"))], (540, 1000, 1.3)),
        B("Tu demandes à tes amis de s'abonner. Ils disent oui. Ils ne le font jamais.", "cafe",
          [(H, 330, dict(expr="annoyed", look=(1, 0))), (POTE, 932, dict(seated=True, expr="smug", look=(-1, 0)))],
          (620, 1000, 1.2)),
        mid("burstyellow"),
        B("Ton compteur reste bloqué à quarante-huit pendant des semaines.", "burst",
          [(H, 540, dict(expr="sad", look="CAM", tag=("48", "#ffd166")))], (540, 1000, 1.3)),
        B("Et tu vois des comptes qui font un million de vues avec un chat qui éternue.", "burstblue",
          [(H, 540, dict(expr="angry", look="CAM"))], (540, 1000, 1.3), crowd=["1 M de vues", "Viral !", "Atchoum"]),
        B("Mais chaque gros créateur a commencé exactement à zéro. Comme toi.", "burst",
          [(H, 540, dict(expr="smile", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        end(),
    ], line2="D'AVOIR"),
    b("03-monter", "MONTER SES VIDÉOS", [
        B("Pourquoi c'est la galère de monter ses vidéos ?", "burst", [], (540, 1000, 1.0)),
        B("Quarante secondes de vidéo. Quatre heures de montage.", "burstyellow",
          [(H, 540, dict(expr="shocked", look="CAM", tag=("4 HEURES", "#ff4757")))], (540, 1000, 1.3)),
        B("Ton téléphone n'a plus de place. Tu dois choisir entre tes photos et ton projet.", "waiting",
          [(H, 540, dict(expr="sad", look=(0, 0.6), bubble="Stockage plein"))], (540, 1000, 1.3)),
        mid(),
        B("L'application plante juste avant que tu enregistres. Tu recommences tout.", "burstblue",
          [(H, 540, dict(expr="angry", look="CAM"))], (540, 1000, 1.3)),
        B("Et tu passes une heure à décaler un sous-titre de deux millimètres.", "burst",
          [(H, 540, dict(expr="annoyed", look=(0, 0.6)))], (540, 1000, 1.3)),
        B("Mais avec un projet modèle, la vidéo suivante prend trois fois moins de temps.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("ASTUCE", "#25d366")))], (540, 1000, 1.3)),
        end(),
    ], line2="DE"),
    b("04-idees", "TROUVER DES IDÉES", [
        B("Pourquoi c'est la galère de trouver des idées de vidéos ?", "burst", [], (540, 1000, 1.0)),
        B("Sous la douche, tu as dix idées géniales. Devant ton téléphone, plus aucune.", "burstblue",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3)),
        B("Tu notes une idée à trois heures du matin. Le lendemain, tu ne comprends pas ce que tu as écrit.", "waiting",
          [(H, 540, dict(expr="annoyed", look=(0, 0.6), bubble="Chat… fusée… ?"))], (540, 1000, 1.3)),
        mid("burstyellow"),
        B("Tu demandes des idées à tes amis. Ils te proposent tous la même chose.", "cafe",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (POTE2, 932, dict(seated=True, expr="smile", look=(-1, 0), bubble="Fais une vidéo de chat"))],
          (620, 1000, 1.2)),
        B("Et quand tu trouves enfin une idée, tu découvres que quelqu'un l'a déjà faite hier.", "burst",
          [(H, 540, dict(expr="sad", look="CAM"))], (540, 1000, 1.3)),
        B("Mais avec un personnage récurrent, chaque lieu devient un nouvel épisode.", "burst",
          [(H, 540, dict(expr="smile", look="CAM", tag=("ASTUCE", "#25d366")))], (540, 1000, 1.3)),
        end(),
    ], line2="DE"),
    b("05-createur-anime", "CRÉATEUR D'ANIMATION", [
        B("Pourquoi c'est la galère d'être créateur d'animation ?", "burst", [], (540, 1000, 1.0)),
        B("Tout le monde pense que tu sais dessiner. Toi, tu fais des bonshommes bâtons.", "burstblue",
          [(H, 540, dict(expr="annoyed", look="CAM", tag=("BONHOMME BÂTON", "#ffd166")))], (540, 1000, 1.3)),
        B("Ton personnage change de tête d'une vidéo à l'autre. Les gens croient que c'est son frère.", "burst",
          [(H, 330, dict(expr="shocked", look=(1, 0))), (H, 760, dict(expr="shocked", look=(-1, 0)))],
          (540, 1000, 1.1)),
        mid(),
        B("Faire parler un personnage, c'est ouvrir et fermer une bouche trois cents fois.", "burstyellow",
          [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.3)),
        B("Et ta voix enregistrée sonne comme si tu étais au fond d'une piscine.", "pool",
          [(H, 932, dict(seated=True, expr="sad", look="CAM"))], (900, 1000, 1.4)),
        B("Mais un personnage animé ne vieillit jamais, ne tombe jamais malade et ne demande jamais de salaire.",
          "burst", [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        end(),
    ]),
]
