# -*- coding: utf-8 -*-
"""Série « galère » saison 2 : MÊME héros dans chaque vidéo, même titre en 3 lignes, mêmes couleurs,
sujets d'identité qui donnent envie de taguer quelqu'un. Appel à s'abonner au milieu et à la fin."""
import copy

from story import B
from galere import POTE, POTE2, FILLE, MERE, PERE, CHEF, GRAND
from sketches import P, SKIN

# Le héros de la série : toujours le même look (cheveux noirs en pics, sweat jaune, baskets blanches).
HERO = P(skin=SKIN[2], hair=("spiky", "#1c1412"), top=("hoodie", "#ffbe0b", "#e0a800"), bottom=("pants", "#264653"),
         shoes="#ffffff")


H = "H"


def variant(**kw):
    h = copy.deepcopy(HERO)
    h.update(kw)
    return h


def p(slug, subject, beats, line2="D'ÊTRE", hero=None):
    hero = hero or HERO
    if not beats[0]["cast"]:  # la 1re image sert de couverture : le héros y est toujours
        beats[0]["cast"] = [(H, 540, dict(expr="annoyed", look="CAM"))]
    for b in beats:
        b["cast"] = [(hero if c[0] == "H" else c[0], c[1], c[2]) for c in b["cast"]]
    return dict(slug="p" + slug, title="Pourquoi c'est la galère %s %s" % (line2.lower(), subject.lower()),
                hero=hero, beats=beats, header=("POURQUOI C'EST LA GALÈRE", line2, subject), out="videos-galere2",
                caption="Pourquoi c'est la galère %s %s 😩 Tague quelqu'un qui est concerné 👇" % (
                    line2.lower(), subject.lower()),
                hashtags=["#galere", "#pourquoi", "#humour", "#animation", "#relatable", "#pourtoi", "#fyp"])


END = "Abonne-toi pour la prochaine galère, et tague quelqu'un qui est concerné."

STORIES = [
    p("01-grand", "GRAND", [
        B("Pourquoi c'est la galère d'être grand ?", "burst", [], (540, 1000, 1.0)),
        B("Dans chaque maison, tu te prends le haut des portes. Tu as une bosse en permanence.", "burstblue",
          [(H, 540, dict(expr="sad", look=(0, -0.6), tag=("BOUM", "#ff4757")))], (540, 1000, 1.3)),
        B("Au cinéma, la personne derrière toi soupire pendant tout le film.", "cinema",
          [(H, 932, dict(seated=True, expr="annoyed", look="CAM", bubble="Je vois rien !"))], (900, 1000, 1.4)),
        B("Dans l'avion, tes genoux touchent le siège de devant avant même le décollage.", "plane",
          [(H, 932, dict(seated=True, expr="sad", look=(0, 0.6)))], (900, 1000, 1.4), mid_cta=True),
        B("Et tout le monde te pose la même question.", "burstyellow",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (POTE, 760, dict(expr="smile", look=(-1, -0.3), bubble="Tu fais du basket ?"))], (540, 1000, 1.1)),
        B("Les pantalons sont toujours trop courts. Tu as l'air prêt pour une inondation.", "burst",
          [(H, 540, dict(expr="sad", look=(0, 0.6), tag=("TROP COURT", "#ffd166")))], (540, 1000, 1.3)),
        B("Et sur les photos de groupe, on te met au fond. Tout au fond.", "burstblue",
          [(H, 540, dict(expr="annoyed", look="CAM"))], (540, 1000, 1.3)),
        B("Mais au supermarché, c'est toi qu'on appelle pour attraper l'étagère du haut.", "supermarket",
          [(H, 540, dict(expr="smug", look="CAM", pose="up", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.25)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ], hero=variant(R=122)),

    p("02-roux", "ROUX", [
        B("Pourquoi c'est la galère d'être roux ?", "burst", [], (540, 1000, 1.0)),
        B("Dix minutes au soleil, et tu deviens rouge homard.", "beach",
          [(H, 540, dict(expr="sad", look="CAM", tag=("COUP DE SOLEIL", "#ff4757")))], (540, 1000, 1.3)),
        B("La crème solaire indice cinquante devient ta meilleure amie, même en hiver.", "burstyellow",
          [(H, 540, dict(expr="annoyed", look=(0, 0.5)))], (540, 1000, 1.3)),
        B("Tout le monde a un surnom pour toi. Poil de carotte, Ron, le feu.", "burst",
          [(H, 540, dict(expr="annoyed", look="CAM"))], (540, 1000, 1.25),
          crowd=["Poil de carotte !", "Ron !", "Allumette !"], mid_cta=True),
        B("Des inconnus viennent te dire que tes cheveux sont magnifiques, puis te demandent si c'est naturel.", "park",
          [(H, 330, dict(expr="neutral", look=(1, 0))),
           (FILLE, 760, dict(expr="smile", look=(-1, 0), bubble="C'est une teinture ?"))], (540, 1000, 1.1)),
        B("Tu ne passes jamais inaperçu. Même pour sécher les cours.", "burstblue",
          [(H, 540, dict(expr="sad", look="CAM", tag=("REPÉRÉ", "#ffd166")))], (540, 1000, 1.3)),
        B("Et dans chaque film, le personnage roux est soit le méchant, soit le meilleur ami du héros.", "cinema",
          [(H, 932, dict(seated=True, expr="annoyed", look="CAM"))], (900, 1000, 1.4)),
        B("Mais tu es rare. Moins de deux pour cent des gens dans le monde sont roux.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("RARE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ], hero=variant(hair=("spiky", "#c26a2b"), freckles=True, skin=SKIN[0])),

    p("03-lunettes", "DES LUNETTES", [
        B("Pourquoi c'est la galère d'avoir des lunettes ?", "burst", [], (540, 1000, 1.0)),
        B("Tu rentres dans un endroit chaud, et tes verres deviennent tout blancs.", "cafe",
          [(H, 540, dict(expr="shocked", look="CAM", tag=("BUÉE", "#7fc8f8")))], (540, 1000, 1.3)),
        B("Sous la pluie, c'est comme regarder à travers un pare-brise sans essuie-glaces.", "burstblue",
          [(H, 540, dict(expr="sad", look="CAM"))], (540, 1000, 1.3)),
        B("Tu cherches tes lunettes partout pendant dix minutes. Elles sont sur ta tête.", "waiting",
          [(H, 540, dict(expr="annoyed", look=(0, -0.6), bubble="Elles sont où ?!"))], (540, 1000, 1.3),
          mid_cta=True),
        B("Et quelqu'un essaie toujours tes lunettes pour voir à quel point tu es miro.", "burst",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (POTE2, 760, dict(expr="shocked", look=(-1, 0), bubble="Mais t'es aveugle !"))], (540, 1000, 1.1)),
        B("Les gens te demandent combien de doigts ils montrent. À chaque fois.", "burstyellow",
          [(H, 540, dict(expr="annoyed", look="CAM", tag=("3 DOIGTS ?", "#ffd166")))], (540, 1000, 1.3)),
        B("Au cinéma 3D, tu portes deux paires de lunettes l'une sur l'autre.", "cinema",
          [(H, 932, dict(seated=True, expr="sad", look="CAM"))], (900, 1000, 1.4)),
        B("Mais avec tes lunettes, tout le monde pense que tu es intelligent.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ], line2="D'AVOIR", hero=variant(glasses=True)),

    p("04-timide", "TIMIDE", [
        B("Pourquoi c'est la galère d'être timide ?", "burst", [], (540, 1000, 1.0)),
        B("Commander au restaurant ? Tu répètes ta phrase dix fois dans ta tête avant de parler.", "restaurant",
          [(H, 932, dict(seated=True, expr="sad", look=(0, 0.6)))], (900, 1000, 1.4)),
        B("Le serveur se trompe dans ta commande. Tu manges quand même. Sans rien dire.", "restaurant",
          [(H, 932, dict(seated=True, expr="annoyed", look="CAM", tag=("PAS COMMANDÉ", "#ffd166")))],
          (900, 1000, 1.4)),
        B("Au téléphone, tu laisses sonner jusqu'à ce que ça s'arrête. Puis tu réponds par message.", "waiting",
          [(H, 540, dict(expr="shocked", look=(0, 0.5)))], (540, 1000, 1.3), mid_cta=True),
        B("En classe, tu connais la réponse. Mais tu ne lèves jamais la main.", "burstblue",
          [(H, 540, dict(expr="sad", look="CAM", bubble="C'était facile…"))], (540, 1000, 1.3)),
        B("Quelqu'un te dit bon appétit, et tu réponds : toi aussi. Puis tu y repenses pendant trois jours.", "burst",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3)),
        B("Et dès que tout le monde te regarde, ton visage devient rouge.", "burstyellow",
          [(H, 540, dict(expr="sad", look=(0, 0.6)))], (540, 1000, 1.3), crowd=["Il rougit !", "Trop mignon", "Ça va ?"]),
        B("Mais quand tu es à l'aise avec quelqu'un, tu deviens la personne la plus drôle du monde.", "park",
          [(H, 330, dict(expr="smile", look=(1, 0), tag=("AVANTAGE", "#25d366"))),
           (POTE, 760, dict(expr="smile", look=(-1, 0)))], (540, 1000, 1.1)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),

    p("05-jumeau", "JUMEAU", [
        B("Pourquoi c'est la galère d'être jumeau ?", "burst", [], (540, 1000, 1.0)),
        B("Toute ta vie, les gens t'appellent par le prénom de ton frère.", "burstblue",
          [(H, 330, dict(expr="annoyed", look=(1, 0))), (H, 760, dict(expr="annoyed", look=(-1, 0)))],
          (540, 1000, 1.1)),
        B("Et la même question revient tout le temps.", "burst",
          [(H, 330, dict(expr="annoyed", look="CAM")),
           (FILLE, 760, dict(expr="smile", look=(-1, 0), bubble="Tu sens quand il a mal ?"))], (540, 1000, 1.1)),
        B("Pour ton anniversaire, tu partages le gâteau. Et souvent les cadeaux aussi.", "restaurant",
          [(H, 360, dict(expr="sad", look=(1, 0))), (H, 932, dict(seated=True, expr="smug", look=(-1, 0)))],
          (620, 1000, 1.2), mid_cta=True),
        B("À l'école, les profs vous comparent sans arrêt.", "waiting",
          [(H, 540, dict(expr="annoyed", look="CAM", bubble="Ton frère, lui…"))], (540, 1000, 1.3)),
        B("Ton frère fait une bêtise ? C'est toi qui te fais disputer.", "burstyellow",
          [(H, 330, dict(expr="shocked", look=(1, 0))), (MERE, 760, dict(expr="angry", look=(-1, 0)))],
          (540, 1000, 1.1)),
        B("Et quand tu te regardes en photo, tu n'es même pas sûr que ce soit toi.", "burst",
          [(H, 540, dict(expr="shocked", look="CAM", tag=("C'EST QUI ?", "#ffd166")))], (540, 1000, 1.3)),
        B("Mais tu as un meilleur ami depuis le premier jour de ta vie.", "park",
          [(H, 330, dict(expr="smile", look=(1, 0))), (H, 760, dict(expr="smile", look=(-1, 0), tag=("AVANTAGE", "#25d366")))],
          (540, 1000, 1.1)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),

    p("06-retard", "TOUJOURS EN RETARD", [
        B("Pourquoi c'est la galère d'être toujours en retard ?", "burst", [], (540, 1000, 1.0)),
        B("Tu te dis que tu as encore cinq minutes. Tu en as moins deux.", "burstblue",
          [(H, 540, dict(expr="shocked", look="CAM", tag=("- 2 MIN", "#ff4757")))], (540, 1000, 1.3)),
        B("Tu cours après le bus. Le chauffeur te regarde dans le rétro. Et il part.", "bus",
          [(H, 540, dict(expr="sad", look=(1, 0)))], (540, 1000, 1.3)),
        B("Tes amis te donnent un faux horaire, une heure avant le vrai. Et tu arrives quand même en retard.", "cafe",
          [(H, 330, dict(expr="annoyed", look=(1, 0))), (POTE, 932, dict(seated=True, expr="smug", look=(-1, 0)))],
          (620, 1000, 1.2), mid_cta=True),
        B("Ton message préféré : j'arrive. Envoyé depuis ton lit.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", bubble="J'arrive !"))], (540, 1000, 1.3)),
        B("Au travail, ton patron regarde sa montre dès que tu passes la porte.", "waiting",
          [(H, 330, dict(expr="sad", look=(1, 0))), (CHEF, 760, dict(expr="angry", look=(-1, 0)))], (540, 1000, 1.1)),
        B("Et le seul jour où tu es en avance, tout le monde est en retard.", "burstyellow",
          [(H, 540, dict(expr="annoyed", look="CAM", tag=("SEUL", "#ffd166")))], (540, 1000, 1.3)),
        B("Mais tu ne t'ennuies jamais en attendant quelqu'un. Puisque c'est toujours toi qu'on attend.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),

    p("07-appareil", "UN APPAREIL DENTAIRE", [
        B("Pourquoi c'est la galère d'avoir un appareil dentaire ?", "burst", [], (540, 1000, 1.0)),
        B("Le jour où on le serre, tu ne peux plus mâcher. Même la soupe fait mal.", "restaurant",
          [(H, 932, dict(seated=True, expr="sad", look="CAM", tag=("AÏE", "#ff4757")))], (900, 1000, 1.4)),
        B("Chaque repas finit avec un morceau de salade coincé dans les bagues.", "burstyellow",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3)),
        B("Tu souris la bouche fermée sur toutes les photos pendant deux ans.", "burst",
          [(H, 540, dict(expr="smug", look="CAM"))], (540, 1000, 1.3), mid_cta=True),
        B("Le caramel, le chewing-gum, le pop-corn : interdits.", "cinema",
          [(H, 932, dict(seated=True, expr="sad", look="CAM", bubble="Même pas un ?"))], (900, 1000, 1.4)),
        B("Et tout le monde fait la même blague.", "burstblue",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (POTE2, 760, dict(expr="smile", look=(-1, 0), bubble="Tu captes la radio ?"))], (540, 1000, 1.1)),
        B("Tes élastiques s'envolent au milieu d'une phrase. Directement dans l'assiette de quelqu'un.", "restaurant",
          [(H, 360, dict(expr="shocked", look=(1, 0))), (FILLE, 932, dict(seated=True, expr="shocked", look=(-1, 0)))],
          (620, 1000, 1.2)),
        B("Mais le jour où on te l'enlève, tu as le plus beau sourire du monde.", "burst",
          [(H, 540, dict(expr="smile", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ], line2="D'AVOIR"),

    p("08-celibataire", "LE SEUL CÉLIBATAIRE", [
        B("Pourquoi c'est la galère d'être le seul célibataire du groupe ?", "burst", [], (540, 1000, 1.0)),
        B("Au restaurant, les tables sont pour deux, quatre ou six. Toi, tu es le cinquième.", "restaurant",
          [(H, 932, dict(seated=True, expr="sad", look="CAM", tag=("5E ROUE", "#ffd166")))], (900, 1000, 1.4)),
        B("À chaque repas de famille, la même question.", "burstblue",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (MERE, 760, dict(expr="smile", look=(-1, 0), bubble="Alors, toujours personne ?"))], (540, 1000, 1.1),
          mid_cta=True),
        B("Tes amis veulent tous te présenter quelqu'un. Toujours la même personne.", "cafe",
          [(H, 330, dict(expr="annoyed", look=(1, 0))), (POTE, 932, dict(seated=True, expr="smug", look=(-1, 0)))],
          (620, 1000, 1.2)),
        B("Sur les photos de couples, c'est toi qui tiens l'appareil.", "park",
          [(H, 540, dict(expr="sad", look="CAM", tag=("PHOTOGRAPHE", "#7fc8f8")))], (540, 1000, 1.3)),
        B("Et à la Saint-Valentin, tu commandes une pizza pour deux. Pour toi.", "burstyellow",
          [(H, 540, dict(expr="smug", look="CAM"))], (540, 1000, 1.3)),
        B("Quand un couple se dispute, c'est toi qu'on appelle pour arbitrer.", "burst",
          [(H, 540, dict(expr="annoyed", look="CAM"))], (540, 1000, 1.3), crowd=["Dis-lui !", "Il a tort !", "Elle a tort !"]),
        B("Mais la télécommande, le lit et le dernier morceau de gâteau : tout est à toi.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),

    p("09-enfant-unique", "ENFANT UNIQUE", [
        B("Pourquoi c'est la galère d'être enfant unique ?", "burst", [], (540, 1000, 1.0)),
        B("Tout le monde pense que tu es pourri gâté. Même si ce n'est pas vrai.", "burstblue",
          [(H, 540, dict(expr="annoyed", look="CAM", tag=("GÂTÉ ?", "#ffd166")))], (540, 1000, 1.3)),
        B("Tes parents n'ont qu'un seul enfant à surveiller. Toi. Tout le temps.", "waiting",
          [(H, 330, dict(expr="sad", look=(1, 0))), (PERE, 760, dict(expr="angry", look=(-1, 0)))], (540, 1000, 1.1),
          mid_cta=True),
        B("Tu fais une bêtise ? Impossible d'accuser ton frère. Tu n'en as pas.", "burst",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3)),
        B("Les jeux de société à deux joueurs, tu les fais contre ta mère. Elle triche.", "cafe",
          [(H, 932, dict(seated=True, expr="annoyed", look="CAM"))], (900, 1000, 1.4)),
        B("En voyage, tu t'ennuies à l'arrière de la voiture pendant six heures.", "bus",
          [(H, 932, dict(seated=True, expr="sad", look=(0, 0.6)))], (900, 1000, 1.4)),
        B("Et les gens te demandent : ça ne te manque pas, un frère ou une sœur ?", "burstyellow",
          [(H, 330, dict(expr="annoyed", look=(1, 0))),
           (FILLE, 760, dict(expr="smile", look=(-1, 0), bubble="T'es pas trop seul ?"))], (540, 1000, 1.1)),
        B("Mais ta chambre, tes jouets et tes parents : rien à partager.", "burst",
          [(H, 540, dict(expr="smug", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),

    p("10-gourmand", "GOURMAND", [
        B("Pourquoi c'est la galère d'être gourmand ?", "burst", [], (540, 1000, 1.0)),
        B("Tu dis que tu prends juste un carré de chocolat. Il reste le papier.", "burstyellow",
          [(H, 540, dict(expr="smug", look="CAM", tag=("1 CARRÉ", "#ffd166")))], (540, 1000, 1.3)),
        B("Au restaurant, tu regardes le dessert avant même de choisir le plat.", "restaurant",
          [(H, 932, dict(seated=True, expr="smile", look=(0, 0.6)))], (900, 1000, 1.4)),
        B("Quelqu'un ouvre un paquet de chips à l'autre bout de la maison. Tu arrives en trois secondes.", "burst",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3), mid_cta=True),
        B("Au supermarché, tu viens pour du pain. Tu repars avec trois paquets de biscuits.", "supermarket",
          [(H, 540, dict(expr="smug", look="CAM"))], (540, 1000, 1.25)),
        B("Et ton estomac gronde pendant l'interro, au moment exact où tout le monde se tait.", "waiting",
          [(H, 540, dict(expr="shocked", look="CAM"))], (540, 1000, 1.3), silence=True),
        B("Tes amis cachent leur goûter quand ils te voient arriver.", "burstblue",
          [(H, 330, dict(expr="sad", look=(1, 0))),
           (POTE, 760, dict(expr="smug", look=(-1, 0), bubble="J'ai rien, moi !"))], (540, 1000, 1.1)),
        B("Mais tu sais toujours où trouver la meilleure pizza de la ville.", "burst",
          [(H, 540, dict(expr="smile", look="CAM", tag=("AVANTAGE", "#25d366")))], (540, 1000, 1.3)),
        B(END, "burst", [(H, 540, dict(expr="smile", look="CAM"))], (540, 1000, 1.25), cta=True),
    ]),
]
