# -*- coding: utf-8 -*-
"""« Dépenser 1 milliard en 1 journée » : compteur « IL TE RESTE » qui descend à chaque achat, horloge,
pluie de billets. Narration à la 2e personne (le spectateur est le héros)."""
from story import B
from galere import CHEF, POTE, FILLE
from histoires import FEMME, HOMME
from histoires3 import Z8, CLOSE, WIDE, TIGHT, one, duo

H = Z8
M = 1_000_000


def b(text, scene, cast, shot, money, clock, **kw):
    return B(text, scene, cast, shot, money=money, clock=clock, **kw)


STORIES = [dict(
    slug="mi01-milliard-1-jour", title="Dépenser 1 milliard en 1 journée", hero=H,
    hook_text="1 MILLIARD avant minuit", caption_y=1330, out="videos-milliard",
    caption="Tu as 1 milliard… mais tu dois TOUT dépenser avant minuit 💸😱 Tu achètes quoi en premier ? 👇",
    hashtags=["#milliard", "#argent", "#etsi", "#defi", "#animation", "#pourtoi", "#fyp"],
    beats=[
        b("Tu as un milliard d'euros. Mais il y a une règle : tout dépenser avant minuit. Sinon, tu perds tout.",
          "burst", one(H, "shocked"), CLOSE, 1000 * M, "08:00", bills=True, rings=True),
        b("Huit heures. Tu veux juste un croissant… alors tu achètes la boulangerie. Deux millions.",
          "cafe", duo(H, "smug", FEMME, "shocked"), WIDE, 998 * M, "08:00"),
        b("Neuf heures. Tu rachètes le supermarché. Courses gratuites pour tout le quartier. Cinquante millions.",
          "supermarket", [(HOMME, 200, dict(expr="shocked", look=(1, 0), bubble="C'est gratuit ?!")),
                          (H, 540, dict(expr="smile", look="CAM")),
                          (FILLE, 880, dict(expr="smile", look=(-1, 0), bubble="Merci !!", bubble_at=0.5))],
          WIDE, 948 * M, "09:00"),
        b("Dix heures. Un jet privé. Avec un pilote… et un deuxième pilote, au cas où. Quatre-vingts millions.",
          "plane", [(H, 932, dict(seated=True, expr="smug", look="CAM"))], (760, 1000, 1.25), 868 * M, "10:00"),
        b("Midi. Le restaurant étoilé ? Tu l'achètes, pour manger seul. Le chef pleure de joie. Quinze millions.",
          "restaurant", [(CHEF, 330, dict(expr="sad", look=(1, 0.1), bubble="Merci monsieur…", bubble_at=0.6)),
                         (H, 932, dict(seated=True, expr="smug", look=(-1, -0.1)))], (620, 1000, 1.2),
          853 * M, "12:00"),
        b("Quatorze heures. Une île privée. Avec une plage rien qu'à toi. Trois cents millions.",
          "beach", one(H, "smug"), WIDE, 553 * M, "14:00"),
        b("Seize heures. Tu paies les études de tous les élèves de ton ancienne école. Vingt millions.",
          "burstyellow", one(H, "smile"), CLOSE, 533 * M, "16:00",
          crowd=["Merci !!", "C'est un héros", "Je l'aime", "Trop fort", "Légende"]),
        b("Dix-huit heures. Problème : il reste plus de la moitié. Et la journée est presque finie.",
          "waiting", one(H, "shocked", pose="up"), TIGHT, 533 * M, "18:00", dark=0.3, shake=True),
        b("Alors tu achètes un club de foot. Entier. Avec le stade. Quatre cents millions.",
          "burstblue", one(H, "smug"), CLOSE, 133 * M, "20:00", rings=True),
        b("Vingt-trois heures cinquante. Il reste cent trente-trois millions. Tu les distribues dans la rue.",
          "park", [(POTE, 200, dict(expr="shocked", look=(1, 0))), (H, 540, dict(expr="smile", look="CAM")),
                   (FEMME, 880, dict(expr="shocked", look=(-1, 0)))], WIDE, 1, "23:50", bills=True,
          crowd=["Des billets !", "Il est fou", "J'ai 1 million", "Encore !", "Merci !"], money_at=0.4),
        b("Vingt-trois heures cinquante-neuf. Il te reste… un euro. Un seul.",
          "park", one(H, "shocked"), TIGHT, 1, "23:59", dark=0.35, red=True),
        b("Tu achètes un chewing-gum. Minuit pile. Zéro euro. Tu as réussi.",
          "supermarket", one(H, "smile"), CLOSE, 0, "00:00", stamp="RÉUSSI", shake=True, money_at=0.3),
        b("Et là, ton téléphone vibre. Un message : bravo… demain, c'est deux milliards.",
          "park", one(H, "shocked"), TIGHT, 0, "00:01", notif="Demain : 2 milliards. Même règle.",
          notif_from="Numéro inconnu", notif_at=0.35, dark=0.4),
        b("Toi, tu achètes quoi en premier ? Dis-le en commentaire.",
          "burst", one(H, "smile"), WIDE, 0, "00:01", cta=True),
    ])]
