# -*- coding: utf-8 -*-
"""Génère l'ebook (HTML -> PDF via Chromium headless)."""
import html
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from sketches5 import SKETCHES  # noqa: E402

ROLE = {"E": "GÉRARD", "V": "LA VICTIME", "A": "L'AUTORITÉ"}

CH = []


def ch(title, body):
    CH.append((title, body))


ch("Avant de commencer", """
<p>Ce guide t'explique, étape par étape, comment fabriquer des <b>vidéos courtes animées</b> (TikTok, YouTube Shorts,
Instagram Reels) dans le style « sketch cartoon » : un personnage exigeant, une situation absurde, une chute qui se
retourne contre lui.</p>
<p>C'est la méthode que j'utilise pour produire mes propres vidéos. Tu n'as pas besoin de savoir dessiner ni de savoir
programmer : tout ce qui est expliqué ici se fait avec des outils gratuits ou peu chers (Canva, CapCut, un outil d'IA
pour les images).</p>
<div class="note"><b>Honnêteté d'abord.</b> Personne ne peut te garantir des abonnés ni des vues : cela dépend de
l'algorithme, de ta régularité et de tes idées. Ce guide te donne une méthode de travail et des modèles prêts à
l'emploi, pas une promesse de résultat.</div>
<h3>Ce que tu sauras faire à la fin</h3>
<ul>
<li>Trouver des idées de sketchs qui se comprennent en 2 secondes.</li>
<li>Écrire un script de 40 secondes avec un hook, une montée et une chute.</li>
<li>Créer tes personnages et tes décors une fois, et les réutiliser.</li>
<li>Faire la voix (voix de synthèse ou la tienne) et les sous-titres.</li>
<li>Monter la vidéo, publier, et suivre ce qui marche.</li>
</ul>
""")

ch("1. Le format qui fonctionne", """
<h3>Le sketch « exigeant / victime / autorité »</h3>
<p>Trois rôles suffisent pour faire une vidéo complète :</p>
<ul>
<li><b>L'exigeant</b> : il demande quelque chose d'absurde avec une totale confiance (« mon café sans café »).</li>
<li><b>La victime</b> : calme, elle répond avec logique. C'est elle que le spectateur croit.</li>
<li><b>L'autorité</b> : elle arrive avec la preuve et remet l'exigeant à sa place. C'est la récompense.</li>
</ul>
<p>Le spectateur se dit : « je connais quelqu'un comme ça ». Il commente, il partage, et il veut voir la chute.
La satisfaction de la chute est ce qui fait regarder jusqu'au bout.</p>
<h3>Les 3 formats que tu peux répéter</h3>
<table>
<tr><th>Format</th><th>Exemple de titre</th><th>Pourquoi ça marche</th></tr>
<tr><td>Sketch dialogué</td><td>« Il interdit de rire au cinéma »</td><td>Conflit + chute</td></tr>
<tr><td>« Et si tu… »</td><td>« Et si tu entendais les pensées des gens ? »</td><td>Curiosité dès la 1re phrase</td></tr>
<tr><td>Série à personnage</td><td>« Gérard · Épisode 4 »</td><td>On s'attache, on suit pour la suite</td></tr>
</table>
<h3>La règle la plus importante : un personnage récurrent</h3>
<p>Beaucoup de comptes publient des histoires différentes à chaque fois et n'obtiennent presque pas d'abonnés : le
spectateur regarde, puis passe à autre chose. Un <b>personnage récurrent</b> (comme Gérard) crée une raison de
s'abonner : « je veux voir ce qu'il va encore faire ». Choisis ton personnage, donne-lui <b>un seul défaut</b> clair, et
fais-le revenir dans chaque épisode.</p>
""")

ch("2. Trouver des idées (sans jamais manquer)", """
<h3>La formule en 3 questions</h3>
<ol>
<li>Quelle est la <b>demande absurde</b> ? (un café sans café, un banc réservé en 1998)</li>
<li>Quelle est la <b>réponse logique</b> de la victime ?</li>
<li>Quelle est la <b>preuve</b> qui retourne la situation ? (une affiche, un registre, une caméra, un ticket)</li>
</ol>
<p>Si tu as les trois, tu as un sketch.</p>
<h3>Où trouver la matière</h3>
<ul>
<li>Les lieux du quotidien : café, bus, supermarché, cinéma, avion, piscine, restaurant, salle d'attente.</li>
<li>Les phrases qu'on entend vraiment : « le client est roi », « je connais le patron », « c'est pas moi ».</li>
<li>Les commentaires de tes vidéos : « il devrait aller chez le médecin » = ton prochain épisode.</li>
</ul>
<h3>30 idées de départ</h3>
<ul class="cols"><li>Il veut le wifi gratuit à vie</li><li>Il exige un surclassement parce qu'il « connaît le pilote »</li><li>Il présente une carte de fidélité comme une carte VIP</li><li>Il réserve 12 transats avec des serviettes</li><li>Il négocie parce que la pomme est trop ronde</li><li>Il dit que le chef est son ami</li><li>Il passe devant tout le monde pour « urgence : j'ai faim »</li><li>Il a réservé un banc en 1998</li><li>Il veut être remboursé car la fin du film est triste</li><li>Il se dispute avec un GPS</li><li>Il demande un rabais sur le soleil</li><li>Il réclame un siège « côté droite du hublot »</li><li>Il se plaint que la mer est trop salée</li><li>Il veut payer en promesses</li><li>Il fait la queue en sens inverse</li><li>Il rend un yaourt vide</li><li>Il veut un remboursement car il a dormi pendant le film</li><li>Il se plaint que le cinéma est trop noir</li><li>Il demande une table « avec vue » dans un sous-sol</li><li>Il refuse de descendre du bus car c'est son arrêt préféré</li><li>Il commande un plat « sans ingrédients »</li><li>Il exige le silence dans une fête</li><li>Il réserve la salle de sport pour lui seul</li><li>Il veut un autographe de son propre chien</li><li>Il accuse son ombre</li><li>Il veut échanger sa place avec celle d'un étranger</li><li>Il rapporte un cadeau qu'il a lui-même offert</li><li>Il réclame une mise à jour de la météo</li><li>Il demande un taxi pour traverser la rue</li><li>Il refuse de payer « parce que c'est sa tournée »</li></ul>
""")

ch("3. Écrire un script de 40 secondes", """
<h3>La structure en 7 temps</h3>
<table>
<tr><th>Temps</th><th>Durée</th><th>Rôle</th></tr>
<tr><td>1. Hook</td><td>0–2 s</td><td>Le conflit en une phrase, écrit en gros à l'écran</td></tr>
<tr><td>2. Demande</td><td>2–6 s</td><td>L'exigeant demande l'absurde</td></tr>
<tr><td>3. Réponse</td><td>6–12 s</td><td>La victime répond calmement</td></tr>
<tr><td>4. Escalade</td><td>12–20 s</td><td>L'exigeant insiste, plus absurde encore</td></tr>
<tr><td>5. Appel à s'abonner</td><td>~20 s</td><td>Une phrase face caméra : « Abonne-toi, la suite va le faire taire »</td></tr>
<tr><td>6. L'autorité</td><td>20–35 s</td><td>Elle arrive avec la preuve</td></tr>
<tr><td>7. Chute + teaser</td><td>35–42 s</td><td>L'exigeant perd, puis annonce de la suite</td></tr>
</table>
<h3>Les règles d'écriture</h3>
<ul>
<li><b>Phrases courtes</b> : maximum 12 mots. Une phrase = une idée.</li>
<li><b>Une seule blague par réplique.</b> Si tu hésites, coupe.</li>
<li><b>La victime ne s'énerve jamais.</b> C'est le contraste avec l'exigeant qui fait rire.</li>
<li><b>La chute vient de la preuve</b>, pas d'une insulte.</li>
<li><b>Termine avec une promesse</b> : « Demain, Gérard prend l'avion. »</li>
</ul>
<h3>Exemple complet (épisode 1 de Gérard)</h3>
<p class="script">
<b>Gérard</b> : Bonjour. C'est mon anniversaire. Donc le café est gratuit.<br>
<b>Léa</b> : Joyeux anniversaire monsieur. Ça fait deux euros.<br>
<b>Gérard</b> : Les rois ne paient pas leur anniversaire.<br>
<b>Léa</b> : Vous êtes déjà venu hier pour votre anniversaire.<br>
<b>Gérard</b> : Hier, c'était mon demi-anniversaire.<br>
<b>Le patron</b> : Votre anniversaire, c'est le trois mars. Vous êtes venu quarante et une fois cette année pour le
fêter. On a une affiche.
</p>
""")

ch("4. Les hooks : la première image décide de tout", """
<p>Sur TikTok comme sur Shorts, le spectateur décide en moins de deux secondes. Le hook doit être
<b>lisible sans le son</b> et <b>créer une question dans la tête</b>.</p>
<h3>8 formules de hook</h3>
<ol>
<li><b>La demande absurde</b> : « Il veut un café sans café »</li>
<li><b>Le chiffre</b> : « 4 heures. 1 verre d'eau. »</li>
<li><b>Le « Et si… »</b> : « Et si tu voyais un chiffre sur chaque tête ? »</li>
<li><b>Le lieu + le défaut</b> : « Son anniversaire. Encore. »</li>
<li><b>La contradiction</b> : « Il se croit vieux. Il a 26 ans. »</li>
<li><b>Le secret</b> : « Ton chat pense à ça. »</li>
<li><b>La promesse de chute</b> : « Regarde ce qui lui arrive à la fin »</li>
<li><b>La question</b> : « Tu aurais fait quoi ? »</li>
</ol>
<h3>Les règles visuelles</h3>
<ul>
<li>Texte <b>gros</b> (jaune sur fond sombre ou noir sur jaune), maximum 6 mots.</li>
<li>Le texte reste affiché pendant la première phrase.</li>
<li>Les personnages sont déjà en place dès la première image : pas d'intro lente.</li>
</ul>
""")

ch("5. Créer tes personnages et tes décors", """
<h3>Principe : tu les crées une fois, tu les réutilises toujours</h3>
<p>Le gros avantage du format : un personnage et un décor se réutilisent à l'infini. Prévois :</p>
<ul>
<li><b>1 personnage principal</b> (ton exigeant) avec un look immédiatement reconnaissable : lunettes, moustache,
veste. Garde-le <b>identique</b> dans tous les épisodes.</li>
<li><b>3 à 5 seconds rôles</b> avec des silhouettes différentes (barista, hôtesse, contrôleur, serveur).</li>
<li><b>5 à 8 décors simples</b> : café, bus, avion, cinéma, supermarché, restaurant, piscine, parc.</li>
</ul>
<h3>Comment les fabriquer sans savoir dessiner</h3>
<ol>
<li><b>Style simple.</b> Gros yeux, contours épais, couleurs franches, peu de détails. Plus c'est simple, plus c'est
cohérent d'une vidéo à l'autre.</li>
<li><b>Génère les personnages avec un outil d'images IA</b> en demandant « cartoon flat style, thick black outline, full
body, white background » et conserve la <b>même description</b> à chaque fois.</li>
<li><b>Découpe</b> chaque personnage (arrière-plan transparent) avec l'outil de suppression de fond de Canva ou CapCut.</li>
<li><b>Fabrique la bouche à part</b> : deux ou trois formes (fermée, mi-ouverte, ouverte) que tu alternes pendant que le
personnage parle.</li>
</ol>
<div class="note"><b>Attention.</b> Les fonctions des outils (Canva, CapCut, générateurs d'images) changent souvent.
Vérifie leurs conditions d'utilisation avant de publier et assure-toi d'avoir le droit d'utiliser commercialement les
images générées.</div>
""")

ch("6. La voix", """
<h3>Option 1 : la voix de synthèse (la plus rapide)</h3>
<p>Dans CapCut : <b>Texte → Ajouter un texte → Texte en parole</b>, puis choisis une voix française. Conseils :</p>
<ul>
<li>Choisis <b>une voix par personnage</b> et ne change jamais : les spectateurs reconnaissent la voix de Gérard.</li>
<li>Découpe en <b>phrases courtes</b> : la synthèse sonne plus naturelle sur une phrase de 6 à 12 mots.</li>
<li>Évite les mots étrangers, les sigles et les chiffres écrits : écris les nombres en toutes lettres.</li>
<li>Ajoute de la ponctuation (virgules, points) : c'est elle qui crée les pauses.</li>
<li>Accélère légèrement (1,05 à 1,15×) si la voix traîne.</li>
</ul>
<h3>Option 2 : ta propre voix</h3>
<p>Enregistre-toi dans un placard ou une pièce avec des vêtements (peu d'écho), avec un micro de casque. Fais une
voix différente par personnage (plus grave, plus aiguë). C'est plus authentique, et ça évite l'effet « robot ».</p>
<h3>Les sons qui donnent du rythme</h3>
<ul>
<li>Un bruit d'ambiance très léger (café, bus, cinéma) à 10–15 % du volume.</li>
<li>Un petit « ding » au moment de l'appel à s'abonner.</li>
<li>Un bruit de pas quand un personnage entre.</li>
</ul>
""")

ch("7. Le montage dans CapCut", """
<h3>Réglages de départ</h3>
<ul>
<li>Format <b>9:16</b> (1080 × 1920), 30 images par seconde.</li>
<li>Durée visée : <b>35 à 45 secondes</b>.</li>
</ul>
<h3>L'ordre de montage</h3>
<ol>
<li>Pose le décor en fond.</li>
<li>Place les personnages et fais-les entrer avec une animation simple (glissement, rebond).</li>
<li>Importe la voix, ligne par ligne, et cale les personnages sur les répliques.</li>
<li>Alterne la bouche ouverte/fermée pendant que le personnage parle.</li>
<li>Ajoute les <b>sous-titres automatiques</b>, en gros, centrés, un mot en couleur pour l'accent.</li>
<li>Ajoute le hook en gros texte sur les premières secondes.</li>
<li>Ajoute le bandeau « Abonne-toi » vers 45 % de la vidéo.</li>
<li>Ajoute la carte de fin : « Suis [personnage] » + l'annonce de l'épisode suivant.</li>
</ol>
<h3>Les erreurs à éviter</h3>
<ul>
<li>Intro avec logo : les gens quittent la vidéo avant le hook.</li>
<li>Sous-titres trop petits ou cachés par l'interface (garde-les au-dessus du bas de l'écran).</li>
<li>Texte du hook qui disparaît trop vite.</li>
<li>Vidéo trop longue : 40 secondes bien montées valent mieux que 70 secondes diluées.</li>
</ul>
""")

ch("8. Publier et grandir", """
<h3>Le rythme</h3>
<ul>
<li><b>Une vidéo par jour</b> pendant au moins 3 à 4 semaines, à la même heure.</li>
<li>Le contenu doit rester dans <b>un seul thème</b> pour que ton profil soit cohérent.</li>
</ul>
<h3>Ton profil (c'est lui qui décide de l'abonnement)</h3>
<ul>
<li><b>Bio claire</b> : « Gérard, le client qui exige tout. 1 épisode par jour. »</li>
<li><b>Épingle tes 3 meilleures vidéos</b> pour que les nouveaux visiteurs comprennent la série.</li>
<li>Une <b>photo de profil</b> reconnaissable : ton personnage.</li>
</ul>
<h3>Légende, hashtags, commentaires</h3>
<ul>
<li>Légende : une phrase + l'annonce de demain. Pas de roman.</li>
<li>3 à 5 hashtags, dont un propre à ta série.</li>
<li>Réponds à <b>tous</b> les commentaires dans l'heure qui suit : ça aide la diffusion et ça te donne des idées.</li>
<li>Épingle un commentaire qui pose une question (« Il va où demain ? »).</li>
</ul>
<h3>Lire tes statistiques</h3>
<table>
<tr><th>Chiffre</th><th>Ce que ça dit</th><th>Que faire</th></tr>
<tr><td>Vues très basses</td><td>Le hook ne retient pas</td><td>Change la première phrase et le texte à l'écran</td></tr>
<tr><td>Beaucoup de vues, peu d'abonnés</td><td>Le contenu plaît mais ne donne pas de raison de suivre</td><td>Personnage récurrent, épisodes numérotés, annonce du suivant</td></tr>
<tr><td>Les gens quittent à mi-parcours</td><td>La montée est trop lente</td><td>Raccourcis, coupe une réplique</td></tr>
<tr><td>Beaucoup de commentaires</td><td>Le sujet touche</td><td>Fais-en une série</td></tr>
</table>
<h3>Plan de départ sur 10 jours</h3>
<ol>
<li>Jour 1–3 : épisodes 1, 2, 3. Épingle-les.</li>
<li>Jour 4–9 : un épisode par jour, tu réponds à tous les commentaires.</li>
<li>Jour 10 : finale de saison + annonce de la saison 2.</li>
<li>Jour 11 : regarde tes statistiques et garde les 2 formats qui marchent le mieux.</li>
</ol>
""")

ch("9. Checklist avant de publier", """
<ul class="check">
<li>Le hook est lisible en 2 secondes, sans le son ?</li>
<li>Maximum 12 mots par réplique ?</li>
<li>La victime reste calme ?</li>
<li>Une preuve retourne la situation ?</li>
<li>L'appel à s'abonner est à environ 45 % ?</li>
<li>La fin annonce l'épisode suivant ?</li>
<li>Sous-titres lisibles, au-dessus de l'interface ?</li>
<li>Durée entre 35 et 45 secondes ?</li>
<li>Légende courte + 3 à 5 hashtags ?</li>
<li>Tu as prévu de répondre aux commentaires dans l'heure ?</li>
</ul>
""")


def annex():
    out = ["<h3>Les 10 scripts de la série « Les galères de Gérard »</h3>",
           "<p>Tu peux les reprendre tels quels pour t'entraîner, ou les adapter à ton propre personnage.</p>"]
    for sk in SKETCHES:
        out.append("<h4>%s : %s</h4><p class='script'>" % (sk["title"], html.escape(sk["hook_text"])))
        for ln in sk["lines"]:
            if ln[0].startswith("@"):
                out.append("<i>(l'autorité arrive)</i><br>" if ln[0] == "@ENTER" else "<i>(Gérard part)</i><br>")
                continue
            who, mood, text = ln[:3]
            out.append("<b>%s</b> : %s<br>" % (ROLE[who], html.escape(text.lstrip("§"))))
        out.append("</p>")
    return "".join(out)


ch("Annexe : les scripts complets", annex())

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: 'Inter','Helvetica Neue',Arial,sans-serif; color:#1b1b1b; font-size:11.5pt; line-height:1.55; }
h1 { font-size: 34pt; line-height:1.1; margin:0 0 8pt; }
h2 { font-size: 21pt; margin: 0 0 10pt; padding-bottom:6pt; border-bottom:4px solid #ffd166; page-break-before: always; }
h3 { font-size: 13.5pt; margin: 16pt 0 5pt; color:#264653; }
h4 { font-size: 11.5pt; margin: 14pt 0 3pt; color:#e63946; }
.cover { height: 250mm; display:flex; flex-direction:column; justify-content:center; background:#0d1b2a; color:#fff;
  margin:-18mm -16mm; padding: 30mm 22mm; }
.cover .tag { background:#ffd166; color:#1b1b1b; display:inline-block; padding:4pt 10pt; border-radius:6pt; font-weight:800;
  width:fit-content; margin-bottom:16pt; }
.cover p { font-size:14pt; color:#cdd6e0; }
.toc { page-break-before: always; }
.toc li { margin: 4pt 0; }
table { border-collapse:collapse; width:100%; margin: 8pt 0; font-size:10.5pt; }
th, td { border:1px solid #d5dbe1; padding:5pt 7pt; text-align:left; vertical-align:top; }
th { background:#f1f5f9; }
.note { background:#fff5d6; border-left:5px solid #ffd166; padding:8pt 11pt; margin:10pt 0; border-radius:4pt; }
.script { background:#f4f7fa; padding:9pt 12pt; border-radius:6pt; font-size:10.5pt; }
.cols { column-count:2; column-gap:14pt; font-size:10pt; padding-left:14pt; } .cols li{break-inside:avoid;margin-bottom:2pt}
ul.check { list-style:none; padding-left:0; }
ul.check li::before { content:'☐  '; }
"""


def main():
    toc = "".join("<li>%s</li>" % t for t, _ in CH)
    parts = ["<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Le Guide des Vidéos Animées</title>"
             "<style>%s</style></head><body>" % CSS]
    parts.append("<div class='cover'><div class='tag'>GUIDE PRATIQUE</div><h1>Crée des vidéos animées<br>pour TikTok, Shorts<br>et YouTube</h1>"
                 "<p>La méthode « sketch cartoon » : trouver l'idée, écrire le script, créer le personnage, la voix, le montage et "
                 "la série qui donne envie de s'abonner.</p><p>+ 10 scripts complets prêts à l'emploi</p></div>")
    parts.append("<div class='toc'><h2 style='page-break-before:avoid'>Sommaire</h2><ol>%s</ol></div>" % toc)
    for t, b in CH:
        parts.append("<h2>%s</h2>%s" % (t, b))
    parts.append("</body></html>")
    p_html = os.path.join(HERE, "guide-videos-animees.html")
    with open(p_html, "w") as fh:
        fh.write("".join(parts))
    pdf = os.path.join(HERE, "guide-videos-animees.pdf")
    subprocess.run(["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "--headless", "--no-sandbox", "--disable-gpu",
                    "--no-pdf-header-footer", "--print-to-pdf=" + pdf, "file://" + p_html], check=True,
                   capture_output=True)
    print(pdf)


main()
