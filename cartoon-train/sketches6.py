# -*- coding: utf-8 -*-
"""Série 6 : épisodes bonus de Gérard dont la carte de fin envoie vers le lien en bio (guide « fais les mêmes vidéos »)."""
from sketches import P, SKIN
from sketches4 import sk as _sk, L
from sketches5 import GERARD

BIO_LINE = "Tu veux faire les mêmes vidéos ? La formation est dans la bio !"


def ep(n, name, hook, scene, prop, amb, V, A, voices, lines, **kw):
    d = _sk("b%02d" % n, "Gérard · Bonus %d" % n, hook, scene, prop, amb, dict(E=GERARD, V=V, A=A), voices, lines,
            cta_title="Lien dans la bio !", cta_sub="Formation : fais ces vidéos", cta_btn="Voir la bio", **kw)
    d["slug"] = "b%02d-%s" % (n, name)
    return d


SKETCHES = [
    ep(1, "wifi", "Le wifi gratuit. À vie.", "cafe", "laptop", "cafe",
       P(skin=SKIN[1], hair=("ponytail", "#e8c15a"), top=("hoodie", "#2a9d8f", "#21867a")),
       P(skin=SKIN[4], hair=("short", "#1c1412"), top=("polo", "#e63946"), bottom=("pants", "#1f1f1f"),
         shoes="#1f1f1f", beard="#1c1412", held="clipboard"),
       ("pierre", "siwis", "tom"),
       L("Eg Bonjour. Le code wifi, s'il vous plaît. Gratuit, à vie.",
         "Vn Il faut prendre une consommation, monsieur.",
         "Em Je consomme déjà. Je consomme de l'air, et de la chaise.",
         "Va L'air est gratuit. La chaise aussi. Le wifi, non.",
         "Eg Je télécharge juste un film. Un très long film.",
         "Vs §Abonne-toi, le patron adore les longs films.",
         "@ENTER",
         "An Un souci, monsieur ?",
         "Eg Cette employée me prive de connexion !",
         "An Monsieur, vous êtes là depuis sept heures du matin avec un seul verre d'eau.",
         "Ek Mon verre d'eau est très consistant !",
         "An Le wifi est coupé. Pour vous, et pour votre film.",
         "@EXIT",
         "Vs " + BIO_LINE)),
    ep(2, "trop-chaud", "Trop chaud. Puis trop froid.", "restaurant", "fries", "cafe",
       P(skin=SKIN[3], hair=("curly", "#1c1412"), top=("apron", "#ffffff", "#5c3d2e"), bottom=("pants", "#1f1f1f"),
         shoes="#1f1f1f"),
       P(skin=SKIN[0], hair=("sidepart", "#d9d9d9"), top=("blazer", "#ffffff", "#e63946"), bottom=("pants", "#1f1f1f"),
         shoes="#1b1b1b", glasses=True, held="tray", mustache="#d9d9d9"),
       ("pierre", "tom", "jessica"),
       L("Eg Ce plat est brûlant. Je veux un remboursement.",
         "Vn Monsieur, je vous le sors du four à l'instant.",
         "Em Alors laissez-le refroidir. Je reviens dans cinq minutes.",
         "Va D'accord. Il sera tiède à votre retour.",
         "Eg Il est froid ! C'est inadmissible !",
         "Vs §Abonne-toi, le chef a vu la scène.",
         "@ENTER",
         "An Bonsoir. Un problème avec mon plat ?",
         "Eg Votre plat était trop chaud. Puis trop froid. Je veux être remboursé deux fois.",
         "An Monsieur, la température d'un plat change en cinq minutes. C'est de la physique.",
         "Ek La physique est contre moi !",
         "An Voici l'addition. Elle est à la bonne température.",
         "@EXIT",
         "Vs " + BIO_LINE)),
    ep(3, "eau-mouillee", "L'eau est mouillée", "pool", "cocktail", "waiting",
       P(skin=SKIN[0], hair=("curly", "#c26a2b"), top=("tshirt", "#06d6a0"), freckles=True),
       P(skin=SKIN[3], hair=("short", "#1c1412"), top=("uniform", "#ffffff", "#e63946"), bottom=("pants", "#1f1f1f"),
         shoes="#1f1f1f", held="clipboard", mustache="#1c1412"),
       ("pierre", "tom", "jessica"),
       L("Eg Pardon. L'eau de cette piscine est mouillée. Je veux un remboursement.",
         "Vn Monsieur, c'est une piscine.",
         "Em Je voulais nager. Pas me mouiller.",
         "Va On ne peut pas nager sans se mouiller.",
         "Eg Alors c'est un défaut de fabrication.",
         "Vs §Abonne-toi, le maître nageur va lui expliquer.",
         "@ENTER",
         "An Un souci, monsieur ?",
         "Eg Cette piscine est remplie d'eau !",
         "An Monsieur, c'est même le principe d'une piscine.",
         "Ek Personne ne m'avait prévenu !",
         "An C'est écrit sur l'entrée. En très gros. Dehors.",
         "@EXIT",
         "Vs " + BIO_LINE)),
]
