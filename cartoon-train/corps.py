# -*- coding: utf-8 -*-
"""Série « Ton corps » : faits sur le corps humain racontés par un narrateur rapide et expressif,
sous-titres en mots-clés au centre, musique légère (style vidéos éducatives animées)."""
from story import B
from histoires import FEMME, FEMME2, HOMME, HOMME2, PATRON, SERVEUR, MERE
from histoires3 import Z1, Z2, Z3, Z5, Z9, one, seated, duo

VOICE = ("fr_FR-upmc-medium", 1, 0.88, 3.0)   # « pierre », plus rapide et 3 demi-tons plus haut
CLOSE = (540, 1000, 1.35)
WIDE = (540, 1000, 1.1)
TIGHT = (540, 980, 1.7)


def story(slug, title, hero, hook, caption, beats):
    return dict(slug="c" + slug, title=title, hero=hero, beats=beats, hook_text=hook, caption_y=1200,
                caps="keywords", music=True, no_title=True, voice=VOICE, out="videos-corps", caption=caption,
                hashtags=["#tonCorps", "#lesavaistu", "#science", "#animation", "#pourtoi", "#fyp"])


STORIES = [
    story("01-sommeil", "Ce qui arrive à ton corps si tu ne dors pas", Z1,
          "Et si tu ne dormais plus ?", "Ce qui arrive à ton corps heure après heure quand tu ne dors pas. 😵", [
        B("Voici ce qui arrive à ton corps si tu arrêtes de dormir.", "park",
          one(Z1, "shocked"), CLOSE, rings=True),
        B("Après seize heures sans dormir, ton cerveau commence déjà à ralentir. Tu oublies des mots, tu relis trois fois la même phrase.",
          "bus", seated(Z1, "neutral"), (900, 1000, 1.4)),
        B("Au bout de dix-sept à dix-neuf heures, tes réflexes ressemblent à ceux d'une personne qui a bu un peu d'alcool.",
          "cafe", seated(Z1, "annoyed", tag=("19 H", "#ffd166")), (900, 1000, 1.4)),
        B("À vingt-quatre heures, c'est comme si tu en avais bu encore plus. Conduire devient vraiment dangereux.",
          "park", one(Z1, "sad", tag=("24 H", "#ff4757")), CLOSE, mid_cta=True),
        B("Ton cerveau commence alors à faire des micro-sommeils : il s'éteint quelques secondes, sans que tu t'en rendes compte.",
          "waiting", seated(Z1, "neutral"), (900, 1000, 1.45), dark=0.25),
        B("Ta faim augmente aussi. Les hormones qui contrôlent l'appétit se dérèglent, et tu as envie de sucre et de gras.",
          "supermarket", one(Z1, "smug", tag=("SUCRE", "#ffd166")), CLOSE),
        B("Après deux ou trois jours, certaines personnes voient même des choses qui n'existent pas.",
          "park", one(Z1, "shocked"), TIGHT, dark=0.4),
        B("En mille neuf cent soixante-quatre, un lycéen américain, Randy Gardner, est resté éveillé onze jours. C'est l'un des records les plus connus.",
          "park", one(Z1, "shocked", tag=("11 JOURS", "#ff4757")), CLOSE),
        B("Moralité : le sommeil n'est pas du temps perdu. C'est le moment où ton cerveau fait le ménage.",
          "park", one(Z1, "smile"), CLOSE),
        B("Abonne-toi pour découvrir d'autres secrets de ton corps.", "park", one(Z1, "smile"), CLOSE, cta=True),
    ]),

    story("02-chair-de-poule", "Pourquoi tu as la chair de poule", Z2,
          "La chair de poule, ça sert à quoi ?", "Ta chair de poule est un reste de nos ancêtres très poilus. 🐒", [
        B("Pourquoi est-ce que tu as la chair de poule ?", "park", one(Z2, "shocked"), CLOSE, rings=True),
        B("Sous chaque poil de ta peau, il y a un muscle minuscule. Quand tu as froid, il se contracte et redresse le poil.",
          "park", one(Z2, "neutral"), CLOSE),
        B("C'est ça, les petites bosses sur ta peau. Mais chez toi, ça ne sert presque plus à rien.",
          "beach", one(Z2, "annoyed"), CLOSE),
        B("Chez nos ancêtres, beaucoup plus poilus, les poils dressés emprisonnaient de l'air chaud. Comme un manteau.",
          "park", one(Z2, "smile"), CLOSE, mid_cta=True),
        B("Les poils hérissés servaient aussi à paraître plus gros face à un danger. Regarde un chat qui a peur : c'est le même réflexe.",
          "park", one(Z2, "shocked"), CLOSE),
        B("Et ce réflexe ne s'active pas qu'avec le froid. Une émotion forte peut le déclencher.",
          "cinema", seated(Z2, "shocked"), (900, 1000, 1.4), dark=0.3),
        B("Une musique qui te touche, un film qui fait peur, un discours émouvant : ton corps libère de l'adrénaline, et tes poils se dressent.",
          "cinema", seated(Z2, "shocked", tag=("FRISSON", "#ffd166")), (900, 1000, 1.45), dark=0.3),
        B("Ce petit frisson, c'est donc un souvenir de l'époque où nos ancêtres avaient une fourrure.",
          "park", one(Z2, "smile"), CLOSE),
        B("Abonne-toi pour d'autres faits sur ton corps.", "park", one(Z2, "smile"), CLOSE, cta=True),
    ]),

    story("03-hoquet", "Pourquoi tu as le hoquet", Z3,
          "Le hoquet, d'où ça vient ?", "Le hoquet commence avant même ta naissance. 😳", [
        B("Pourquoi est-ce que tu as le hoquet ?", "park", one(Z3, "shocked"), CLOSE, rings=True),
        B("Sous tes poumons, il y a un grand muscle : le diaphragme. C'est lui qui t'aide à respirer.",
          "park", one(Z3, "neutral"), CLOSE),
        B("Parfois, il se contracte d'un coup, sans prévenir. L'air entre très vite dans ta gorge.",
          "restaurant", seated(Z3, "shocked"), (900, 1000, 1.4)),
        B("Juste après, tes cordes vocales se ferment brusquement. Et ça fait : hic !",
          "restaurant", seated(Z3, "shocked", tag=("HIC !", "#ffd166")), (900, 1000, 1.45), mid_cta=True),
        B("Manger trop vite, boire une boisson gazeuse ou avaler de l'air peut le déclencher.",
          "cafe", seated(Z3, "annoyed"), (900, 1000, 1.4)),
        B("Le plus étonnant ? Tu avais déjà le hoquet avant de naître, dans le ventre de ta mère.",
          "waiting", duo(MERE, "smile", Z3, "shocked"), WIDE),
        B("Les scientifiques pensent que ça entraînait tes muscles à respirer, bien avant ta première vraie respiration.",
          "waiting", one(Z3, "smile"), CLOSE),
        B("Et un homme, Charles Osborne, a eu le hoquet pendant soixante-huit ans. C'est un record du monde.",
          "park", one(Z3, "shocked", tag=("68 ANS", "#ff4757")), CLOSE),
        B("Abonne-toi pour découvrir d'autres bizarreries de ton corps.", "park", one(Z3, "smile"), CLOSE, cta=True),
    ]),

    story("04-eau", "Combien de temps tu peux tenir sans boire", Z5,
          "Combien de jours sans boire ?", "Ton corps est fait en grande partie d'eau. Voilà ce qui se passe quand il en manque. 💧", [
        B("Combien de temps est-ce que tu peux tenir sans boire ?", "park", one(Z5, "shocked"), CLOSE, rings=True),
        B("Ton corps est composé d'environ soixante pour cent d'eau. Et tu en perds toute la journée.",
          "park", one(Z5, "neutral", tag=("60 %", "#7fc8f8")), CLOSE),
        B("Quand tu respires, quand tu transpires, quand tu vas aux toilettes : tu perds de l'eau en permanence.",
          "beach", one(Z5, "annoyed"), CLOSE),
        B("Il suffit d'en perdre un peu, environ deux pour cent, pour que ta concentration et ton énergie baissent.",
          "waiting", seated(Z5, "sad", tag=("- 2 %", "#ffd166")), (900, 1000, 1.4), mid_cta=True),
        B("La soif arrive souvent après le début du manque. C'est pour ça qu'il vaut mieux boire régulièrement.",
          "cafe", seated(Z5, "neutral"), (900, 1000, 1.4)),
        B("Sans boire du tout, la plupart des gens ne tiennent que quelques jours. On parle souvent de trois jours environ.",
          "beach", one(Z5, "shocked", tag=("3 JOURS", "#ff4757")), CLOSE, dark=0.3),
        B("Ça dépend de la chaleur, de l'effort et de chaque personne. Par forte chaleur, c'est beaucoup moins.",
          "beach", one(Z5, "sad"), CLOSE, dark=0.3),
        B("Bonne nouvelle : une partie de l'eau vient aussi de ce que tu manges, comme les fruits et les légumes.",
          "supermarket", one(Z5, "smile"), CLOSE),
        B("Abonne-toi, et va boire un verre d'eau.", "park", one(Z5, "smile"), CLOSE, cta=True),
    ]),

    story("05-baillement", "Pourquoi le bâillement est contagieux", Z9,
          "Tu vas bâiller en regardant ça", "Essaie de ne pas bâiller avant la fin. 🥱", [
        B("Pourquoi est-ce que tu bâilles quand quelqu'un d'autre bâille ?", "park", one(Z9, "shocked"), CLOSE,
          rings=True),
        B("Le bâillement est un réflexe : tu ouvres grand la bouche, tu inspires profondément, puis tu expires.",
          "park", one(Z9, "neutral"), CLOSE),
        B("Une idée étudiée par les scientifiques : il aiderait à rafraîchir un peu ton cerveau.",
          "park", one(Z9, "smile"), CLOSE),
        B("Mais le plus étrange, c'est qu'il est contagieux. Voir, entendre, ou même lire le mot bâiller peut suffire.",
          "bus", seated(Z9, "shocked"), (900, 1000, 1.4), mid_cta=True),
        B("On bâille plus facilement avec les gens dont on est proche : ta famille, tes amis.",
          "restaurant", duo(Z9, "smile", HOMME2, "smile"), WIDE),
        B("Certains chiens bâillent même en voyant leur maître bâiller.",
          "park", one(Z9, "shocked"), CLOSE),
        B("Et avant de naître, dans le ventre de ta mère, tu bâillais déjà.",
          "waiting", duo(MERE, "smile", Z9, "smile"), WIDE),
        B("Alors, sois honnête : est-ce que tu as bâillé pendant cette vidéo ?",
          "park", one(Z9, "smug"), TIGHT),
        B("Dis-le en commentaire, et abonne-toi.", "park", one(Z9, "smile"), CLOSE, cta=True),
    ]),
]
