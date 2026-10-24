# -*- coding: utf-8 -*-
"""Ebook « Studio Cartoon » (~40 pages A5) construit à partir du contenu de la formation."""
import html
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "formation"))
from contenu import MODULES, CHECKLIST, FICHE_PERSO, MODELE_SCRIPT  # noqa: E402
from sketches5 import SKETCHES as GERARD  # noqa: E402
from histoires3 import STORIES as ETSI  # noqa: E402

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
TITLE = "Studio Cartoon"
SUB = "Le guide pour créer des sketchs animés qui donnent envie de s'abonner"
ROLE = {"E": "Gérard", "V": "La victime", "A": "L'autorité"}
N_SCRIPTS = int(os.environ.get("N_SCRIPTS", "4"))
N_ETSI = int(os.environ.get("N_ETSI", "1"))

PLAN_30 = [
    ("1", "Choisis ton format principal et ton heure de publication"),
    ("2", "Remplis la fiche de ton personnage (défaut, phrase fétiche, look, voix)"),
    ("3", "Fais ton tableau lieu × défaut : au moins 10 lieux"),
    ("4", "Choisis tes 10 idées de saison et passe-les au test des 5 questions"),
    ("5", "Écris les scripts des épisodes 1 à 3 (7 temps, puis 3 passes)"),
    ("6", "Écris 3 hooks par script et les teasers de toute la saison"),
    ("7", "Rassemble tes images de référence de style"),
    ("8", "Génère ton personnage principal et ses 5 expressions"),
    ("9", "Crée 3 seconds rôles avec la même recette de style"),
    ("10", "Crée 3 décors et découpe tout ton kit (PNG transparents)"),
    ("11", "Crée tes 3 formes de bouche, ton bandeau de hook et ta carte de fin"),
    ("12", "Génère les voix de l'épisode 1 et rassemble tes sons de base"),
    ("13", "Monte l'épisode 1 : décor, voix, personnages, bouches"),
    ("14", "Ajoute zooms, sous-titres, hook, appel au milieu et carte de fin ; exporte"),
    ("15", "Transforme l'épisode 1 en projet modèle"),
    ("16", "Écris les scripts des épisodes 4 à 10 en une séance"),
    ("17", "Génère toutes les voix des épisodes 2 à 10"),
    ("18", "Monte les épisodes 2 et 3"),
    ("19", "Monte les épisodes 4 et 5 ; refais ta bio et ta photo de profil"),
    ("20", "Publie l'épisode 1 ; réponds aux commentaires dans l'heure"),
    ("21", "Publie l'épisode 2 ; monte l'épisode 6"),
    ("22", "Publie l'épisode 3 ; épingle les épisodes 1 à 3 sur ton profil"),
    ("23", "Publie l'épisode 4 ; monte l'épisode 7"),
    ("24", "Publie l'épisode 5 ; monte l'épisode 8"),
    ("25", "Publie l'épisode 6 ; note tes premiers chiffres dans ton tableur"),
    ("26", "Publie l'épisode 7 ; monte les épisodes 9 et 10"),
    ("27", "Publie l'épisode 8 ; reprends les idées des commentaires"),
    ("28", "Publie l'épisode 9 ; écris le pitch de la saison 2"),
    ("29", "Publie la finale (épisode 10) avec l'annonce de la saison 2"),
    ("30", "Analyse : compare tes 3 meilleures et tes 3 pires vidéos, choisis une seule chose à changer"),
]

ERREURS = [
    ("Changer de thème chaque jour", "Le profil devient incohérent et personne ne sait pourquoi s'abonner. Garde un personnage et un format pendant au moins un mois."),
    ("Une intro avant le hook", "Logo, « salut tout le monde » ou titre animé : le spectateur part avant la première blague. Commence directement par le conflit."),
    ("Des répliques trop longues", "Au-delà de 12 mots, les sous-titres ne se lisent plus d'un coup d'œil. Coupe."),
    ("Une victime qui s'énerve", "Si les deux crient, le spectateur ne sait plus qui a raison. La victime reste calme, toujours."),
    ("Une chute sans preuve", "« Sortez ! » ne suffit pas. Une affiche, un chiffre ou un registre rend la chute satisfaisante."),
    ("Promettre une suite qui ne vient pas", "Un spectateur déçu ne revient pas. Ne teaser que ce que tu publieras."),
    ("Changer la voix du personnage", "Les fidèles reconnaissent ton héros à sa voix. Choisis-la une fois pour toutes."),
    ("Des sous-titres cachés par l'interface", "Le bas de l'écran et le bord droit sont couverts par les boutons de l'application. Remonte tes textes."),
    ("Juger après trois vidéos", "Les chiffres d'une seule vidéo varient énormément. Publie au moins 3 à 4 semaines avant de conclure."),
    ("Chercher la perfection", "Une vidéo publiée vaut mieux qu'une vidéo parfaite jamais terminée. Publie, observe, améliore la suivante."),
]
FONT_PT = float(os.environ.get("FONT_PT", "10"))

CSS = """
@page { size: A5; margin: 13mm 12mm 14mm; @bottom-center { content: counter(page); font-size: 8pt; color: #8a93a0; } }
@page :first { margin: 0; @bottom-center { content: none; } }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body { font-family: 'Source Sans 3','Inter','Helvetica Neue',Arial,sans-serif; color:#1d2027; font-size:__FS__pt; line-height:1.5; }
h1,h2,h3,h4 { font-family:'Bricolage Grotesque','Inter','Helvetica Neue',Arial,sans-serif; line-height:1.15; }
.cover { height: 209mm; width: 148mm; margin: 0; padding: 24mm 16mm; background:#0d1b2a; color:#fff; display:flex; flex-direction:column; justify-content:space-between; page-break-after: always; }
.cover .tag { background:#ffd166; color:#1b1b1b; font-weight:800; padding:3pt 9pt; border-radius:5pt; width:fit-content; font-size:9pt; letter-spacing:.06em; }
.cover h1 { font-size: 34pt; margin: 12pt 0 8pt; }
.cover p { color:#cdd6e0; font-size: 12pt; }
.cover .face { width: 120pt; height:120pt; border-radius:50%; background:#ffd166; border:4pt solid #1b1b1b; position:relative; margin: 10pt 0; }
.cover .face i { position:absolute; top:38pt; width:28pt; height:28pt; border-radius:50%; background:#fff; border:3pt solid #1b1b1b; }
.cover .face i::after { content:''; position:absolute; left:8pt; top:8pt; width:9pt; height:9pt; border-radius:50%; background:#1b1b1b; }
.cover .face .m { position:absolute; left:34pt; top:76pt; width:46pt; height:22pt; border-bottom:4pt solid #1b1b1b; border-radius:0 0 30pt 30pt; }
.cover small { color:#8fa0b3; }
.page { page-break-before: always; }
.toc ol { padding-left: 16pt; } .toc li { margin: 3pt 0; }
.chap { page-break-before: always; }
.chap-head { border-bottom: 3pt solid #ffd166; padding-bottom: 6pt; margin-bottom: 10pt; }
.chap-head .k { color:#e0194a; font-weight:800; letter-spacing:.08em; font-size:8pt; text-transform:uppercase; }
.chap-head h2 { font-size: 20pt; margin: 3pt 0 4pt; }
.chap-head p { margin:0; color:#5b6670; font-style: italic; }
h3.sec { font-size: 13pt; margin: 14pt 0 4pt; color:#0d1b2a; page-break-after: avoid; }
h3 { font-size: 11pt; margin: 10pt 0 3pt; color:#264653; page-break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10pt 0 3pt; color:#e0194a; page-break-after: avoid; }
p { margin: 4pt 0 6pt; }
ul, ol { margin: 4pt 0 6pt; padding-left: 15pt; }
table { border-collapse:collapse; width:100%; margin: 6pt 0; font-size:.9em; }
th, td { border:1px solid #d5dbe1; padding:3pt 5pt; text-align:left; vertical-align:top; }
th { background:#f1f5f9; }
td.blank { height: 16pt; width: 60%; }
.note { background:#fff5d6; border-left:4pt solid #ffd166; padding:6pt 9pt; margin:8pt 0; border-radius:3pt; }
.script { background:#f4f7fa; padding:7pt 9pt; border-radius:5pt; font-size:.92em; }
.cols { column-count:2; column-gap:10pt; font-size:.9em; } .cols li { break-inside: avoid; }
.todo { border-left:4pt solid #2a9d8f; background:#eef8f6; padding:6pt 9pt; margin:8pt 0; border-radius:3pt; }
.todo b { color:#1f7f73; }
ul.check { list-style:none; padding-left:0; } ul.check li::before { content:'☐  '; }
code { background:#eef2f5; padding:0 3pt; border-radius:3pt; font-size:.9em; }
"""


def body_parts():
    p = []
    p.append("<div class='cover'><div><div class='tag'>EBOOK · GUIDE PRATIQUE</div><h1>%s</h1><p>%s</p></div>"
             "<div class='face'><i style='left:22pt'></i><i style='left:64pt'></i><div class='m'></div></div>"
             "<div><p>Idées · Scripts · Hooks · Personnages · Voix · Montage CapCut · Publication</p>"
             "<small>+ plan de 30 jours et %d scripts complets prêts à adapter</small></div></div>" % (TITLE, SUB, N_SCRIPTS + N_ETSI))
    chapters = MODULES[1:]  # le module « Bienvenue » devient l'introduction
    toc = "".join("<li>%s</li>" % m["title"] for m in chapters)
    p.append("<div class='page toc'><h2>Sommaire</h2><ol><li>Introduction</li>%s<li>Annexes : plan de 30 jours, erreurs à éviter, checklist, modèles et scripts</li></ol>"
             "<div class='note'><b>Avant de commencer.</b> Personne ne peut garantir un nombre d'abonnés, de vues ou de "
             "revenus : cela dépend des plateformes, de ta régularité et de tes idées. Ce guide te donne une méthode "
             "complète et des modèles concrets.</div></div>" % toc)
    intro = MODULES[0]
    p.append("<div class='chap'><div class='chap-head'><div class='k'>Introduction</div><h2>Avant de te lancer</h2>"
             "<p>%s</p></div>" % intro["intro"])
    for l in intro["lessons"]:
        p.append("<h3 class='sec'>%s</h3>%s" % (l["title"], l["body"]))
        if l["ex"]:
            p.append("<div class='todo'><b>À toi de jouer.</b> %s</div>" % l["ex"])
    p.append("</div>")
    for i, m in enumerate(chapters, 1):
        p.append("<div class='chap'><div class='chap-head'><div class='k'>Chapitre %d</div><h2>%s</h2><p>%s</p></div>"
                 % (i, m["title"], m["intro"]))
        for l in m["lessons"]:
            p.append("<h3 class='sec'>%s</h3>%s" % (l["title"], l["body"]))
            if l["ex"]:
                p.append("<div class='todo'><b>À toi de jouer.</b> %s</div>" % l["ex"])
        p.append("</div>")
    p.append("<div class='chap'><div class='chap-head'><div class='k'>Annexes</div><h2>Checklist, modèles et scripts</h2>"
             "<p>Les outils à garder sous la main pour chaque épisode.</p></div>")
    p.append("<h3 class='sec'>Checklist avant de publier</h3><ul class='check'>%s</ul>" % "".join("<li>%s</li>" % c for c in CHECKLIST))
    p.append("<h3 class='sec'>Ton plan de 30 jours, jour par jour</h3><table><tr><th>Jour</th><th>À faire</th></tr>%s</table>" % "".join(
        "<tr><td>%s</td><td>%s</td></tr>" % d for d in PLAN_30))
    p.append("<h3 class='sec'>Les 10 erreurs de débutant</h3><ol>%s</ol>" % "".join(
        "<li><b>%s.</b> %s</li>" % e for e in ERREURS))
    p.append("<h3 class='sec'>Fiche personnage</h3><table>%s</table>" % "".join(
        "<tr><th>%s</th><td class='blank'></td></tr>" % x for x in FICHE_PERSO))
    p.append("<h3 class='sec'>Modèle de script</h3><table>%s</table>" % "".join(
        "<tr><th>%s</th><td class='blank'></td></tr>" % x for x in MODELE_SCRIPT))
    p.append("<h3 class='sec'>%d scripts complets</h3><p>Les premiers épisodes de la série « Les galères de Gérard ». "
             "Reprends-les pour t'entraîner, ou adapte-les à ton propre personnage.</p>" % N_SCRIPTS)
    for sk in GERARD[:N_SCRIPTS]:
        p.append("<h4>%s : « %s »</h4><p class='script'>" % (sk["title"], html.escape(sk["hook_text"])))
        for ln in sk["lines"]:
            if ln[0].startswith("@"):
                p.append("<i>(%s)</i><br>" % ("l'autorité arrive" if ln[0] == "@ENTER" else "Gérard s'en va"))
                continue
            p.append("<b>%s</b> : %s<br>" % (ROLE[ln[0]], html.escape(ln[2].lstrip("§"))))
        p.append("</p>")
    if N_ETSI:
        p.append("<h3 class='sec'>%s</h3><p>Le format en voix off, pour varier avec des épisodes spéciaux.</p>" % (
            "Une histoire « Et si tu… » complète" if N_ETSI == 1 else "%d histoires « Et si tu… » complètes" % N_ETSI))
        for st in ETSI[:N_ETSI]:
            p.append("<h4>%s</h4><p class='script'>%s</p>" % (html.escape(st["title"]), "<br>".join(html.escape(b["text"]) for b in st["beats"])))
    p.append("<div class='note' style='margin-top:14pt'><b>Et maintenant ?</b> Choisis ton personnage, écris tes trois "
             "premiers scripts et publie ton premier épisode cette semaine. La régularité fera le reste.</div></div>")
    return p


def build(out_pdf):
    doc = ("<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>%s</title>"
           "<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Source+Sans+3:wght@400;600;700&display=swap'>"
           "<style>%s</style></head><body>%s</body></html>") % (TITLE, CSS.replace("__FS__", str(FONT_PT)), "".join(body_parts()))
    f_html = os.path.join(HERE, "_ebook.html")
    with open(f_html, "w") as fh:
        fh.write(doc)
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                    "--virtual-time-budget=5000", "--print-to-pdf=" + out_pdf, "file://" + f_html],
                   check=True, capture_output=True)
    os.remove(f_html)
    return out_pdf


if __name__ == "__main__":
    print(build(os.path.join(HERE, "studio-cartoon-ebook.pdf")))
