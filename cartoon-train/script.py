# -*- coding: utf-8 -*-
"""Script du sketch : « Refus de céder sa place côté fenêtre dans le train »."""

TITLE = "Refus de céder sa place côté fenêtre"

# Personnages
#   G = Gérard, le père exigeant (polo orange, moustache)
#   L = Lola, sa fille (couettes rousses)
#   I = Inès, la passagère (sweat jaune, casque autour du cou)
#   C = le contrôleur (uniforme bleu marine, casquette)

# Chaque réplique : (personnage, texte, humeurs {perso: humeur}, plan)
# humeurs : neutral, smile, smug, annoyed, angry, shocked, sad
# plans   : wide, G, I, C, L, GI (deux personnages), GC
LINES = [
    ("G", "Excusez-moi mademoiselle, c'est bien la place côté fenêtre que vous occupez là ?",
     {"G": "smile", "I": "neutral"}, "GI"),
    ("I", "Oui, c'est la mienne. Je l'ai réservée.", {"I": "neutral"}, "I"),
    ("G", "C'est merveilleux. Auriez-vous l'obligeance de la céder à ma fille pour la durée du trajet ?",
     {"G": "smile"}, "G"),
    ("G", "Elle adore regarder les vaches.", {"G": "smug"}, "wide"),
    ("I", "Euh... non, désolée. Je l'ai choisie exprès.", {"I": "annoyed"}, "I"),
    ("G", "Pourtant, je vous vois les yeux rivés sur votre téléphone.", {"G": "neutral"}, "G"),
    ("I", "Je regarderai le paysage tout à l'heure.", {"I": "annoyed"}, "I"),
    ("G", "Vous n'êtes pas sans savoir que le paysage est également visible depuis le couloir.",
     {"G": "smug"}, "GI"),
    ("I", "Dans ce cas, votre fille peut le regarder depuis le couloir.", {"I": "smug"}, "I"),
    ("G", "Ce n'est absolument pas la même chose. Elle a besoin de coller son front contre la vitre.",
     {"G": "angry"}, "G"),
    ("L", "Papa, je veux voir les vaches !", {"L": "sad", "G": "neutral"}, "L"),
    ("G", "Vous voyez ? C'est en quelque sorte sa fenêtre de soutien émotionnel.",
     {"G": "smug", "L": "neutral"}, "G"),
    ("I", "Je regrette, mais c'est non.", {"I": "annoyed"}, "I"),
    ("G", "Combien de temps comptez-vous rester assise, exactement ?", {"G": "angry"}, "G"),
    ("I", "Jusqu'à Marseille. C'est un peu le principe d'un billet.", {"I": "smug"}, "I"),
    ("G", "Pourquoi ne pas vous asseoir ailleurs, et revenir quand nous serons descendus ?",
     {"G": "smile"}, "GI"),
    ("@ENTER_C", None, None, "wide"),
    ("C", "Bonjour messieurs dames, contrôle des billets, s'il vous plaît.", {"C": "neutral"}, "C"),
    ("G", "Monsieur, cette jeune femme refuse de céder la fenêtre à ma fille !",
     {"G": "angry", "C": "neutral"}, "GC"),
    ("C", "Mademoiselle a réservé la place quatorze, côté fenêtre. C'est son droit le plus strict.",
     {"C": "neutral", "I": "smile"}, "C"),
    ("G", "Mais ma fille, elle, n'a pas de fenêtre !", {"G": "angry"}, "G"),
    ("C", "Et vous, monsieur, quelles places avez-vous réservées ?", {"C": "neutral"}, "C"),
    ("G", "Aucune. Nous n'avons pas encore acheté nos billets.", {"G": "shocked"}, "G"),
    ("C", "Alors ce sera une amende de cinquante euros chacun. Veuillez me suivre.",
     {"C": "annoyed", "G": "shocked"}, "GC"),
    ("G", "Non mais c'est incroyable ! Est-ce que quelqu'un d'autre aurait une fenêtre ?",
     {"G": "angry"}, "wide"),
    ("@EXIT", None, None, "wide"),
    ("I", "Merci monsieur. Bon voyage !", {"I": "smile"}, "I"),
]
