# -*- coding: utf-8 -*-
"""Série 3 « Et si tu… » : 10 nouvelles histoires courtes (hook en 1re image, CTA au milieu et à la fin)."""
from story import B
from histoires import FEMME, FEMME2, HOMME, HOMME2, PATRON, SERVEUR, CONTROLEUR, MERE, NOIR
from sketches import P, SKIN


def hero(skin, hair, top, **kw):
    return P(skin=skin, hair=hair, top=top, bottom=kw.pop("bottom", ("pants", "#264653")),
             shoes=kw.pop("shoes", "#ffffff"), **kw)


Z1 = hero(SKIN[2], ("short", "#1c1412"), ("hoodie", "#e63946", "#c92f3b"))
Z2 = hero(SKIN[0], ("curly", "#c26a2b"), ("hoodie", "#118ab2", "#0e7596"), freckles=True)
Z3 = hero(SKIN[3], ("buzz", "#1c1412"), ("tshirt", "#ffd166"))
Z4 = hero(SKIN[1], ("sidepart", "#3a2a1f"), ("cardigan", "#6a994e", "#f2e8cf"))
Z5 = hero(SKIN[4], ("curly", "#1c1412"), ("polo", "#ef476f"), beard="#1c1412")
Z6 = hero(SKIN[5], ("short", "#1c1412"), ("hoodie", "#9d4edd", "#8338c9"))
Z7 = hero(SKIN[0], ("spiky", "#e8c15a"), ("hoodie", "#f77f00", "#d96f00"))
Z8 = hero(SKIN[2], ("sidepart", "#1c1412"), ("blazer", "#264653", "#ffffff"), shoes="#1b1b1b")
Z9 = hero(SKIN[1], ("ponytail", "#8a4b2a"), ("hoodie", "#06d6a0", "#05b588"))
Z10 = hero(SKIN[3], ("spiky", "#2b211c"), ("hoodie", "#3a86ff", "#2f6fd6"))

CLOSE = (540, 1000, 1.35)
WIDE = (540, 1000, 1.1)
TIGHT = (540, 980, 1.7)


def one(h, expr, look="CAM", x=540, **kw):
    return [(h, x, dict(expr=expr, look=look, **kw))]


def seated(h, expr, look="CAM", **kw):
    return [(h, 932, dict(seated=True, expr=expr, look=look, **kw))]


def duo(h, e1, other, e2, x1=330, x2=760, **kw):
    return [(h, x1, dict(expr=e1, look=(1, 0), **kw)), (other, x2, dict(expr=e2, look=(-1, 0)))]


def story(slug, title, hero_, hook, caption, beats):
    return dict(slug="z" + slug, title=title, hero=hero_, beats=beats, hook_text=hook, caption_y=1330,
                out="videos-et-si", caption=caption,
                hashtags=["#etsi", "#histoire", "#storytime", "#animation", "#pourtoi", "#fyp"])


STORIES = [
    story("01-compte-a-rebours", "Et si tu voyais un compte à rebours au-dessus des gens ?", Z1,
          "Un chiffre sur chaque tête", "Un chiffre flotte au-dessus de chaque personne… et le tien est le plus petit.", [
        B("Et si un matin, tu voyais un chiffre au-dessus de la tête de chaque personne ?", "park",
          one(Z1, "shocked", tag=("42", "#ffd166")), CLOSE, rings=True),
        B("Ta voisine : quatre-vingt-quatre. Le boulanger : soixante-sept. Un enfant : quatre-vingt-dix-neuf.", "park",
          duo(Z1, "shocked", FEMME, "smile", tag=("84", "#25d366")), WIDE),
        B("Tu comprends vite : ce sont des jours. Des jours avant que quelque chose leur arrive.", "bus",
          seated(Z1, "shocked"), (900, 1000, 1.4), dark=0.3, mid_cta=True),
        B("Alors tu préviens ton ami qui est à zéro : ne prends pas la voiture aujourd'hui.", "cafe",
          duo(Z1, "angry", HOMME2, "neutral", tag=("0", "#ff4757")), WIDE),
        B("Il rit. Mais il reste chez lui. Et le soir, un camion traverse sa rue.", "park",
          one(HOMME2, "shocked"), CLOSE, dark=0.4, silence=True),
        B("Tu sauves des gens. Un par un. Le chiffre de chacun remonte.", "restaurant",
          duo(Z1, "smile", SERVEUR, "smile", tag=("+30", "#25d366")), WIDE),
        B("Mais en te regardant dans le miroir du café, tu vois ton propre chiffre.", "cafe",
          one(Z1, "shocked", tag=("1", "#ff4757")), TIGHT, dark=0.5, red=True, inner="Il reste un jour."),
        B("Et le plus étrange… c'est que ce chiffre n'a jamais bougé depuis ta naissance.", "cafe",
          one(Z1, "shocked"), TIGHT, dark=0.55),
        B("Abonne-toi pour la partie deux.", "cafe", one(Z1, "shocked"), CLOSE, dark=0.5, cta=True),
    ]),

    story("02-pensees-chat", "Et si tu entendais les pensées de ton chat ?", Z2,
          "Ton chat pense à ça", "Ton chat te juge… et il a un secret.", [
        B("Et si tu pouvais entendre les pensées de ton chat ? Rien que les siennes.", "park",
          one(Z2, "smile", pose="gesture"), CLOSE, rings=True),
        B("Il te regarde avec ses grands yeux. Tu entends : encore lui. Il est en retard avec les croquettes.", "waiting",
          seated(Z2, "shocked", bubble="Les croquettes !"), (900, 1000, 1.4)),
        B("Tu lui fais un câlin. Il pense : je te tolère. Trois secondes. Pas plus.", "park",
          one(Z2, "smile", bubble="Trois secondes."), CLOSE),
        B("Tu l'appelles. Il pense : je sais très bien que tu m'appelles. Je fais semblant de dormir.", "waiting",
          seated(Z2, "annoyed"), (900, 1000, 1.4), mid_cta=True),
        B("Tu te dis qu'il est un peu ingrat. Puis un soir tu l'entends penser autre chose.", "waiting",
          seated(Z2, "neutral"), (900, 1000, 1.4), dark=0.3, silence=True),
        B("Il pense : ne dors pas ce soir. Il y a quelqu'un dans la cuisine.", "waiting",
          seated(Z2, "shocked"), (900, 1000, 1.45), dark=0.5, red=True, inner="Quelqu'un dans la cuisine."),
        B("Tu te lèves en silence. Tu allumes la lumière. Et là, tu vois ton colocataire.", "cafe",
          duo(Z2, "shocked", HOMME, "shocked"), WIDE, dark=0.3),
        B("Il tient ton chat dans les bras. Et il dit : désolé, il est tellement mignon que je ne résiste pas.", "cafe",
          one(HOMME, "smile"), CLOSE),
        B("Abonne-toi pour la partie deux.", "cafe", one(Z2, "smile"), CLOSE, cta=True),
    ]),

    story("03-sous-titres", "Et si tout ce que tu pensais s'affichait en sous-titres ?", Z3,
          "Tes pensées en sous-titres", "Imagine : tes pensées s'affichent au-dessus de ta tête.", [
        B("Et si tout ce que tu pensais s'affichait en sous-titres au-dessus de ta tête ?", "park",
          one(Z3, "shocked", bubble="Oh non."), CLOSE, rings=True),
        B("Au travail, ton patron te parle. Et on lit : il a mauvaise haleine.", "waiting",
          duo(Z3, "shocked", PATRON, "angry", bubble="Quelle haleine !"), WIDE),
        B("Tu rencontres la meilleure amie de ta copine. Et on lit : elle est super jolie.", "cafe",
          duo(Z3, "shocked", FEMME, "shocked", bubble="Elle est jolie."), WIDE),
        B("Ta copine arrive derrière toi. Elle lit aussi. Tu essaies de penser à autre chose.", "cafe",
          duo(Z3, "shocked", FEMME2, "angry", bubble="Je pense à rien."), WIDE, mid_cta=True),
        B("Tu fais le vide dans ta tête. Alors s'affiche : j'ai faim. J'ai faim. J'ai faim.", "restaurant",
          seated(Z3, "sad", bubble="J'ai faim."), (900, 1000, 1.4)),
        B("Au bout d'une semaine, tu apprends à penser uniquement des choses gentilles.", "park",
          one(Z3, "smile", bubble="Quelle belle journée."), CLOSE),
        B("Tout le monde t'adore. Tu es promu. Tu te maries. Tout est parfait.", "restaurant",
          duo(Z3, "smile", FEMME2, "smile"), WIDE),
        B("Mais le jour de ton mariage, devant tout le monde, s'affiche une dernière pensée.", "park",
          one(Z3, "shocked", bubble="Je ne l'aime plus."), TIGHT, dark=0.5, red=True, inner="Je ne l'aime plus."),
        B("Abonne-toi pour la partie deux.", "park", one(Z3, "shocked"), CLOSE, dark=0.45, cta=True),
    ]),

    story("04-passe-objets", "Et si tu voyais le passé de chaque objet que tu touches ?", Z4,
          "Il touche un objet et voit tout", "Chaque objet te raconte son histoire… jusqu'à celui-là.", [
        B("Et si tu voyais le passé de chaque objet que tu touches ? Juste avec la main.", "park",
          one(Z4, "shocked", pose="gesture"), CLOSE, rings=True),
        B("Tu touches un banc. Tu vois deux amoureux qui se disent oui, il y a cinquante ans.", "park",
          one(Z4, "smile", look=(1, 0)), CLOSE, rewind=True),
        B("Tu touches la voiture d'occasion. Tu vois un accident. Tu ne l'achètes pas.", "park",
          duo(Z4, "shocked", HOMME, "neutral"), WIDE, rewind=True, mid_cta=True),
        B("Tu touches la montre de ton grand-père. Tu le vois, jeune, qui rit sur une plage.", "waiting",
          seated(Z4, "smile"), (900, 1000, 1.4), rewind=True),
        B("Tu deviens détective. Tu retrouves des clés, des bijoux, des disparus.", "cafe",
          duo(Z4, "smug", CONTROLEUR, "smile"), WIDE),
        B("Puis un jour, tu emménages dans un nouvel appartement. Tu poses la main sur un mur.", "waiting",
          one(Z4, "neutral", look=(1, 0)), CLOSE, dark=0.3),
        B("Et tu vois la même scène, encore et encore : un homme qui regarde à travers ta fenêtre.", "waiting",
          one(Z4, "shocked"), TIGHT, dark=0.5, red=True, inner="Il regarde par la fenêtre."),
        B("Tu te retournes. La fenêtre est ouverte. Et la poignée est encore chaude.", "waiting",
          one(Z4, "shocked"), TIGHT, dark=0.6, silence=True),
        B("Abonne-toi pour la partie deux.", "waiting", one(Z4, "shocked"), CLOSE, dark=0.5, cta=True),
    ]),

    story("05-sourire", "Et si tu gagnais un euro à chaque sourire ?", Z5,
          "Un sourire = un euro", "Chaque sourire te rapporte de l'argent… mais lequel est sincère ?", [
        B("Et si tu gagnais un euro à chaque fois que tu souris ? Un vrai sourire.", "park",
          one(Z5, "smile", tag=("+1 €", "#25d366")), CLOSE, rings=True),
        B("Le premier jour, tu souris à ton café. Plus un euro. À ton chien. Plus un euro.", "cafe",
          seated(Z5, "smile", tag=("+2 €", "#25d366")), (900, 1000, 1.4)),
        B("Tu souris aux inconnus. Dans le bus, la rue, au supermarché. Tu gagnes quarante euros.", "supermarket",
          one(Z5, "smile", tag=("+40 €", "#25d366")), CLOSE),
        B("Mais tu vois bien que les faux sourires ne comptent pas. Il faut être heureux pour de vrai.", "bus",
          seated(Z5, "annoyed"), (900, 1000, 1.4), mid_cta=True),
        B("Alors tu changes ta vie. Tu rends service. Tu appelles tes amis. Tu fais rire des gens.", "park",
          duo(Z5, "smile", FEMME, "smile", tag=("+80 €", "#25d366")), WIDE),
        B("En un mois, tu gagnes mille euros. Mais surtout, tu te sens vraiment bien.", "park",
          one(Z5, "smile"), CLOSE),
        B("Alors un jour, tu oublies de regarder ton compteur. Tu souris juste comme ça.", "park",
          one(Z5, "smile", look=(0, -0.3)), CLOSE),
        B("Et là, une notification : plus un million d'euros. Un vrai sourire n'a pas de prix.", "park",
          one(Z5, "shocked", tag=("+1 000 000 €", "#25d366")), TIGHT),
        B("Abonne-toi si tu veux la suite.", "park", one(Z5, "smile"), CLOSE, cta=True),
    ]),

    story("06-ombre", "Et si ton ombre arrivait en retard ?", Z6,
          "Ton ombre est en retard", "Ton ombre a une seconde de retard… et ça change tout.", [
        B("Et si ton ombre arrivait toujours une seconde en retard ?", "park",
          one(Z6, "shocked", ghost=True), CLOSE, rings=True),
        B("Tu lèves la main. Ton ombre la lève après toi. Tu cligne des yeux. Elle aussi, juste après.", "park",
          one(Z6, "shocked", pose="gesture", ghost=True), CLOSE),
        B("Au début, tu rigoles. Personne d'autre ne remarque rien. Tu dis que c'est un jeu de lumière.", "bus",
          seated(Z6, "smile"), (900, 1000, 1.4)),
        B("Mais chaque jour, le retard grandit. Deux secondes. Cinq secondes. Dix secondes.", "waiting",
          seated(Z6, "annoyed", ghost=True), (900, 1000, 1.4), dark=0.3, mid_cta=True),
        B("Un soir, tu t'arrêtes net au milieu d'un couloir. Ton ombre, elle, continue de marcher.", "waiting",
          one(Z6, "shocked"), CLOSE, dark=0.45, silence=True),
        B("Elle ouvre une porte que tu n'as jamais vue. Tu n'oses pas la suivre.", "waiting",
          one(Z6, "shocked", look=(1, 0)), CLOSE, dark=0.5),
        B("Elle revient une heure plus tard. Elle te fait un petit signe de la main. Et elle sourit.", "waiting",
          one(Z6, "shocked"), TIGHT, dark=0.55, red=True, inner="Elle sourit."),
        B("Parce que toi, tu ne souriais pas.", "waiting", one(Z6, "shocked"), TIGHT, dark=0.6, silence=True),
        B("Abonne-toi pour la partie deux.", "waiting", one(Z6, "shocked"), CLOSE, dark=0.5, cta=True),
    ]),

    story("07-teleportation", "Et si tu pouvais te téléporter, mais seulement là où tu es déjà allé ?", Z7,
          "Téléportation : un seul piège", "Tu peux te téléporter partout où tu es déjà allé. Sauf un endroit.", [
        B("Et si tu pouvais te téléporter, mais seulement là où tu es déjà allé ?", "park",
          one(Z7, "smug", pose="gesture"), CLOSE, rings=True),
        B("Tu pars à la plage en une seconde. Le soleil, la mer, et personne autour de toi.", "beach",
          one(Z7, "smile"), CLOSE),
        B("Tu déjeunes en Italie, tu goûtes une pizza, et tu rentres avant que ton café ne refroidisse.", "restaurant",
          seated(Z7, "smile"), (900, 1000, 1.4)),
        B("Tu manques ton bus ? Tu te téléportes au travail. Tu es toujours à l'heure. Plus jamais en retard.", "bus",
          seated(Z7, "smug"), (900, 1000, 1.4), mid_cta=True),
        B("Mais un soir, tu penses à ta maison d'enfance, celle que tu avais quittée à sept ans.", "park",
          one(Z7, "sad", look=(0, 0.5)), CLOSE, dark=0.3),
        B("Tu te téléportes. Tu apparais dans le salon. Tout est exactement comme avant.", "waiting",
          one(Z7, "shocked"), CLOSE, dark=0.35),
        B("La table est mise pour quatre. Il y a encore du café chaud sur la table.", "waiting",
          one(Z7, "shocked"), TIGHT, dark=0.5, silence=True),
        B("Et une voix dit, depuis la cuisine : tu es en retard, ton repas va refroidir.", "waiting",
          one(Z7, "shocked"), TIGHT, dark=0.6, red=True, inner="Tu es en retard."),
        B("Abonne-toi pour la partie deux.", "waiting", one(Z7, "shocked"), CLOSE, dark=0.5, cta=True),
    ]),

    story("08-recommencer", "Et si tu pouvais recommencer ta vie à dix ans ?", Z8,
          "Recommencer à 10 ans ?", "On t'offre de tout recommencer. Mais il y a une condition.", [
        B("Et si un inconnu te proposait de recommencer ta vie à dix ans ? Avec tout ce que tu sais.", "park",
          duo(Z8, "shocked", NOIR, "smile"), WIDE, rings=True),
        B("Tu acceptes tout de suite. Tu redeviens un enfant. Dans ta chambre, avec tes jouets.", "park",
          one(Z8, "smile", look=(0, 0.3)), CLOSE),
        B("Tu travailles dur à l'école. Tu apprends les langues. Tu investis tes économies dans les bonnes idées.", "waiting",
          seated(Z8, "smug"), (900, 1000, 1.4)),
        B("À vingt ans, tu es riche. À trente ans, tu es célèbre. Tout le monde t'envie.", "restaurant",
          duo(Z8, "smug", HOMME, "smile"), WIDE, mid_cta=True),
        B("Mais ton meilleur ami d'enfance ne te parle plus. Tu l'as oublié en chemin.", "park",
          one(Z8, "sad"), CLOSE, dark=0.3),
        B("Tu retrouves l'inconnu et tu lui dis : je veux revenir en arrière. Je préférais avant.", "park",
          duo(Z8, "sad", NOIR, "smile"), WIDE, dark=0.35),
        B("Il sourit et il te dit : je sais. C'est pour ça que j'ai proposé.", "park",
          one(NOIR, "smug"), TIGHT, dark=0.45),
        B("Parce que tout le monde accepte. Et personne, jamais, ne choisit de le refaire une deuxième fois.", "park",
          one(NOIR, "smug"), TIGHT, dark=0.55, red=True, inner="Personne ne choisit deux fois."),
        B("Abonne-toi pour la partie deux.", "park", one(Z8, "sad"), CLOSE, dark=0.5, cta=True),
    ]),

    story("09-batterie", "Et si tu voyais la batterie sociale des gens ?", Z9,
          "Une batterie au-dessus des gens", "Chaque personne a une batterie… et la tienne clignote.", [
        B("Et si tu voyais une batterie au-dessus de chaque personne ? Sa batterie sociale.", "park",
          one(Z9, "shocked", tag=("73 %", "#25d366")), CLOSE, rings=True),
        B("Ton collègue qui parle trop : cent pour cent. Ton ami timide : deux pour cent.", "waiting",
          duo(Z9, "shocked", HOMME2, "smile", tag=("2 %", "#ff4757")), WIDE),
        B("Tu comprends enfin pourquoi il ne répond jamais. Tu arrêtes de lui en vouloir.", "cafe",
          duo(Z9, "smile", Z3, "sad", tag=("2 %", "#ff4757")), WIDE),
        B("Au lieu de l'inviter à une grosse soirée, tu lui proposes une marche tranquille.", "park",
          duo(Z9, "smile", Z3, "smile", tag=("12 %", "#ffd166")), WIDE, mid_cta=True),
        B("Sa batterie remonte. Doucement. Cinquante pour cent. Il te sourit pour la première fois.", "park",
          duo(Z9, "smile", Z3, "smile", tag=("50 %", "#25d366")), WIDE),
        B("Tu fais ça avec tout le monde. Tu apprends à écouter. Tu recharges les gens autour de toi.", "restaurant",
          duo(Z9, "smile", FEMME, "smile"), WIDE),
        B("Mais un soir, ton meilleur ami te dit : ça va ? Tu sembles fatigué.", "cafe",
          duo(Z9, "sad", Z3, "neutral"), WIDE, dark=0.3),
        B("Tu regardes ta batterie dans la vitre. Un pour cent. Tu n'avais pas vu.", "cafe",
          one(Z9, "shocked", tag=("1 %", "#ff4757")), TIGHT, dark=0.5, red=True, inner="Un pour cent."),
        B("Abonne-toi, ça fait toujours du bien.", "cafe", one(Z9, "smile"), CLOSE, cta=True),
    ]),

    story("10-verite", "Et si tout le monde te disait la vérité pendant 24 heures ?", Z10,
          "24 h sans aucun mensonge", "Pendant 24 heures, tout le monde te dit la vérité. Résultat…", [
        B("Et si pendant vingt-quatre heures, absolument tout le monde te disait la vérité ?", "park",
          one(Z10, "shocked"), CLOSE, rings=True),
        B("Le matin, ton boulanger te dit : ta coupe de cheveux est ratée. Mais le pain est gratuit.", "supermarket",
          duo(Z10, "shocked", SERVEUR, "neutral"), WIDE),
        B("Ton patron avoue : ton projet est excellent. Je préfère garder la promotion pour moi.", "waiting",
          duo(Z10, "shocked", PATRON, "smug"), WIDE),
        B("Ta mère t'explique, sans rire : ton cadeau de Noël, je l'ai déjà revendu.", "cafe",
          duo(Z10, "shocked", MERE, "neutral"), WIDE, mid_cta=True),
        B("Tu rentres, épuisé. Mais tu apprends enfin des choses utiles sur tes amis.", "park",
          duo(Z10, "smile", HOMME, "smile"), WIDE),
        B("Le soir, tu retrouves ton meilleur ami. Tu lui demandes : tu es vraiment mon ami ?", "restaurant",
          duo(Z10, "neutral", HOMME2, "neutral"), WIDE, dark=0.3),
        B("Il réfléchit longuement. Puis il te dit : oui. Depuis toujours. Et je n'ai jamais menti.", "restaurant",
          one(HOMME2, "smile"), CLOSE),
        B("Tu pleures de joie. Et il ajoute : sauf une fois. Mais ça, je te le dirai demain.", "restaurant",
          one(HOMME2, "smug"), TIGHT, dark=0.45, red=True, inner="Sauf une fois."),
        B("Abonne-toi pour la partie deux.", "restaurant", one(Z10, "shocked"), CLOSE, dark=0.4, cta=True),
    ]),
]
