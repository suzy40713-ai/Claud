# -*- coding: utf-8 -*-
"""Série « Momo » : duo récurrent, humour absurde du quotidien (inspiré des sketchs dialogués qui cartonnent).
Momo a une logique complètement absurde, Léa reste pince-sans-rire ; chaque vidéo finit sur une vraie chute.
Pas d'appel à s'abonner au milieu, sous-titres géants, et une blague cachée sur un panneau du décor."""
from story import B
from sketches import P, SKIN

MOMO = P(skin=SKIN[3], hair=("curly", "#1c1412"), top=("tshirt", "#e63946"), bottom=("pants", "#264653"),
         shoes="#ffffff")
LEA = P(skin=SKIN[1], hair=("bob", "#8d5a3b"), top=("cardigan", "#8338ec", "#ffffff"), bottom=("pants", "#3d405b"),
        shoes="#1b1b1b")

V_MOMO = ("fr_FR-miro-high", None, 0.92, 0.0)
V_LEA = ("fr_FR-siwis-medium", None, 0.95, 0.0)
XM, XL = 330, 760

# lettres d'expression : n neutre, s sourire, m malin, a agacé, g en colère, k choqué, d triste
EX = {"n": "neutral", "s": "smile", "m": "smug", "a": "annoyed", "g": "angry", "k": "shocked", "d": "sad"}


def line(spec, scene):
    """spec = "M:ek texte" ou "L:ek texte" : qui parle, expression de Momo puis de Léa, réplique."""
    who, rest = spec.split(":", 1)
    ex, text = rest.split(" ", 1)
    momo = who == "M"
    cast = [(MOMO, XM, dict(expr=EX[ex[0]], look=(1, 0))), (LEA, XL, dict(expr=EX[ex[1]], look=(-1, 0)))]
    shot = (XM + 150 if momo else XL - 150, 1000, 1.06)  # léger recadrage sur celui qui parle
    return B(text, scene, cast, shot, talk=0 if momo else 1, voice=V_MOMO if momo else V_LEA)


def ep(n, slug, title, hook, scene, sign, lines, caption):
    beats = [line(l_, scene) for l_ in lines]
    return dict(slug="m%02d-%s" % (n, slug), title=title, hero=MOMO, beats=beats, hook_text=hook, caps="keywords", no_title=True,
                caption_y=1390, sign=sign, out="videos-momo", caption=caption,
                hashtags=["#humour", "#sketch", "#animation", "#drole", "#pourtoi", "#fyp"])


STORIES = [
    ep(1, "baguette", "La baguette pas trop cuite", "Une baguette… avec des regrets", "supermarket",
       "Les croissants ne sont pas à vendre. Ils sont en observation.", [
           "M:sn Bonjour, une baguette pas trop cuite, s'il vous plaît.",
           "L:na Pas trop cuite comment ?",
           "M:mn Genre cuite. Mais avec des regrets.",
           "L:nk Des regrets.",
           "M:sa Oui. Qu'elle se dise : j'aurais pu être plus dorée, mais j'ai préféré rester moi-même.",
           "L:na Monsieur, c'est du pain.",
           "M:dn Tout le monde a le droit d'avoir des rêves.",
           "L:nm Tenez. Celle-là a toujours voulu être une biscotte.",
           "M:ks On va tellement bien s'entendre.",
       ], "Une baguette pas trop cuite… mais avec des regrets 🥖😂"),
    ep(2, "ascenseur", "Il appuie 40 fois sur le bouton", "Il appuie 40 fois sur le bouton", "waiting",
       "Ne pas appuyer plus de 47 fois. Merci.", [
           "L:na Momo, ça ne va pas plus vite si tu appuies quarante fois.",
           "M:mn Je sais. C'est pour qu'il sente que je suis pressé.",
           "L:na C'est une machine.",
           "M:aa Toi aussi tu dis ça de moi le lundi matin.",
           "L:nk Il est arrivé en deux secondes.",
           "M:sa Tu vois ? Il m'a senti.",
           "L:na Il était déjà là, Momo.",
           "M:sn Il m'attendait. On a un lien, lui et moi.",
       ], "L'ascenseur et Momo, une histoire d'amour 🛗😂"),
    ep(3, "mot-de-passe", "Le mot de passe impossible", "Le mot de passe impossible", "cafe",
       "Wifi : demandez au serveur. Le serveur : ne me demandez pas.", [
           "L:nn Ton mot de passe doit avoir une majuscule.",
           "M:mn Momo.",
           "L:nn Un chiffre.",
           "M:mn Momo un.",
           "L:na Un caractère spécial.",
           "M:sn Momo un, qui est très gentil.",
           "L:nm Et il ne doit pas contenir ton prénom.",
           "M:kn Alors je ne sais plus qui je suis.",
       ], "Créer un mot de passe en 2026 🔐😂 Tague quelqu'un qui galère"),
    ep(4, "docteur", "J'ai mal partout", "« Docteur, j'ai mal partout »", "waiting",
       "Salle d'attente. Durée moyenne : oui.", [
           "M:dn Docteur, j'ai mal partout. Quand j'appuie ici, j'ai mal. Ici aussi. Et là.",
           "L:nn Montrez-moi votre doigt.",
           "M:nn Mon doigt ?",
           "L:nm Votre doigt est cassé.",
           "M:kn Donc je n'ai mal nulle part ?",
           "L:na Vous avez mal au doigt.",
           "M:sn Ça fait du bien de savoir que le reste va bien.",
           "L:nn Ça fera trente euros.",
           "M:dn Aïe. Ça aussi, ça fait mal partout.",
       ], "« Docteur, j'ai mal partout » 🩺😂"),
    ep(5, "caisse-auto", "Article inattendu", "« Article inattendu dans la zone »", "supermarket",
       "Caisse rapide : pour les gens rapides. Les autres : courage.", [
           "L:nn Article inattendu dans la zone d'ensachage.",
           "M:kn Je n'ai rien posé. J'ai juste posé ma main.",
           "L:na Article inattendu dans la zone d'ensachage.",
           "M:dn Même la machine trouve que je ne devrais pas être là.",
           "L:nn Elle dit ça à tout le monde, Momo.",
           "M:sn Alors on est tous inattendus. C'est beau.",
           "L:na Merci, et à bientôt.",
           "M:ks Elle a dit à bientôt. Elle veut me revoir.",
       ], "La caisse automatique ne m'aime pas 🛒😂"),
    ep(6, "bouche-pleine", "Tout se passe bien ?", "Pourquoi ils demandent TOUJOURS à ce moment-là ?",
       "restaurant", "Notre chef cuisine avec amour. Et un micro-ondes.", [
           "M:an Pourquoi les serveurs demandent toujours si tout va bien quand j'ai la bouche pleine ?",
           "L:nm C'est une technique.",
           "M:kn Une technique pour quoi ?",
           "L:nm Pour que personne ne se plaigne jamais.",
           "M:kn Alors depuis toutes ces années…",
           "L:nn Oui. Ton steak était froid.",
           "M:gn Il était froid ?!",
           "L:na Tu as répondu « mmh ».",
       ], "« Tout se passe bien ? » quand tu as la bouche pleine 🍽️😂"),
    ep(7, "pubs", "20 minutes de pub", "20 minutes de pub avant le film", "cinema",
       "Merci d'éteindre vos téléphones. Et vos pensées.", [
           "M:sn Ça y est, le film commence !",
           "L:nn Non, c'est la pub.",
           "M:sn Ça y est, là, le film commence !",
           "L:na Toujours la pub, Momo.",
           "M:dn Vingt minutes plus tard, j'ai acheté une voiture, une assurance et un shampoing.",
           "L:nn Le film commence.",
           "M:kn Je n'ai plus d'argent pour le pop-corn.",
       ], "Les pubs avant le film au cinéma 🍿😂"),
    ep(8, "creme-solaire", "Indice 50", "Il a mis de l'indice 50…", "beach",
       "Baignade surveillée. Par une mouette.", [
           "L:nk Momo, pourquoi tu es tout rouge ?",
           "M:mn J'ai mis de l'indice cinquante.",
           "L:nn Et alors ?",
           "M:an Il faisait cinquante et un degrés.",
           "L:na Ce n'est pas comme ça que ça marche.",
           "M:gn Alors pourquoi ils écrivent un chiffre ? Pour décorer ?",
           "L:nn C'est un niveau de protection.",
           "M:kn Donc il faut que je monte de niveau.",
           "L:na Il faut que tu en remettes.",
           "M:sn Comme dans un jeu vidéo. Je le savais.",
       ], "La crème solaire indice 50 selon Momo ☀️😂"),
    ep(9, "fond-du-bus", "Avancez au fond", "« Avancez au fond du bus »", "bus",
       "Interdit de parler au chauffeur. Il est timide.", [
           "M:an À chaque fois que j'avance au fond du bus, le fond recule.",
           "L:na C'est un bus, Momo.",
           "M:an Alors pourquoi les gens au fond sont toujours au fond ?",
           "L:nn Parce qu'ils sont montés en premier.",
           "M:kn Donc le fond, c'est un privilège.",
           "L:na Non.",
           "M:sn Un jour, Léa, je serai au fond.",
           "L:nn C'est ton arrêt.",
           "M:dn Pas aujourd'hui, alors.",
       ], "Le fond du bus, ce mystère 🚌😂"),
    ep(10, "pigeon", "Le pigeon me juge", "Ce pigeon me regarde depuis 10 minutes", "park",
       "Ne pas nourrir les pigeons. Ils ont déjà mangé.", [
           "M:an Ce pigeon me regarde depuis dix minutes.",
           "L:nn Il veut ton sandwich.",
           "M:an Non. C'est plus profond que ça. Il me juge.",
           "L:na Momo, c'est un pigeon.",
           "M:kn Il a vu que mon sandwich était au poulet.",
           "L:nk Ah.",
           "M:dn Pour lui, c'est un film d'horreur.",
           "L:nn Mange ta salade, alors.",
           "M:an Il n'y a plus de salade. C'est lui qui l'a mangée.",
           "L:nm Alors vous êtes quittes.",
       ], "Ce pigeon me juge, je le sens 🐦😂"),
]
