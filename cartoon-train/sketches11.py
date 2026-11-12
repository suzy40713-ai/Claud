# -*- coding: utf-8 -*-
"""Série 11 « Refus de… » saison 2 : le format qui a le plus marché sur TikTok (3 524 vues pour le chargeur dans le bus).
Une mère exigeante réclame quelque chose pour son enfant, la victime refuse, l'autorité tranche.
Nouveauté : l'enfant trahit sa mère au pire moment (gag récurrent). Voix ElevenLabs :
E = Agathe, K = Adina (voix montée de 4 demi-tons), V = Léo, A = Aziz.
Rôles et humeurs comme dans sketches.py."""
from sketches import P, SKIN

AGATHE, ADINA, LEO, AZIZ = "SptHT9PQ49isQvxFm28t", "FvmvwvObRqIHojkEGh5N", "jsScnYkNNda9Q1NES5nn", "3r8pRm4HfmSf9lO6MOMl"
VOICES = dict(E=(AGATHE, 1.0, 0.0), K=(ADINA, 1.0, 4.0), V=(LEO, 1.0, 0.0), A=(AZIZ, 1.0, 0.0))


def sk(slug, title, hook, scene, prop, amb, cast, lines, **kw):
    d = dict(slug="r2-" + slug, title=title, hook_text=hook, scene=scene, prop=prop, ambience=amb, cast=cast,
             voices=dict(VOICES), lines=lines, voice_mode="eleven", cta=True, cta_title="Abonne-toi !",
             cta_sub="Un nouveau sketch chaque jour")
    d.update(kw)
    return d


def mom(skin, hair, top, **kw):
    return P(skin=skin, hair=hair, top=top, bottom=kw.pop("bottom", ("skirt", "#2b2d42")),
             shoes=kw.pop("shoes", "#2b2d42"), lipstick=True, **kw)


def kid(skin, hair, top, **kw):
    return P(child=True, skin=skin, hair=hair, top=top, bottom=kw.pop("bottom", ("shorts", "#3b5ba5")),
             shoes="#ffffff", **kw)


SKETCHES = [
    sk("01-fenetre-bus", "Refus de laisser la fenêtre", "Elle veut SA place", "bus", "phone", "vehicle", dict(
        E=mom(SKIN[1], ("bob", "#8d5a3b"), ("blazer", "#e63946", "#ffffff"), earrings="#e8b53a"),
        K=kid(SKIN[1], ("curly", "#8d5a3b"), ("hoodie", "#ffbe0b", "#e0a800")),
        V=P(skin=SKIN[3], hair=("short", "#1c1412"), top=("hoodie", "#264653", "#1d3740"), glasses=True),
        A=P(skin=SKIN[4], hair=("bald", "#1c1412"), hat=("cap", "#1d3557"), beard="#1c1412",
            top=("uniform", "#a8dadc", "#1d3557"), bottom=("pants", "#1d3557"), shoes="#1b1b1b")), [
        ("E", "s", "Excusez-moi, mon fils voudrait votre place, côté fenêtre."),
        ("V", "n", "Il y a plein de places libres, madame."),
        ("E", "m", "Oui, mais c'est celle-ci qu'il veut. Elle a la meilleure vue."),
        ("K", "d", "Maman, je veux voir les camions !"),
        ("V", "a", "Je descends dans deux arrêts."),
        ("E", "g", "Justement, ça ne vous changera rien."),
        ("@ENTER",),
        ("A", "n", "Contrôle des titres de transport, s'il vous plaît."),
        ("E", "g", "Ce monsieur refuse la fenêtre à mon fils !"),
        ("A", "n", "Votre fils a un ticket, madame ?"),
        ("E", "m", "Il a quatre ans. C'est gratuit."),
        ("K", "k", "Mais maman, j'ai neuf ans !"),
        ("A", "a", "Ce sera donc une amende. Et la fenêtre reste au monsieur."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Belle vue, en effet."),
    ]),
    sk("02-siege-cinema", "Refus d'échanger son siège", "Les places d'hier", "cinema", "popcorn", "room", dict(
        E=mom(SKIN[0], ("ponytail", "#e8c15a"), ("cardigan", "#8338ec", "#ffffff")),
        K=kid(SKIN[0], ("spiky", "#e8c15a"), ("tshirt", "#06d6a0"), freckles=True),
        V=P(skin=SKIN[2], hair=("sidepart", "#3a2a1f"), top=("polo", "#457b9d")),
        A=P(skin=SKIN[4], hair=("short", "#1c1412"), top=("uniform", "#9d0208", "#f2c23a"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", held="flashlight")), [
        ("E", "s", "Bonsoir. Vous êtes à la place de mon fils."),
        ("V", "n", "Non, c'est écrit sur mon billet. Rang F, siège douze."),
        ("E", "m", "Mon fils a toujours le siège douze. C'est son chiffre porte-bonheur."),
        ("K", "d", "Maman, je vois rien d'ici !"),
        ("V", "a", "Le film commence dans une minute."),
        ("E", "g", "Alors dépêchez-vous de vous lever."),
        ("@ENTER",),
        ("A", "n", "Un souci, madame ?"),
        ("E", "g", "Ce monsieur a volé le siège de mon fils !"),
        ("A", "n", "Je peux voir vos billets ?"),
        ("K", "k", "Maman, tu avais dit que c'étaient les billets d'hier !"),
        ("A", "a", "Effectivement. La séance d'hier. Je vous raccompagne."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Bon film à moi."),
    ]),
    sk("03-bonbons", "Refus de donner ses bonbons", "Le dernier paquet", "supermarket", "basket", "room", dict(
        E=mom(SKIN[4], ("bun", "#1c1412"), ("blazer", "#2a9d8f", "#ffffff"), earrings="#e8b53a"),
        K=kid(SKIN[4], ("short", "#1c1412"), ("hoodie", "#e63946", "#c92f3b")),
        V=P(skin=SKIN[1], hair=("curly", "#6e5d4e"), top=("tshirt", "#ffd166"), bottom=("pants", "#264653")),
        A=P(skin=SKIN[1], hair=("bob", "#8d5a3b"), top=("apron", "#ffffff", "#2a9d8f"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", held="clipboard", lipstick=True)), [
        ("E", "s", "Excusez-moi, c'est le dernier paquet de bonbons que vous avez là ?"),
        ("V", "n", "Oui. Je l'ai pris il y a cinq minutes."),
        ("E", "m", "Mon fils le voulait. Vous pouvez nous le donner."),
        ("K", "d", "Maman, je veux ceux-là !"),
        ("V", "a", "Il y a d'autres bonbons dans le rayon."),
        ("E", "g", "Il ne mange que ceux-là. C'est un enfant très sensible."),
        ("@ENTER",),
        ("A", "n", "Il y a un problème ?"),
        ("E", "g", "Ce monsieur refuse de donner des bonbons à un enfant !"),
        ("A", "n", "Madame, votre fils en a déjà trois paquets dans sa capuche."),
        ("K", "k", "Chut ! C'était un secret !"),
        ("A", "a", "Ce sera donc trois paquets à payer. Par ici, la caisse."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Le dernier paquet. Parfait."),
    ], victim_standing=True, cart=True),
    sk("04-gouter-glace", "Refus de faire goûter sa glace", "« Juste goûter »", "park", "icecream", "park", dict(
        E=mom(SKIN[2], ("ponytail", "#1c1412"), ("cardigan", "#ff70a6", "#ffffff")),
        K=kid(SKIN[2], ("curly", "#1c1412"), ("tshirt", "#3a86ff")),
        V=P(skin=SKIN[0], hair=("short", "#c26a2b"), top=("hoodie", "#6a994e", "#567d3f"), freckles=True),
        A=P(skin=SKIN[3], hair=("short", "#1c1412"), top=("apron", "#ffffff", "#ff70a6"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", mustache="#1c1412")), [
        ("E", "s", "Excusez-moi, mon fils voudrait juste goûter votre glace."),
        ("V", "n", "Goûter… avec quelle cuillère ?"),
        ("E", "m", "Non, pas une cuillère. La glace. Toute la glace."),
        ("K", "d", "Maman, je veux la glace du monsieur !"),
        ("V", "a", "Le marchand de glaces est juste là."),
        ("E", "g", "Il y a trop de monde. Vous n'allez pas faire la queue à notre place ?"),
        ("@ENTER",),
        ("A", "n", "Tout va bien par ici ?"),
        ("E", "g", "Ce monsieur refuse de partager avec un enfant !"),
        ("A", "n", "Madame, votre fils a déjà eu deux glaces gratuites. Il a dit que c'était son anniversaire."),
        ("K", "k", "C'est mon anniversaire tous les jours !"),
        ("A", "a", "Alors ce sera deux glaces à payer, madame."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Fraise-vanille. Délicieux."),
    ]),
    sk("05-hublot-avion", "Refus d'échanger le hublot", "Le hublot, sinon rien", "plane", "phone", "vehicle", dict(
        E=mom(SKIN[1], ("bun", "#e8c15a"), ("blazer", "#14213d", "#ffffff"), earrings="#e8b53a"),
        K=kid(SKIN[1], ("spiky", "#e8c15a"), ("hoodie", "#ef476f", "#d13d61")),
        V=P(skin=SKIN[5], hair=("short", "#1c1412"), top=("polo", "#ffbe0b")),
        A=P(skin=SKIN[3], hair=("sidepart", "#1c1412"), top=("uniform", "#14213d", "#e63946"), bottom=("pants", "#14213d"),
            shoes="#1b1b1b", held="tray")), [
        ("E", "s", "Bonjour. Mon fils voudrait votre place, près du hublot."),
        ("V", "n", "J'ai payé ce siège, madame. Exprès."),
        ("E", "m", "Il a peur en avion. Voir les nuages le rassure."),
        ("K", "d", "Maman, je veux voir les nuages !"),
        ("V", "a", "Il peut regarder par-dessus mon épaule."),
        ("E", "g", "Il a sept ans, pas un périscope."),
        ("@ENTER",),
        ("A", "n", "Un souci, madame ?"),
        ("E", "g", "Ce monsieur refuse le hublot à un enfant qui a peur !"),
        ("A", "n", "Madame, votre fils vient de dormir sur trois sièges. Il n'avait pas l'air d'avoir peur."),
        ("K", "k", "Et j'ai mangé trois plateaux-repas !"),
        ("A", "a", "Ils étaient pour les passagers des sièges. Je vous apporte l'addition."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Joli nuage."),
    ]),
    sk("06-petit-bain", "Refus de sortir de la piscine", "« Sortez, il veut plonger »", "pool", "cocktail",
       "waves", dict(
        E=mom(SKIN[3], ("ponytail", "#1c1412"), ("tshirt", "#ff006e"), bottom=("shorts", "#264653")),
        K=kid(SKIN[3], ("short", "#1c1412"), ("tshirt", "#ffd166")),
        V=P(skin=SKIN[1], hair=("buzz", "#6e5d4e"), top=("tank", "#ffffff"), bottom=("shorts", "#2a9d8f"),
            shoes="#2a9d8f"),
        A=P(skin=SKIN[2], hair=("short", "#1c1412"), top=("tshirt", "#e63946"), bottom=("shorts", "#e63946"),
            shoes="#1b1b1b", held="clipboard")), [
        ("E", "s", "Excusez-moi, vous pourriez sortir de l'eau ? Mon fils veut plonger ici."),
        ("V", "n", "La piscine est immense, madame."),
        ("E", "m", "Oui, mais il a choisi cet endroit. Il a l'œil d'un champion."),
        ("K", "d", "Maman, je veux plonger !"),
        ("V", "a", "Je viens juste d'arriver."),
        ("E", "g", "Et nous, ça fait dix minutes qu'on attend que vous partiez."),
        ("@ENTER",),
        ("A", "n", "Un problème, madame ?"),
        ("E", "g", "Ce monsieur empêche mon fils de plonger !"),
        ("A", "n", "Madame, c'est le petit bain. Il y a cinquante centimètres d'eau."),
        ("K", "k", "Et maman, j'ai pas pris mon maillot !"),
        ("A", "a", "Alors pas de plongeon aujourd'hui. Ni ici, ni ailleurs."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Ah, cinquante centimètres. Parfait pour moi."),
    ]),
    sk("07-table-restaurant", "Refus de céder sa table", "« Cette table est à nous »", "restaurant", "fries",
       "cafe", dict(
        E=mom(SKIN[0], ("bob", "#1c1412"), ("blazer", "#9d4edd", "#ffffff"), earrings="#e8b53a"),
        K=kid(SKIN[0], ("curly", "#1c1412"), ("tshirt", "#3fa34d")),
        V=P(skin=SKIN[4], hair=("short", "#1c1412"), beard="#1c1412", top=("tshirt", "#4a6fa5")),
        A=P(skin=SKIN[2], hair=("sidepart", "#3a2a1f"), top=("vest", "#1f1f1f", "#ffffff"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", mustache="#3a2a1f", held="notepad")), [
        ("E", "s", "Excusez-moi, vous êtes à notre table."),
        ("V", "n", "J'ai réservé cette table il y a une semaine."),
        ("E", "m", "Nous aussi. Dans notre tête. Il y a très longtemps."),
        ("K", "d", "Maman, je veux m'asseoir près de la fenêtre !"),
        ("V", "a", "Il y a une table libre juste à côté."),
        ("E", "g", "Elle est à vingt centimètres de la fenêtre. C'est inacceptable."),
        ("@ENTER",),
        ("A", "n", "Tout se passe bien ici ?"),
        ("E", "g", "Ce monsieur occupe notre table !"),
        ("A", "n", "Vous avez une réservation, madame ?"),
        ("K", "k", "Maman, tu as dit que c'était demain, l'anniversaire de papa !"),
        ("A", "a", "Effectivement : demain, dix-neuf heures. À demain, madame."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "L'addition sera parfaite."),
    ]),
    sk("08-ordinateur-dessins-animes", "Refus de prêter son ordinateur", "« Juste un dessin animé »",
       "cafe", "laptop", "cafe", dict(
        E=mom(SKIN[3], ("bun", "#1c1412"), ("cardigan", "#06d6a0", "#ffffff")),
        K=kid(SKIN[3], ("spiky", "#1c1412"), ("hoodie", "#3a86ff", "#2f6fd6")),
        V=P(skin=SKIN[1], hair=("sidepart", "#c26a2b"), top=("hoodie", "#6c757d", "#5a6268"), glasses=True),
        A=P(skin=SKIN[4], hair=("short", "#1c1412"), top=("polo", "#e63946"), bottom=("pants", "#1f1f1f"),
            shoes="#1f1f1f", beard="#1c1412", held="clipboard")), [
        ("E", "s", "Excusez-moi, mon fils voudrait regarder un dessin animé sur votre ordinateur."),
        ("V", "n", "Je suis en train de travailler, madame."),
        ("E", "m", "Vous travaillerez après. Lui, il est en vacances."),
        ("K", "d", "Maman, je veux regarder mon dessin animé !"),
        ("V", "a", "Je suis en réunion dans cinq minutes."),
        ("E", "g", "Parfait. Le dessin animé dure quatre heures."),
        ("@ENTER",),
        ("A", "n", "Il y a un problème ?"),
        ("E", "g", "Ce monsieur refuse de partager avec un enfant !"),
        ("A", "n", "Madame, votre fils a commandé trois chocolats chauds… et les a mis sur l'addition du monsieur."),
        ("K", "k", "Il avait l'air gentil !"),
        ("A", "a", "Les trois chocolats sont pour vous, madame. Avec la chantilly."),
        ("E", "k", "Non mais c'est incroyable !"),
        ("@EXIT",),
        ("V", "s", "Enfin, ma réunion."),
    ]),
]
