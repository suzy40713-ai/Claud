# -*- coding: utf-8 -*-
"""Format « Les 5 types de… » : chaque type a son personnage et son numéro, narration de Léo (ElevenLabs),
fin qui pousse à taguer un ami. L'audio de chaque phrase est déposé dans build/story-h/<slug>/NN.wav."""
from story import B
from histoires import FEMME, FEMME2, HOMME, HOMME2, MERE
from histoires3 import Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8, Z9, Z10, CLOSE

TAG = "#ffd166"


def t(n, name, text, hero, scene, expr="smug", **kw):
    return B(text, scene, [(hero, 540, dict(expr=expr, look="CAM", tag=("%d. %s" % (n, name), TAG)))], CLOSE, **kw)


def video(slug, l2, subject, hook, caption, beats):
    return dict(slug="t5-" + slug, title="Les 5 types %s %s" % (l2.lower(), subject.lower()), hero=beats[0]["cast"][0][0]
                if beats[0]["cast"] else Z1, beats=beats, header=("LES 5 TYPES", l2, subject), hook_text=hook,
                out="videos-formats", caption=caption,
                hashtags=["#types", "#relatable", "#humour", "#animation", "#pourtoi", "#fyp"])


STORIES = [
    video("eleves", "D'ÉLÈVES", "EN CLASSE", "Tu es lequel ?", "Les 5 types d'élèves en classe 😂 Tu es lequel ? 👇", [
        B("Les cinq types d'élèves en classe. Tu es forcément l'un d'eux.", "burst",
          [(Z8, 540, dict(expr="smile", look="CAM"))], CLOSE),
        t(1, "L'INTELLO", "Un : l'intello. Il rappelle à la prof qu'elle a oublié de donner les devoirs.", Z8,
          "waiting", "smug"),
        t(2, "LE DORMEUR", "Deux : le dormeur. Il est là physiquement. Mentalement, il est en vacances.", Z3,
          "burstblue", "sad"),
        t(3, "L'INQUIET", "Trois : l'inquiet. « On a un contrôle aujourd'hui ? » Chaque cours. Même en sport.", Z9,
          "burstyellow", "shocked"),
        t(4, "LE COMIQUE", "Quatre : le comique. Il fait rire toute la classe… sauf la prof.", Z5, "burst", "smile"),
        t(5, "LE PRESSÉ", "Cinq : le pressé. Il range ses affaires cinq minutes avant la sonnerie.", Z7,
          "waiting", "smug"),
        B("Et toi, tu es lequel ? Dis-le en commentaire.", "burst",
          [(Z8, 230, dict(expr="smile", look="CAM")), (Z3, 540, dict(expr="smile", look="CAM")),
           (Z9, 850, dict(expr="smile", look="CAM"))], (540, 1000, 1.05)),
    ]),
    video("amis", "D'", "AMIS", "Tague le numéro 3", "Les 5 types d'amis 😂 Tague celui qui est le numéro 3 👇", [
        B("Les cinq types d'amis. Tout le monde a au moins le numéro trois.", "burst",
          [(Z1, 540, dict(expr="smile", look="CAM"))], CLOSE),
        t(1, "LE RETARDATAIRE", "Un : le retardataire. « J'arrive dans cinq minutes. » Il n'est même pas habillé.",
          Z1, "bus", "smug"),
        t(2, "LE FAUCHÉ", "Deux : le fauché. Jamais d'argent… mais toujours le dernier téléphone.", Z6,
          "cafe", "smug"),
        t(3, "LE MDR", "Trois : celui qui répond « mdr »… sans jamais rire.", Z4, "burstyellow", "neutral"),
        t(4, "LE POTE MAMAN", "Quatre : le pote maman. Il a toujours des mouchoirs, de l'eau et un chargeur.", Z9,
          "park", "smile"),
        t(5, "LE FANTÔME", "Cinq : le fantôme. Il disparaît trois mois, puis revient comme si de rien n'était.",
          Z10, "burstblue", "smile"),
        B("Tague l'ami qui est le numéro trois.", "burst",
          [(Z1, 230, dict(expr="smile", look="CAM")), (Z4, 540, dict(expr="neutral", look="CAM")),
           (Z9, 850, dict(expr="smile", look="CAM"))], (540, 1000, 1.05)),
    ]),
]
