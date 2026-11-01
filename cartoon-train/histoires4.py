# -*- coding: utf-8 -*-
"""Série 4 « Et si tu… » : 10 histoires courtes (~25 s), le format qui fait le plus de vues sur la chaîne.
Doublées par Léo (ElevenLabs) : l'audio de chaque phrase est déjà découpé dans build/story-h/<slug>/NN.wav."""
from story import B
from histoires import FEMME, FEMME2, HOMME, HOMME2, PATRON, MERE, NOIR
from histoires3 import Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8, Z9, Z10, CLOSE, WIDE, TIGHT, one, seated, duo

END = "Abonne-toi pour la partie deux."


def story(slug, title, hero_, hook, caption, beats):
    return dict(slug="y4-" + slug, title=title, hero=hero_, beats=beats, hook_text=hook, caption_y=1330,
                out="videos-et-si-leo", caption=caption,
                hashtags=["#etsi", "#histoire", "#storytime", "#animation", "#pourtoi", "#fyp"])


def end(h, scene, **kw):
    return B(END, scene, one(h, "shocked"), CLOSE, cta=True, **kw)


STORIES = [
    story("01-brouillons", "Et si tu pouvais lire les messages que les gens n'ont jamais envoyés ?", Z1,
          "Les messages jamais envoyés", "Tous les messages qu'on t'a écrits… puis effacés. 😳", [
        B("Et si tu pouvais lire les messages que les gens ont écrits… puis effacés ?", "park",
          one(Z1, "shocked"), CLOSE, rings=True),
        B("Ton meilleur ami : « Je suis jaloux de toi. » Effacé.", "cafe",
          duo(Z1, "shocked", HOMME2, "smile", bubble="Je suis jaloux…"), WIDE),
        B("Ta mère : « Je suis tellement fière de toi. » Effacé, trois cents fois.", "waiting",
          duo(Z1, "sad", MERE, "smile"), WIDE, mid_cta=True),
        B("Et la personne que tu aimes en secret : « Tu veux sortir avec moi ? » Effacé hier soir.", "bus",
          seated(Z1, "shocked", tag=("EFFACÉ", "#ff4757")), (900, 1000, 1.4)),
        B("Alors tu lui écris enfin. Et là, tu vois son brouillon apparaître en direct.", "park",
          one(Z1, "smile", bubble="Oui !!!"), CLOSE),
        B("Mais juste en dessous, il y a un autre brouillon. Signé avec ton prénom. Que tu n'as jamais écrit.",
          "park", one(Z1, "shocked"), TIGHT, dark=0.5, red=True),
        end(Z1, "park", dark=0.4),
    ]),

    story("02-meme-journee", "Et si tu revivais la même journée en boucle ?", Z2,
          "Le même lundi. Pour toujours.", "Tu te réveilles… et c'est encore lundi. 🔁", [
        B("Et si tu te réveillais chaque matin… le même lundi ?", "burst", one(Z2, "shocked"), CLOSE, rings=True),
        B("Le premier jour, tu paniques. Le dixième, tu connais toutes les réponses du contrôle.", "waiting",
          one(Z2, "smug", tag=("20/20", "#25d366")), CLOSE),
        B("Le centième, tu sais exactement quoi dire pour faire rire tout le monde.", "cafe",
          duo(Z2, "smug", FEMME, "smile"), WIDE, mid_cta=True),
        B("Mais un jour, quelqu'un fait quelque chose de différent. Ton voisin de bus te regarde et sourit.", "bus",
          duo(Z2, "shocked", NOIR, "smug"), WIDE),
        B("Il te dit : « Toi aussi, tu en es à combien de lundis ? »", "bus",
          one(NOIR, "smug", bubble="Moi, 4 000."), CLOSE, dark=0.3),
        B("Et il ajoute : « Ne fais surtout pas la même chose que moi au jour mille. »", "bus",
          one(Z2, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z2, "bus", dark=0.45),
    ]),

    story("03-toi-a-80-ans", "Et si tu pouvais appeler toi-même à 80 ans ?", Z3,
          "Un appel de toi… à 80 ans", "Ton toi du futur t'appelle. Il a un seul conseil. 📞", [
        B("Et si ton téléphone sonnait… et que c'était toi, à quatre-vingts ans ?", "park",
          one(Z3, "shocked"), CLOSE, rings=True),
        B("Il connaît tes secrets. Ton code. Même le prénom de ton premier crush.", "park",
          one(Z3, "shocked", bubble="C'est vraiment moi ?"), CLOSE),
        B("Il te dit : « Arrête de t'inquiéter pour ce contrôle. Personne ne s'en souviendra. »", "waiting",
          one(Z3, "smile"), CLOSE, mid_cta=True),
        B("« Par contre, appelle grand-mère ce soir. Pas demain. Ce soir. »", "burstblue",
          one(Z3, "sad"), CLOSE),
        B("Tu l'appelles. Elle pleure de joie. Vous parlez deux heures.", "cafe",
          duo(Z3, "smile", MERE, "smile"), WIDE),
        B("Le lendemain, ton téléphone sonne encore. Même numéro. Mais cette fois, la voix est plus jeune que toi.",
          "park", one(Z3, "shocked"), TIGHT, dark=0.5, red=True),
        end(Z3, "park", dark=0.4),
    ]),

    story("04-quand-tu-pars", "Et si tu entendais ce qu'on dit de toi quand tu pars ?", Z4,
          "Ce qu'ils disent quand tu pars", "Tu quittes la pièce… et tu entends tout. 👂", [
        B("Et si, dès que tu quittais une pièce, tu entendais ce que les gens disent de toi ?", "cafe",
          one(Z4, "shocked"), CLOSE, rings=True),
        B("Tes collègues : « Il est sympa, mais il parle trop de son chat. »", "cafe",
          duo(Z4, "annoyed", HOMME, "smile", bubble="Encore le chat…"), WIDE),
        B("Ta prof : « C'est le seul qui écoute vraiment. »", "waiting",
          one(Z4, "smile", tag=("+1", "#25d366")), CLOSE, mid_cta=True),
        B("Ton meilleur ami ne dit rien. Il regarde juste la porte, jusqu'à ce que tu reviennes.", "park",
          one(HOMME2, "sad"), CLOSE),
        B("Alors un jour, tu fais semblant de partir, pour savoir ce qu'il pense vraiment.", "park",
          one(Z4, "smug"), CLOSE),
        B("Et tu l'entends dire, très doucement : « Je sais que tu écoutes. Moi aussi, j'entends tout. »",
          "park", one(Z4, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z4, "park", dark=0.45),
    ]),

    story("05-parents-ton-age", "Et si tes parents avaient ton âge pendant 24 heures ?", Z5,
          "Tes parents ont ton âge", "Ta mère a 15 ans… et elle est dans ta classe. 😂", [
        B("Et si un matin, tes parents se réveillaient avec exactement ton âge ?", "burst",
          one(Z5, "shocked"), CLOSE, rings=True),
        B("Ta mère arrive dans ta classe. Elle s'assoit à côté de toi. Elle te copie dessus.", "waiting",
          duo(Z5, "annoyed", FEMME2, "smug", bubble="Tu me passes la réponse ?"), WIDE),
        B("Ton père fait un skate-park. Il tombe. Il dit que c'est la faute du skate.", "park",
          one(HOMME, "angry"), CLOSE, mid_cta=True),
        B("À la cantine, ils se disputent pour savoir qui a la plus belle coiffure.", "restaurant",
          duo(FEMME2, "angry", HOMME, "angry"), WIDE),
        B("Le soir, ils te demandent la permission de sortir. Tu dis non. Ils claquent la porte.", "burst",
          one(Z5, "smug", tag=("PRIVÉS DE SORTIE", "#ffd166")), CLOSE),
        B("Et à minuit, en redevenant adultes, ta mère te regarde et dit : « Maintenant, tu sais ce que je vis. »",
          "burst", one(Z5, "shocked"), TIGHT, dark=0.3),
        end(Z5, "burst"),
    ]),

    story("06-copier-coller", "Et si tu pouvais copier-coller n'importe quel objet ?", Z6,
          "Copier. Coller. N'importe quoi.", "Tu copies un billet… puis tout dérape. 💸", [
        B("Et si tu pouvais copier-coller n'importe quel objet, juste avec deux doigts ?", "park",
          one(Z6, "shocked"), CLOSE, rings=True),
        B("Tu copies une pizza. Puis dix. Ton frigo n'a jamais été aussi rempli.", "restaurant",
          seated(Z6, "smile", tag=("x10", "#25d366")), (900, 1000, 1.4)),
        B("Tu copies un billet de vingt euros. Mais tous ont le même numéro de série.", "supermarket",
          one(Z6, "shocked", tag=("N° 1234", "#ff4757")), CLOSE, mid_cta=True),
        B("Alors tu copies des choses utiles. Des livres pour l'école. Des couvertures pour la rue.", "park",
          duo(Z6, "smile", HOMME, "smile"), WIDE),
        B("Un soir, par erreur, tu fais copier-coller… sur toi-même.", "burst", one(Z6, "shocked"), TIGHT),
        B("Il y a maintenant deux toi. Et l'autre vient de dire : « C'est moi, l'original. »", "burst",
          duo(Z6, "shocked", Z6, "smug"), WIDE, dark=0.45, red=True),
        end(Z6, "burst", dark=0.4),
    ]),

    story("07-penser-a-toi", "Et si tu voyais combien de fois on a pensé à toi aujourd'hui ?", Z7,
          "Combien de fois on a pensé à toi", "Un compteur au-dessus de chaque personne… pour toi. 💭", [
        B("Et si tu voyais, au-dessus de chaque personne, combien de fois elle a pensé à toi aujourd'hui ?",
          "park", one(Z7, "shocked"), CLOSE, rings=True),
        B("Ton meilleur ami : quarante-deux. Normal.", "cafe",
          duo(Z7, "smile", HOMME2, "smile", tag=("42", "#25d366")), WIDE),
        B("Ton ex : trois cent dix-sept. Il dit pourtant qu'il t'a oublié.", "bus",
          seated(Z7, "smug", tag=("317", "#ffd166")), (900, 1000, 1.4), mid_cta=True),
        B("Ta mère : mille. Chaque jour. Même quand tu ne réponds pas.", "waiting",
          one(MERE, "smile", tag=("1000", "#25d366")), CLOSE),
        B("Puis tu croises un inconnu dans la rue. Son compteur affiche : cent mille.", "park",
          one(PATRON, "smug", tag=("100 000", "#ff4757")), CLOSE, dark=0.3),
        B("Il te sourit, et murmure : « Ça fait vingt ans que je t'attends. »", "park",
          one(Z7, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z7, "park", dark=0.45),
    ]),

    story("08-tout-se-realise", "Et si tout ce que tu écrivais sur ton téléphone se réalisait ?", Z8,
          "Ce que tu écris se réalise", "Tu écris « pas cours demain »… et l'école disparaît. 📱", [
        B("Et si tout ce que tu écrivais sur ton téléphone se réalisait ?", "burst",
          one(Z8, "shocked"), CLOSE, rings=True),
        B("Tu écris : « J'ai trop faim. » Une pizza sonne à la porte.", "burst",
          one(Z8, "smile", tag=("PIZZA", "#ffd166")), CLOSE),
        B("Tu écris : « Pas cours demain. » Le lendemain, ton école a disparu.", "waiting",
          one(Z8, "shocked"), CLOSE, mid_cta=True),
        B("Tu réalises que l'autocorrection modifie tes vœux. « Je suis riche » devient « je suis riche en fibres ».",
          "burstblue", one(Z8, "annoyed"), CLOSE),
        B("Alors tu écris très lentement : « Je veux que tout redevienne normal. »", "burst",
          one(Z8, "sad"), CLOSE),
        B("Et ton téléphone te répond tout seul : « Non. Maintenant, c'est moi qui écris. »", "burst",
          one(Z8, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z8, "burst", dark=0.45),
    ]),

    story("09-pouvoir-honte", "Et si tu gagnais un super-pouvoir à chaque fois que tu as honte ?", Z9,
          "Un pouvoir à chaque honte", "Plus tu as honte… plus tu deviens puissant. 😳", [
        B("Et si tu gagnais un super-pouvoir chaque fois que tu as honte ?", "burst",
          one(Z9, "shocked"), CLOSE, rings=True),
        B("Tu dis « bon appétit » au serveur. Tu peux maintenant voler.", "restaurant",
          seated(Z9, "shocked", tag=("VOL", "#25d366")), (900, 1000, 1.4)),
        B("Tu fais coucou à quelqu'un qui saluait la personne derrière toi. Tu deviens invisible.", "park",
          one(Z9, "sad", tag=("INVISIBLE", "#25d366")), CLOSE, mid_cta=True),
        B("Tu appelles ta prof « maman ». Super-force.", "waiting",
          one(Z9, "shocked", tag=("FORCE", "#25d366")), CLOSE),
        B("Bientôt, tu es le héros le plus puissant du monde. Et la personne la plus gênée de l'univers.", "burst",
          one(Z9, "smug"), CLOSE),
        B("Mais un jour, tu ne ressens plus aucune honte. Et un par un, tous tes pouvoirs s'éteignent.", "burst",
          one(Z9, "shocked"), TIGHT, dark=0.5),
        end(Z9, "burst", dark=0.4),
    ]),

    story("10-reponses-controles", "Et si tu connaissais les réponses de tous les contrôles ?", Z10,
          "Toutes les réponses. Toujours.", "Tu connais toutes les réponses… sauf une. 📝", [
        B("Et si, à chaque contrôle, les réponses apparaissaient devant tes yeux ?", "waiting",
          one(Z10, "shocked"), CLOSE, rings=True),
        B("Maths : vingt sur vingt. Histoire : vingt sur vingt. Même en sport, tu as vingt.", "waiting",
          one(Z10, "smug", tag=("20/20", "#25d366")), CLOSE),
        B("Tes parents sont fiers. Tes profs pensent que tu es un génie.", "burst",
          duo(Z10, "smug", MERE, "smile"), WIDE, mid_cta=True),
        B("Mais un jour, au contrôle de maths, une question n'a pas de réponse.", "waiting",
          one(Z10, "shocked", tag=("???", "#ff4757")), CLOSE, dark=0.3),
        B("Elle dit : « Qui te donne les réponses depuis le début ? »", "waiting",
          one(Z10, "shocked"), TIGHT, dark=0.45),
        B("Et sous la question, pour la première fois, les réponses s'écrivent toutes seules… avec ton écriture.",
          "waiting", one(Z10, "shocked"), TIGHT, dark=0.55, red=True),
        end(Z10, "waiting", dark=0.45),
    ]),
]
