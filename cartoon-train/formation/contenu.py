# -*- coding: utf-8 -*-
"""Contenu de la formation « Studio Cartoon » : modules -> leçons (titre, corps HTML, exercice).

Une seule source pour la page de cours en ligne et pour le cahier PDF (voir build.py).
"""

TITLE = "Studio Cartoon"
SUBTITLE = "La formation complète pour créer des sketchs animés sur TikTok, YouTube Shorts et YouTube"


def L(title, body, ex=None):
    return dict(title=title, body=body, ex=ex)


MODULES = [
    dict(title="Bienvenue", intro="Comment suivre la formation et t'organiser pour publier ta première vidéo vite.", lessons=[
        L("Ce que tu vas construire", """
<p>À la fin de cette formation, tu auras :</p>
<ul>
<li><b>un personnage récurrent</b> avec son look, sa voix et son défaut ;</li>
<li><b>un kit visuel réutilisable</b> : personnages, décors, bouches, cartes de fin ;</li>
<li><b>une méthode d'écriture</b> qui te permet d'écrire un script de 40 secondes en 15 minutes ;</li>
<li><b>une routine de production</b> pour sortir une vidéo par jour sans y passer tes soirées ;</li>
<li><b>une première saison de 10 épisodes</b> prête à publier.</li>
</ul>
<p>La formation suit l'ordre réel de fabrication : idée, script, hook, visuels, voix, montage, publication, croissance.
Chaque leçon se termine par un exercice. Fais-les : c'est en produisant qu'on progresse, pas en lisant.</p>
""", "Écris en une phrase pourquoi tu veux faire ces vidéos (t'amuser, construire une audience, vendre plus tard…). Garde cette phrase : elle t'aidera à tenir pendant les semaines où les chiffres stagnent."),
        L("Le matériel nécessaire", """
<table>
<tr><th>Outil</th><th>À quoi il sert</th><th>Prix</th></tr>
<tr><td>Un téléphone récent ou un ordinateur</td><td>Tout le reste</td><td>—</td></tr>
<tr><td>CapCut</td><td>Montage, voix de synthèse, sous-titres automatiques</td><td>Version gratuite suffisante pour commencer</td></tr>
<tr><td>Canva</td><td>Décors, cartes de fin, couvertures, suppression d'arrière-plan</td><td>Gratuit, certaines fonctions payantes</td></tr>
<tr><td>Un générateur d'images IA (au choix)</td><td>Créer les personnages sans savoir dessiner</td><td>Souvent un quota gratuit</td></tr>
<tr><td>Un micro de casque (optionnel)</td><td>Enregistrer ta propre voix</td><td>Celui de tes écouteurs suffit</td></tr>
<tr><td>Un tableur ou une appli de notes</td><td>Ton carnet d'idées et ton planning</td><td>Gratuit</td></tr>
</table>
<div class="note">Les outils changent souvent de fonctions, de prix et de conditions. Avant de publier, vérifie que tu as le droit d'utiliser commercialement ce que tu génères (images, voix, musiques, polices).</div>
""", "Installe CapCut et Canva, crée un compte, et crée un dossier « Studio » sur ton téléphone ou ton ordinateur avec quatre sous-dossiers : Personnages, Décors, Voix, Vidéos."),
        L("Ton planning sur 30 jours", """
<table>
<tr><th>Semaine</th><th>Objectif</th><th>Modules</th></tr>
<tr><td>Semaine 1</td><td>Comprendre le format, trouver ton personnage, écrire 3 scripts</td><td>1 à 4</td></tr>
<tr><td>Semaine 2</td><td>Créer ton kit visuel et ta voix, monter ton premier épisode</td><td>5 à 7</td></tr>
<tr><td>Semaine 3</td><td>Produire 7 épisodes en série et commencer à publier</td><td>8 et 9</td></tr>
<tr><td>Semaine 4</td><td>Publier chaque jour, répondre aux commentaires, analyser</td><td>10</td></tr>
</table>
<p>Compte environ <b>1 heure par jour</b>. Le premier épisode prend plus de temps (2 à 4 heures) car tu crées ton kit.
Ensuite, un épisode prend 30 à 45 minutes.</p>
""", "Bloque dans ton agenda un créneau fixe d'une heure par jour pour les 30 prochains jours. Note-le maintenant."),
    ]),

    dict(title="Comprendre le format", intro="Pourquoi ces vidéos retiennent l'attention et comment elles sont construites.", lessons=[
        L("Pourquoi les sketchs animés fonctionnent", """
<p>Une vidéo courte doit faire trois choses : <b>arrêter le défilement</b>, <b>tenir jusqu'à la fin</b> et
<b>donner envie de réagir</b>. Le sketch animé coche les trois :</p>
<ul>
<li><b>Il se comprend sans le son</b> grâce aux sous-titres et aux expressions exagérées.</li>
<li><b>Il crée un conflit immédiat</b> : quelqu'un exige quelque chose d'absurde.</li>
<li><b>Il promet une récompense</b> : on veut voir l'exigeant remis à sa place.</li>
<li><b>Il touche au vécu</b> : tout le monde a croisé un client impossible, un voisin pénible, un collègue de mauvaise foi.</li>
</ul>
<p>L'animation a un autre avantage : pas besoin d'acteurs, de décor réel ni de te montrer. Et un personnage dessiné
peut être bien plus exagéré qu'un humain sans paraître méchant.</p>
""", "Fais défiler TikTok ou Shorts pendant 15 minutes et note 5 vidéos animées qui t'ont arrêté. Pour chacune, écris ce qui t'a arrêté dans les 2 premières secondes."),
        L("Les trois rôles", """
<table>
<tr><th>Rôle</th><th>Ce qu'il fait</th><th>Ce que ressent le spectateur</th></tr>
<tr><td><b>L'exigeant</b></td><td>Demande l'absurde avec une totale assurance</td><td>Agacement, envie qu'il perde</td></tr>
<tr><td><b>La victime</b></td><td>Reste calme et logique</td><td>Identification : « c'est moi »</td></tr>
<tr><td><b>L'autorité</b></td><td>Arrive avec une preuve et retourne la situation</td><td>Satisfaction, soulagement</td></tr>
</table>
<p>La clé est le <b>contraste</b> : plus l'exigeant est sûr de lui, plus la chute est satisfaisante. La victime ne doit
jamais crier : si elle s'énerve, le spectateur ne sait plus qui a raison.</p>
<p>L'autorité peut être un patron, un contrôleur, une hôtesse, un gardien, un chef cuisinier, un médecin… Ce qui compte,
c'est qu'elle apporte <b>une preuve concrète</b> : un registre, une affiche, une mesure, un ticket, une caméra.</p>
""", "Reprends une des vidéos notées à la leçon précédente et identifie qui joue l'exigeant, la victime et l'autorité. Si un rôle manque, explique comment la vidéo le remplace."),
        L("Les trois formats répétables", """
<h3>1. Le sketch dialogué</h3>
<p>Trois personnages, un lieu, une chute. C'est le format de base. Exemple : « Il interdit de rire au cinéma ».</p>
<h3>2. Le « Et si tu… »</h3>
<p>Une voix off raconte une situation imaginaire à la deuxième personne, avec un retournement final.
Exemple : « Et si tu entendais les pensées des gens ? ». Ce format fonctionne parce que la première phrase est une
question que le spectateur se pose aussitôt.</p>
<h3>3. La série à personnage</h3>
<p>Le même personnage revient dans chaque épisode, dans un lieu différent. Exemple : « Gérard · Épisode 4 ».
C'est le format qui donne le plus de raisons de s'abonner, car le spectateur veut voir la suite.</p>
<div class="note">Conseil : commence par la série à personnage. Les deux autres formats peuvent devenir des épisodes
spéciaux de ta série.</div>
""", "Choisis ton format principal pour les 30 prochains jours. Écris-le en haut de ton carnet."),
        L("Le personnage récurrent : ta meilleure arme pour les abonnés", """
<p>Beaucoup de créateurs publient des histoires toutes différentes et obtiennent des vues… mais presque aucun abonné.
La raison est simple : le spectateur regarde, rit, puis passe à la vidéo suivante. Rien ne l'incite à revenir.</p>
<p>Un personnage récurrent change tout : on s'y attache, on reconnaît sa voix, on attend sa prochaine bêtise.
L'abonnement devient le moyen de ne pas rater la suite.</p>
<h3>La fiche personnage</h3>
<table>
<tr><th>Élément</th><th>Exemple (Gérard)</th></tr>
<tr><td>Prénom simple et mémorable</td><td>Gérard</td></tr>
<tr><td>Un seul défaut, très clair</td><td>Il pense que le client est roi et que tout lui est dû</td></tr>
<tr><td>Une phrase fétiche</td><td>« Le client est roi ! »</td></tr>
<tr><td>Un look reconnaissable en miniature</td><td>Lunettes rondes, moustache, veste bleu marine</td></tr>
<tr><td>Une voix unique</td><td>Voix d'homme posée, un peu hautaine</td></tr>
<tr><td>Un ou deux personnages qui reviennent</td><td>Léa la barista, Karim le patron</td></tr>
</table>
""", "Remplis la fiche personnage pour ton héros. Si tu hésites entre deux défauts, garde le plus simple à expliquer en 5 mots."),
    ]),

    dict(title="Trouver des idées", intro="Ne plus jamais manquer d'idées, et savoir reconnaître une bonne idée avant de l'écrire.", lessons=[
        L("La formule en trois questions", """
<ol>
<li><b>Quelle est la demande absurde ?</b> (un café sans café, un banc réservé en 1998)</li>
<li><b>Quelle est la réponse logique de la victime ?</b> (« un café sans café, c'est de l'eau »)</li>
<li><b>Quelle preuve retourne la situation ?</b> (une affiche « Gérard : payez d'abord »)</li>
</ol>
<p>Si tu peux répondre aux trois en une ligne chacune, tu as un sketch. Si la troisième question bloque, l'idée n'est pas
encore prête : garde-la dans ton carnet.</p>
<h3>Le test des 5 mots</h3>
<p>Une bonne idée se résume en 5 mots ou moins : « Il veut le wifi gratuit », « Douze serviettes, zéro famille ».
Ces 5 mots deviennent souvent ton hook.</p>
""", "Écris 5 idées avec la formule en trois questions. Résume chacune en 5 mots maximum."),
        L("Les mines d'idées", """
<ul>
<li><b>Les lieux du quotidien</b> : café, bus, train, avion, supermarché, cinéma, restaurant, piscine, plage, salle d'attente, parc, salle de sport, bureau, école, ascenseur.</li>
<li><b>Les phrases toutes faites</b> : « le client est roi », « je connais le patron », « c'est pas moi », « j'étais là avant », « je paie, donc j'ai le droit ».</li>
<li><b>Les petites injustices</b> : la place réservée, le siège qui se penche, la file qu'on double, l'accoudoir volé.</li>
<li><b>Les objets</b> : un ticket, un coupon périmé, une carte de fidélité, un mouchoir, une serviette, un téléphone à 1 %.</li>
<li><b>Tes commentaires</b> : « il devrait aller chez le dentiste » = ton prochain épisode.</li>
</ul>
<h3>La méthode lieu × défaut</h3>
<p>Fais un tableau : les lieux en lignes, le défaut de ton personnage en colonne. Chaque case est une idée.
Avec 15 lieux, tu as 15 épisodes. Avec deux défauts, 30.</p>
""", "Fais ton tableau lieu × défaut avec au moins 10 lieux. Remplis chaque case avec une demande absurde."),
        L("Banque de 60 idées", """
<ul class="cols">
<li>Il veut le wifi gratuit à vie</li><li>Il « connaît le pilote »</li><li>Sa carte VIP est une carte de boulangerie</li>
<li>Il réserve 12 transats pour une famille invisible</li><li>La pomme est trop ronde, il veut un rabais</li><li>Le chef est « son ami »</li>
<li>Urgence médicale : il a faim</li><li>Il a réservé ce banc en 1998</li><li>La fin du film est triste, il veut être remboursé</li>
<li>Il fête son anniversaire tous les jours</li><li>Le plat est trop chaud, puis trop froid</li><li>L'eau de la piscine est mouillée</li>
<li>Il se dispute avec le GPS</li><li>Il veut un rabais sur le soleil</li><li>La mer est trop salée</li>
<li>Il paie en promesses</li><li>Il rend un yaourt vide</li><li>Il demande une table avec vue dans un sous-sol</li>
<li>Il refuse de descendre, c'est son arrêt préféré</li><li>Il commande un plat sans ingrédients</li><li>Il exige le silence dans une fête</li>
<li>Il réserve la salle de sport pour lui seul</li><li>Il veut l'autographe de son propre chien</li><li>Il rapporte un cadeau qu'il a offert</li>
<li>Il réclame une météo personnalisée</li><li>Il prend un taxi pour traverser la rue</li><li>Il refuse de payer « car c'est sa tournée »</li>
<li>Il veut que l'ascenseur aille plus vite pour lui</li><li>Il accuse ses genoux d'être trop longs</li><li>Il demande le menu enfant à 40 ans</li>
<li>Il veut être servi avant d'arriver</li><li>Il veut un rabais car il a souri</li><li>Il veut échanger un ticket de loto perdant</li>
<li>Il exige une place « côté soleil » dans le métro</li><li>Il se plaint que le livre a trop de pages</li><li>Il réclame le wifi dans l'avion… en vol</li>
<li>Il veut que le prof note plus vite</li><li>Il demande à la bibliothèque de lire à voix haute</li><li>Il fait la queue à l'envers</li>
<li>Il veut un remboursement car il a dormi</li><li>Il veut que le chien du voisin aboie moins fort</li><li>Il réclame le plat du voisin</li>
<li>Il veut que la caisse automatique lui parle</li><li>Il exige une serviette chauffée à la plage</li><li>Il veut que le film commence quand il arrive</li>
<li>Il conteste son propre ticket de caisse</li><li>Il veut payer avec une carte de cinéma</li><li>Il réserve un arbre au parc</li>
<li>Il veut la vitre ouverte et fermée en même temps</li><li>Il exige un taxi pour son chien</li><li>Il demande la clé du parc public</li>
<li>Il veut une réduction car il est « presque client »</li><li>Il veut une chambre sans murs</li><li>Il exige un siège près du pilote</li>
<li>Il conteste l'heure affichée</li><li>Il veut la monnaie en pièces de 2 €</li><li>Il réclame le droit de garder les bougies du gâteau</li>
<li>Il exige une place assise dans un concert debout</li><li>Il veut que la neige tombe ailleurs</li><li>Il veut annuler le lundi</li>
</ul>
""", "Choisis 10 idées de cette banque (ou de ton tableau) qui collent au défaut de ton personnage. Ce sera ta saison 1."),
        L("Tester une idée avant de l'écrire", """
<p>Avant de passer 30 minutes sur un script, pose ces cinq questions :</p>
<ol>
<li>Est-ce que je la résume en 5 mots ?</li>
<li>Est-ce que quelqu'un dans mon entourage a déjà vécu une situation proche ?</li>
<li>Est-ce que la preuve finale est visible à l'écran (un objet, une affiche, un chiffre) ?</li>
<li>Est-ce que la chute fait au moins sourire si je la raconte à voix haute ?</li>
<li>Est-ce que ça colle au défaut de mon personnage ?</li>
</ol>
<p>Quatre « oui » sur cinq : écris-la. Moins : garde-la pour plus tard.</p>
<p>Astuce : raconte l'idée à quelqu'un en une phrase. S'il demande « et alors, il se passe quoi ? », c'est bon signe.</p>
""", "Passe tes 10 idées de saison au test. Remplace celles qui ont moins de 4 oui."),
    ]),

    dict(title="Écrire le script", intro="La structure, les règles et la réécriture d'un script de 40 secondes.", lessons=[
        L("La structure en 7 temps", """
<table>
<tr><th>Temps</th><th>Moment</th><th>Ce qui se passe</th></tr>
<tr><td>1. Hook</td><td>0 – 2 s</td><td>Le conflit en une phrase, en gros à l'écran</td></tr>
<tr><td>2. Demande</td><td>2 – 6 s</td><td>L'exigeant formule l'absurde</td></tr>
<tr><td>3. Réponse</td><td>6 – 12 s</td><td>La victime répond calmement</td></tr>
<tr><td>4. Escalade</td><td>12 – 20 s</td><td>L'exigeant insiste, encore plus absurde</td></tr>
<tr><td>5. Appel à s'abonner</td><td>vers 20 s</td><td>Une réplique face caméra : « Abonne-toi, la suite va le faire taire »</td></tr>
<tr><td>6. Preuve</td><td>20 – 35 s</td><td>L'autorité arrive et retourne la situation</td></tr>
<tr><td>7. Chute et teaser</td><td>35 – 42 s</td><td>L'exigeant perd ; annonce de l'épisode suivant</td></tr>
</table>
<p>En pratique : 12 à 14 répliques, environ 110 à 140 mots en tout.</p>
""", "Prends ta meilleure idée et écris une phrase pour chacun des 7 temps, sans soigner le style."),
        L("Les règles d'écriture", """
<ul>
<li><b>12 mots maximum par réplique.</b> Les sous-titres doivent se lire d'un coup d'œil.</li>
<li><b>Une seule idée par réplique.</b> Si tu as deux blagues, fais deux répliques.</li>
<li><b>La victime ne s'énerve jamais.</b> Son calme rend l'exigeant encore plus ridicule.</li>
<li><b>L'exigeant ne doute jamais.</b> Même quand il perd, il trouve une excuse absurde.</li>
<li><b>La preuve doit être concrète</b> : un chiffre, un objet, un document.</li>
<li><b>Écris pour l'oreille</b> : lis chaque réplique à voix haute. Si tu butes, simplifie.</li>
<li><b>Écris les nombres en lettres</b> si tu utilises une voix de synthèse (« quarante et une fois »).</li>
</ul>
""", "Applique les 7 règles à ton script de la leçon précédente. Compte les mots de chaque réplique."),
        L("La chute et la preuve", """
<p>La chute est la raison pour laquelle le spectateur reste. Les meilleures chutes suivent un de ces schémas :</p>
<table>
<tr><th>Schéma</th><th>Exemple</th></tr>
<tr><td><b>La preuve chiffrée</b></td><td>« Vous êtes venu quarante et une fois cette année pour votre anniversaire. »</td></tr>
<tr><td><b>Le retournement d'identité</b></td><td>« Le pilote, c'est moi. Et je vous ai bloqué dans le jeu. »</td></tr>
<tr><td><b>La conséquence logique</b></td><td>« La pomme est gratuite. Mais vous êtes interdit de rayon fruits. »</td></tr>
<tr><td><b>Le retour à l'envoyeur</b></td><td>« Le contrôle qualité, c'est huit euros. Plus le pourboire. »</td></tr>
<tr><td><b>La rechute</b></td><td>Il devient poli… puis redemande un majordome.</td></tr>
</table>
<p>Termine toujours par une réaction courte et absurde de l'exigeant (« Mes genoux sont humiliés ! ») : c'est souvent la
réplique la plus partagée.</p>
""", "Écris trois chutes différentes pour le même script, avec trois schémas différents. Garde la plus surprenante."),
        L("Le teaser de fin", """
<p>La dernière réplique sert à faire revenir le spectateur. Elle annonce l'épisode suivant :</p>
<ul>
<li>« Demain, Gérard prend l'avion. Suis-le pour l'épisode deux ! »</li>
<li>« La semaine prochaine, il découvre la salle de sport. »</li>
<li>« Épisode suivant : il a un plan pour ne plus jamais payer. »</li>
</ul>
<p>Ne promets jamais une suite que tu ne publieras pas. Un spectateur déçu ne revient pas.</p>
""", "Écris le teaser des 10 épisodes de ta saison, en enchaînant les lieux."),
        L("Réécrire en trois passes", """
<ol>
<li><b>Passe « couper »</b> : supprime tout ce qui n'aide ni la montée ni la chute. Vise 20 % de mots en moins.</li>
<li><b>Passe « contraste »</b> : rends l'exigeant plus sûr de lui et la victime plus calme.</li>
<li><b>Passe « oreille »</b> : lis tout à voix haute avec un chronomètre. Au-dessus de 45 secondes, coupe encore.</li>
</ol>
<h3>Avant / après</h3>
<p class="script"><b>Avant</b> : « Bonjour madame, est-ce que vous pourriez éventuellement me donner un café, parce que
c'est mon anniversaire aujourd'hui, donc normalement ça devrait être gratuit, non ? »<br>
<b>Après</b> : « Bonjour. C'est mon anniversaire. Donc le café est gratuit. »</p>
""", "Fais les trois passes sur ton script et chronomètre-le."),
        L("Trois scripts commentés", """
<h3>Le café (épisode 1)</h3>
<p class="script"><b>Gérard</b> : Bonjour. C'est mon anniversaire. Donc le café est gratuit. <i>(demande)</i><br>
<b>Léa</b> : Joyeux anniversaire monsieur. Ça fait deux euros. <i>(réponse calme)</i><br>
<b>Gérard</b> : Les rois ne paient pas leur anniversaire. <i>(escalade)</i><br>
<b>Léa</b> : Vous êtes déjà venu hier pour votre anniversaire.<br>
<b>Gérard</b> : Hier, c'était mon demi-anniversaire. <i>(excuse absurde)</i><br>
<b>Le patron</b> : Vous êtes venu quarante et une fois cette année pour le fêter. On a une affiche. <i>(preuve chiffrée)</i></p>
<h3>L'avion (épisode 2)</h3>
<p class="script"><b>Gérard</b> : Madame, je veux votre place. Je connais le pilote.<br>
<b>Voisine</b> : Votre ami ne sait même pas que vous existez.<br>
<b>Gérard</b> : Si ! On joue ensemble en ligne depuis dix ans.<br>
<b>Hôtesse</b> : Le pilote, c'est moi. Vous m'avez écrit quarante messages dans le jeu. Je vous ai bloqué. <i>(retournement d'identité)</i></p>
<h3>Le supermarché (épisode 5)</h3>
<p class="script"><b>Gérard</b> : Cette pomme est trop ronde. Je veux un rabais.<br>
<b>Caissier</b> : Vous voulez payer moins cher parce qu'elle est parfaite ?<br>
<b>Gérard</b> : Exactement. La perfection, ça se négocie.<br>
<b>Vigile</b> : La semaine dernière, vous vouliez un rabais parce qu'elle était cabossée. <i>(preuve par le passé)</i></p>
""", "Annote ton propre script de la même manière : écris en italique le rôle de chaque réplique."),
    ]),

    dict(title="Les hooks", intro="Gagner les deux premières secondes, celles qui décident de tout.", lessons=[
        L("Pourquoi les deux premières secondes comptent", """
<p>Sur TikTok et Shorts, le spectateur décide en un instant s'il reste. Si la première image ne crée pas de question,
il fait défiler. L'algorithme mesure ce comportement : une vidéo quittée tout de suite est montrée à moins de monde.</p>
<p>Le hook doit donc être :</p>
<ul>
<li><b>lisible sans le son</b> (beaucoup regardent en silencieux) ;</li>
<li><b>visible dès la première image</b>, pas après une intro ;</li>
<li><b>une question ouverte</b> dans la tête du spectateur.</li>
</ul>
""", "Regarde les 5 premières secondes de tes 3 vidéos préférées sans le son. Note ce que tu comprends."),
        L("12 formules de hook", """
<ol>
<li><b>La demande absurde</b> : « Il veut un café sans café »</li>
<li><b>Le chiffre</b> : « 4 heures. 1 verre d'eau. »</li>
<li><b>Le « Et si… »</b> : « Et si tu voyais un chiffre sur chaque tête ? »</li>
<li><b>La répétition</b> : « Son anniversaire. Encore. »</li>
<li><b>La contradiction</b> : « Il se croit vieux. Il a 26 ans. »</li>
<li><b>Le secret</b> : « Ton chat pense à ça »</li>
<li><b>La promesse de chute</b> : « Regarde la fin »</li>
<li><b>La question directe</b> : « Tu aurais fait quoi ? »</li>
<li><b>L'objet improbable</b> : « Douze serviettes, zéro famille »</li>
<li><b>Le défi</b> : « Personne ne tient jusqu'à la fin sans rire »</li>
<li><b>L'épisode</b> : « Gérard · Épisode 4 : la piscine »</li>
<li><b>La citation</b> : « “Le client est roi.” Pas ici. »</li>
</ol>
""", "Écris 3 hooks différents pour chacun de tes 3 premiers scripts, avec 3 formules différentes."),
        L("Le texte à l'écran", """
<ul>
<li><b>6 mots maximum</b>, en gros, au centre de l'écran.</li>
<li><b>Contraste fort</b> : noir sur jaune, ou blanc sur fond sombre avec contour.</li>
<li><b>Légèrement penché</b> (2 à 4°) pour un effet « sticker » qui attire l'œil.</li>
<li><b>Affiché pendant toute la première réplique</b>, puis il disparaît.</li>
<li><b>Hors des zones masquées</b> par l'interface (évite le bas de l'écran et le bord droit).</li>
</ul>
""", "Crée dans Canva un modèle de bandeau de hook à ton style (couleurs, police) que tu réutiliseras à chaque épisode."),
        L("Tester ses hooks", """
<p>Tu ne sauras jamais à l'avance quel hook marche le mieux. Teste :</p>
<ul>
<li>Publie deux épisodes de même qualité avec deux formules de hook différentes et compare la rétention des 3 premières secondes.</li>
<li>Republie une vidéo qui a fait peu de vues quelques semaines plus tard avec un hook différent.</li>
<li>Note chaque résultat dans ton tableau : formule, vues, pourcentage de spectateurs restés après 3 secondes.</li>
</ul>
<p>Au bout de 10 vidéos, tu sauras quelles formules marchent pour ton audience.</p>
""", "Ajoute à ton tableur une colonne « formule de hook » et une colonne « rétention à 3 s »."),
    ]),

    dict(title="Créer ton univers visuel", intro="Un kit de personnages et de décors créé une fois, réutilisé à chaque épisode.", lessons=[
        L("Choisir un style simple", """
<p>Le style le plus efficace pour ce format : <b>cartoon plat</b>, contours noirs épais, grosses têtes rondes, grands
yeux, couleurs franches, très peu de détails.</p>
<ul>
<li>Il se lit bien en petit, sur un écran de téléphone.</li>
<li>Il est facile à garder cohérent d'un épisode à l'autre.</li>
<li>Les expressions (sourcils, bouche) se voient immédiatement.</li>
</ul>
<p>Évite les styles réalistes ou très détaillés : ils demandent beaucoup plus de travail et se lisent moins bien.</p>
""", "Rassemble 5 images de référence qui représentent le style que tu vises. Range-les dans le dossier Personnages."),
        L("Créer ton personnage principal", """
<p>Avec un générateur d'images, garde <b>exactement la même description</b> à chaque génération. Exemple de description :</p>
<p class="script">cartoon flat style, thick black outline, simple shapes, big round head, big round eyes, a middle-aged man
with round glasses and a brown moustache, navy blue blazer over a white shirt, dark trousers, standing, full body,
front view, plain white background</p>
<ul>
<li>Génère plusieurs versions et garde celle qui se reconnaît le mieux en miniature.</li>
<li>Génère ensuite le <b>même personnage</b> avec plusieurs expressions : neutre, content, énervé, choqué, triste.</li>
<li>Note la description finale dans ta fiche personnage : c'est ta « recette ».</li>
</ul>
<div class="note">Les générateurs ne gardent pas toujours un personnage identique d'une image à l'autre. Si c'est le cas,
garde une seule image de base et crée les expressions en modifiant uniquement les yeux et la bouche (voir la leçon sur les bouches).</div>
""", "Génère ton personnage principal et ses 5 expressions. Garde-les avec un fond blanc uni."),
        L("Les seconds rôles", """
<p>Il te faut 3 à 5 seconds rôles aux silhouettes bien différentes : une barista, un patron, une hôtesse, un contrôleur,
un serveur. Variations à jouer : couleur de peau, coiffure, couleur de vêtement, accessoire (casquette, lunettes, plateau).</p>
<p>Astuce : un même second rôle peut changer de métier en changeant juste son haut et son accessoire. Tu gagnes du temps
et tu gardes un style cohérent.</p>
""", "Crée 3 seconds rôles avec la même recette de style que ton héros."),
        L("Les décors", """
<p>Un décor de sketch n'a besoin que de 3 couches :</p>
<ol>
<li><b>Le mur</b> (une couleur, quelques éléments : un tableau, une fenêtre, une étagère) ;</li>
<li><b>Le sol</b> (parquet, carrelage, moquette) avec une ligne d'horizon nette ;</li>
<li><b>Un élément de premier plan</b> qui situe le lieu : un comptoir, un siège de bus, une table, une caisse.</li>
</ol>
<p>Crée tes décors au format 1080 × 1920 dans Canva avec des formes simples, ou génère-les avec la même recette de style
(« empty room, no people »). Garde le premier plan sur un calque séparé pour pouvoir placer les personnages derrière.</p>
<table><tr><th>Lieu</th><th>Mur</th><th>Premier plan</th></tr>
<tr><td>Café</td><td>Vert foncé, menu ardoise, lampes</td><td>Comptoir, machine à café</td></tr>
<tr><td>Bus</td><td>Fenêtres, barres jaunes</td><td>Siège bleu</td></tr>
<tr><td>Cinéma</td><td>Rideaux rouges, affiches</td><td>Fauteuils rouges</td></tr>
<tr><td>Supermarché</td><td>Rayons colorés</td><td>Caisse, tapis</td></tr>
<tr><td>Avion</td><td>Hublots</td><td>Siège, tablette</td></tr></table>
""", "Crée 3 décors : le lieu de ton épisode 1 et deux lieux que tu réutiliseras souvent."),
        L("Découper et organiser ton kit", """
<ul>
<li>Supprime l'arrière-plan de chaque personnage (outil de suppression d'arrière-plan de Canva ou CapCut) et exporte en PNG transparent.</li>
<li>Nomme les fichiers clairement : <code>gerard_enerve.png</code>, <code>lea_neutre.png</code>, <code>decor_cafe.png</code>.</li>
<li>Range tout dans ton dossier Studio. Un kit bien rangé te fait gagner 10 minutes par épisode.</li>
</ul>
""", "Découpe et renomme tout ton kit actuel."),
        L("Les bouches pour faire parler", """
<p>Pour qu'un personnage ait l'air de parler, il suffit d'alterner <b>deux ou trois formes de bouche</b> :</p>
<ol><li>fermée (un trait) ;</li><li>mi-ouverte (un petit ovale) ;</li><li>ouverte (un grand ovale sombre).</li></ol>
<p>Dessine-les dans Canva (formes simples), à la couleur de ton style, et exporte-les en PNG transparent.
Au montage, tu poses la bouche par-dessus le visage et tu alternes ouverte / fermée pendant que le personnage parle.</p>
<p>Option plus simple : utilise une image « bouche ouverte » et une image « bouche fermée » du personnage entier et alterne-les.</p>
""", "Crée tes 3 formes de bouche et vérifie qu'elles collent bien au visage de ton héros."),
    ]),

    dict(title="La voix et le son", intro="Donner une voix à chaque personnage et un son qui rythme la vidéo.", lessons=[
        L("La voix de synthèse dans CapCut", """
<ol>
<li>Ajoute un texte avec la réplique.</li>
<li>Sélectionne-le, puis choisis l'option de texte en parole (le nom peut varier selon la version).</li>
<li>Choisis une voix française et applique.</li>
<li>Supprime ou masque le texte si tu ajoutes les sous-titres automatiques plus tard.</li>
</ol>
<ul>
<li>Fais <b>une réplique à la fois</b> : c'est plus naturel et plus facile à caler.</li>
<li>Ajoute des <b>virgules</b> pour créer des pauses.</li>
<li>Écris les <b>nombres en lettres</b>, évite les sigles.</li>
<li>Accélère légèrement (1,05× à 1,15×) si la voix traîne.</li>
</ul>
""", "Génère toutes les répliques de ton script d'épisode 1 en voix de synthèse."),
        L("Une voix par personnage", """
<p>Les spectateurs reconnaissent un personnage à sa voix. Choisis <b>une voix par personnage</b> et note-la dans sa fiche.
Ne change jamais la voix de ton héros, même si une nouvelle voix semble meilleure.</p>
<table><tr><th>Personnage</th><th>Type de voix</th></tr>
<tr><td>Héros exigeant</td><td>Voix posée, un peu hautaine</td></tr>
<tr><td>Victime</td><td>Voix douce, calme</td></tr>
<tr><td>Autorité</td><td>Voix ferme, plus grave ou plus sèche</td></tr></table>
""", "Choisis et note la voix de chacun de tes personnages."),
        L("Enregistrer ta propre voix", """
<ul>
<li>Enregistre dans une petite pièce pleine de tissus (placard, chambre), loin des murs nus : moins d'écho.</li>
<li>Tiens le micro à une main de ta bouche, légèrement de côté.</li>
<li>Fais 2 ou 3 prises de chaque réplique et garde la meilleure.</li>
<li>Change ta voix pour chaque personnage : plus grave, plus aiguë, plus lente, avec un tic.</li>
<li>Dans CapCut, utilise la réduction de bruit si l'option est disponible.</li>
</ul>
<p>Ta propre voix rend les vidéos plus authentiques. Tu peux aussi mélanger : ta voix pour le héros, la synthèse pour les autres.</p>
""", "Enregistre ta voix sur 3 répliques et compare avec la version synthèse. Garde ce qui sonne le plus naturel."),
        L("Ambiance et effets sonores", """
<ul>
<li><b>Ambiance</b> : un fond très léger qui situe le lieu (murmure de café, moteur de bus, salle de cinéma).</li>
<li><b>Pas</b> quand un personnage entre ou sort.</li>
<li><b>« Ding »</b> au moment de l'appel à s'abonner.</li>
<li><b>Petit « boum »</b> sur le hook à la première image.</li>
<li><b>Silence</b> juste avant la chute : il crée la tension.</li>
</ul>
<div class="note">Utilise uniquement des sons et musiques libres de droits ou fournis par la plateforme. Une musique protégée peut faire bloquer ta vidéo.</div>
""", "Rassemble 5 sons de base dans ton dossier Voix : ambiance café, pas, ding, boum, ambiance extérieure."),
        L("Régler les volumes", """
<table><tr><th>Piste</th><th>Volume conseillé</th></tr>
<tr><td>Voix</td><td>100 %</td></tr>
<tr><td>Effets (pas, ding)</td><td>40 à 60 %</td></tr>
<tr><td>Ambiance</td><td>10 à 20 %</td></tr>
<tr><td>Musique (si tu en mets)</td><td>5 à 15 %</td></tr></table>
<p>Écoute toujours le résultat au casque <b>et</b> sur le haut-parleur du téléphone : c'est ainsi que la plupart des gens l'entendront.</p>
""", "Monte un essai de 10 secondes avec voix, ambiance et un effet, et vérifie l'équilibre sur ton téléphone."),
    ]),

    dict(title="Animer et monter dans CapCut", intro="De ton kit à la vidéo finie, étape par étape.", lessons=[
        L("Préparer le projet", """
<ul>
<li>Nouveau projet au format <b>9:16</b>.</li>
<li>Pose le décor sur toute la durée.</li>
<li>Importe toutes les voix et place-les dans l'ordre, avec une petite pause (0,2 à 0,3 s) entre les répliques.</li>
<li>La durée totale de la vidéo est maintenant fixée par les voix : vise 35 à 45 secondes.</li>
</ul>
""", "Crée le projet de ton épisode 1 avec le décor et toutes les voix en place."),
        L("Placer et animer les personnages", """
<ul>
<li>Ajoute chaque personnage en superposition (incrustation).</li>
<li>Place-les sur la ligne du sol, à la même échelle.</li>
<li>Ajoute de petites animations avec les images clés : léger rebond quand un personnage parle, glissement pour une entrée.</li>
<li>Change l'image du personnage selon l'émotion de la réplique (neutre, énervé, choqué).</li>
<li>Fais entrer l'autorité depuis le bord de l'écran en 1 à 1,5 seconde.</li>
</ul>
<p>Garde les mouvements simples : un personnage qui bouge un peu paraît vivant ; un personnage qui bouge trop fatigue l'œil.</p>
""", "Anime l'entrée de l'autorité et trois changements d'expression dans ton épisode 1."),
        L("Faire parler les personnages", """
<p>Sur chaque réplique, alterne bouche ouverte et bouche fermée en suivant la voix : environ 3 à 5 changements par
seconde. Inutile d'être parfait : l'œil accepte très bien une synchronisation approximative.</p>
<p>Astuce de gain de temps : crée une séquence « bouche qui parle » de 2 secondes (ouverte, fermée, mi-ouverte en boucle),
puis copie-colle-la sur la durée de chaque réplique.</p>
""", "Fais parler tes personnages sur toutes les répliques de l'épisode 1."),
        L("Les plans et les zooms", """
<ul>
<li><b>Plan large</b> au début : on voit qui est là.</li>
<li><b>Léger zoom</b> (5 à 10 %) sur celui qui parle, pour guider le regard.</li>
<li><b>Gros plan</b> sur l'exigeant pour sa réaction finale.</li>
<li>Un zoom par réplique maximum : trop de mouvements donnent mal au cœur.</li>
</ul>
""", "Ajoute un léger zoom sur le personnage qui parle à chaque réplique importante."),
        L("Les sous-titres", """
<ul>
<li>Utilise les <b>sous-titres automatiques</b>, puis corrige les fautes à la main.</li>
<li>Police épaisse, grande taille, contour noir.</li>
<li>Un mot en couleur pour l'accent, ou une couleur par personnage.</li>
<li>Place-les au-dessus du tiers inférieur, hors des boutons de l'application.</li>
<li>Deux lignes maximum à l'écran à la fois.</li>
</ul>
""", "Ajoute et corrige les sous-titres de ton épisode 1."),
        L("Le hook, l'appel au milieu et la carte de fin", """
<ul>
<li><b>Le hook</b> : ton bandeau Canva en gros, de la première image jusqu'à la fin de la première réplique.</li>
<li><b>L'appel au milieu</b> : vers 45 % de la vidéo, un bandeau « Abonne-toi » avec un bouton et une main qui clique, accompagné d'un « ding ».</li>
<li><b>La carte de fin</b> : « Suis [ton personnage] ! » + « Épisode suivant demain », sur les 2 à 3 dernières secondes.</li>
</ul>
<p>Prépare ces trois éléments une seule fois dans Canva, avec ton style, et réutilise-les à chaque épisode.</p>
""", "Crée ta carte de fin et ton bandeau d'appel au milieu dans Canva, puis ajoute-les à l'épisode 1."),
        L("Exporter", """
<ul>
<li>Résolution <b>1080p</b>, 30 images par seconde (ou 60 si ton téléphone le permet).</li>
<li>Regarde toute la vidéo une dernière fois, en entier, sur ton téléphone.</li>
<li>Vérifie : le hook se lit, les sous-titres sont justes, le son est équilibré, la fin n'est pas coupée.</li>
<li>Range l'export dans ton dossier Vidéos avec un nom clair : <code>ep01_anniversaire.mp4</code>.</li>
</ul>
""", "Exporte ton épisode 1. Félicitations : tu as fini ta première vidéo."),
    ]),

    dict(title="Produire en série", intro="Passer d'une vidéo laborieuse à une vidéo par jour.", lessons=[
        L("Le principe du lot", """
<p>Faire chaque étape pour plusieurs vidéos d'un coup est bien plus rapide que de faire chaque vidéo de A à Z :</p>
<table><tr><th>Jour</th><th>Tâche</th><th>Durée</th></tr>
<tr><td>Lundi</td><td>Écrire 7 scripts</td><td>1 h 30</td></tr>
<tr><td>Mardi</td><td>Générer toutes les voix</td><td>45 min</td></tr>
<tr><td>Mercredi à vendredi</td><td>Monter 2 à 3 épisodes par jour</td><td>1 h par jour</td></tr>
<tr><td>Samedi</td><td>Programmer les publications de la semaine</td><td>30 min</td></tr></table>
<p>Ton cerveau reste dans le même mode (écrire, enregistrer, monter) et tu ne perds pas de temps à changer d'outil.</p>
""", "Planifie ta prochaine semaine en lots selon ce tableau."),
        L("Ton projet modèle", """
<p>Dans CapCut, garde un projet « MODÈLE » qui contient déjà :</p>
<ul><li>le format 9:16 ;</li><li>ton bandeau de hook (texte à changer) ;</li><li>l'appel au milieu ;</li>
<li>la carte de fin ;</li><li>ton style de sous-titres ;</li><li>l'ambiance sonore.</li></ul>
<p>Pour chaque nouvel épisode : duplique le modèle, change le décor, remplace les voix, place les personnages.
Tu ne refais jamais le travail de mise en forme.</p>
""", "Transforme ton épisode 1 en projet modèle en retirant tout ce qui est spécifique à l'épisode."),
        L("Écrire 7 scripts en une séance", """
<ol>
<li>Pars de 7 idées validées (module 2).</li>
<li>Écris d'abord les 7 squelettes en 7 temps (une phrase par temps).</li>
<li>Puis rédige les 7 dialogues complets.</li>
<li>Fais ensuite les trois passes de réécriture sur les 7 à la suite.</li>
<li>Termine par les 7 hooks et les 7 teasers, qui doivent s'enchaîner.</li>
</ol>
<p>Tu peux t'aider d'un assistant d'IA pour proposer des variantes de répliques, mais garde toujours la main sur le défaut
du personnage et sur la chute : c'est ce qui donne son identité à ta série.</p>
""", "Écris tes 7 prochains scripts en une seule séance de 1 h 30."),
        L("Gagner du temps sans perdre en qualité", """
<ul>
<li>Réutilise les mêmes décors : 5 lieux suffisent pour une saison.</li>
<li>Réutilise les mêmes seconds rôles avec un accessoire différent.</li>
<li>Garde une bibliothèque d'expressions déjà découpées.</li>
<li>Utilise les sous-titres automatiques, puis corrige seulement les fautes.</li>
<li>Ne cherche pas la perfection : publie, observe, améliore l'épisode suivant.</li>
</ul>
""", "Chronomètre ton prochain épisode et note le temps passé par étape. Identifie l'étape la plus longue."),
    ]),

    dict(title="Publier", intro="Mettre chaque vidéo dans les meilleures conditions.", lessons=[
        L("Quand publier", """
<ul>
<li><b>Tous les jours, à la même heure.</b> La régularité compte plus que l'heure exacte.</li>
<li>Commence par le début de soirée (18 h – 20 h), puis ajuste avec tes statistiques (heures où ton audience est active).</li>
<li>Publie au moins 3 à 4 semaines avant de juger tes résultats.</li>
</ul>
""", "Choisis ton heure de publication et note-la dans ta bio."),
        L("Légende et hashtags", """
<p><b>La légende</b> : une phrase drôle + l'annonce de la suite.<br>
<i>« Épisode 1 : Gérard fête son anniversaire. Pour la 41e fois. Demain : il prend l'avion. »</i></p>
<p><b>Les hashtags</b> : 3 à 5, dont un propre à ta série (<code>#gerard</code>), un ou deux du thème
(<code>#humour</code>, <code>#sketch</code>) et un ou deux larges (<code>#animation</code>).</p>
<p><b>Le commentaire épinglé</b> : une question qui fait réagir (« Il va où demain ? »).</p>
""", "Prépare les légendes et commentaires épinglés de tes 7 prochains épisodes."),
        L("Couvertures et miniatures", """
<ul>
<li><b>TikTok</b> : choisis une couverture avec ton personnage bien visible et le titre de l'épisode. Les couvertures alignées sur ton profil donnent une impression de série.</li>
<li><b>YouTube</b> : pour une vidéo longue, crée une miniature 1280 × 720 avec le personnage en gros, une émotion forte et 3 à 5 mots.</li>
<li>Garde la même mise en page pour toutes les couvertures d'une saison.</li>
</ul>
""", "Crée un modèle de couverture dans Canva pour ta série."),
        L("Publier sur plusieurs plateformes", """
<p>La même vidéo verticale peut aller sur TikTok, YouTube Shorts et Instagram Reels. Quelques règles :</p>
<ul>
<li>Exporte une version <b>sans filigrane</b> (le fichier original de CapCut) pour les autres plateformes.</li>
<li>Adapte la légende et les hashtags à chaque plateforme.</li>
<li>Regroupe tes épisodes en compilation pour une vidéo YouTube longue (« Gérard, saison 1 en entier »).</li>
</ul>
""", "Publie ton épisode 1 sur au moins deux plateformes."),
    ]),

    dict(title="Grandir", intro="Transformer des vues en abonnés, puis en communauté.", lessons=[
        L("Ton profil : la page qui décide de l'abonnement", """
<p>Quand une vidéo plaît, le spectateur va voir ton profil. En trois secondes, il doit comprendre ce qu'il gagne à s'abonner.</p>
<ul>
<li><b>Photo de profil</b> : ton personnage, en gros plan.</li>
<li><b>Bio</b> : qui est ton personnage + ton rythme. Exemple : « Gérard, le client qui exige tout. 1 épisode par jour, 18 h 30. »</li>
<li><b>Vidéos épinglées</b> : tes épisodes 1, 2 et 3 (ou tes 3 meilleurs).</li>
<li><b>Grille cohérente</b> : couvertures dans le même style.</li>
</ul>
""", "Refais ta photo de profil, ta bio et tes épingles selon ces règles."),
        L("Les commentaires", """
<ul>
<li>Réponds à <b>tous</b> les commentaires dans l'heure qui suit la publication.</li>
<li>Réponds en restant dans l'univers (tu peux même répondre « en tant que » ton personnage).</li>
<li>Transforme les meilleures suggestions en épisodes et dis-le (« Idée de @… ! »).</li>
<li>Utilise la réponse vidéo à un commentaire pour faire un épisode demandé par un abonné.</li>
</ul>
""", "Pendant une semaine, réponds à chaque commentaire dans l'heure et note les idées proposées."),
        L("Saisons, épisodes spéciaux et suite", """
<ul>
<li><b>Saisons de 10 épisodes</b> : un début, une montée, une finale. La finale annonce la saison suivante.</li>
<li><b>Épisodes spéciaux</b> : Noël, rentrée, vacances, en lien avec l'actualité légère.</li>
<li><b>Nouveaux personnages</b> : fais revenir les seconds rôles préférés des commentaires.</li>
<li><b>Fils rouges</b> : une affiche « Gérard : payez d'abord » qui apparaît dans plusieurs lieux récompense les fidèles.</li>
</ul>
""", "Écris le pitch de ta saison 2 en 5 lignes."),
        L("Lire tes statistiques", """
<table>
<tr><th>Ce que tu vois</th><th>Ce que ça veut dire</th><th>Que faire</th></tr>
<tr><td>Peu de vues</td><td>Le hook ou la couverture ne retient pas</td><td>Change la première phrase et le texte à l'écran</td></tr>
<tr><td>Les gens partent à mi-vidéo</td><td>La montée est trop lente</td><td>Coupe une ou deux répliques</td></tr>
<tr><td>Beaucoup de vues, peu d'abonnés</td><td>Rien ne donne envie de revenir</td><td>Personnage récurrent, épisodes numérotés, teaser</td></tr>
<tr><td>Beaucoup de partages</td><td>Le sujet touche un vécu commun</td><td>Fais d'autres épisodes sur ce thème</td></tr>
<tr><td>Beaucoup de commentaires</td><td>Le sujet fait débattre</td><td>Pose une question en fin de vidéo</td></tr>
</table>
<p>Analyse une fois par semaine, pas tous les jours : les chiffres d'une seule vidéo varient beaucoup.</p>
""", "Tous les dimanches, note dans ton tableur les vues, la durée moyenne regardée et les abonnés gagnés par vidéo."),
        L("Quand ça stagne", """
<p>Tout le monde passe par des semaines où rien ne décolle. Avant de tout changer :</p>
<ol>
<li>Vérifie que tu publies vraiment chaque jour, à heure fixe.</li>
<li>Compare tes 3 meilleures et tes 3 pires vidéos : hook, lieu, durée, chute.</li>
<li>Change <b>une seule chose</b> à la fois (le hook, la durée, l'heure) pendant une semaine.</li>
<li>Garde ton personnage : il faut du temps pour qu'une audience s'y attache.</li>
</ol>
""", "Fais la comparaison meilleures / pires vidéos et choisis une seule chose à changer la semaine prochaine."),
    ]),

    dict(title="Monétiser", intro="Les pistes réalistes pour gagner de l'argent avec ta chaîne, sans promesses magiques.", lessons=[
        L("Les programmes des plateformes", """
<p>TikTok, YouTube et Instagram ont des programmes de rémunération des créateurs. Ils ont tous des <b>conditions
d'accès</b> (nombre d'abonnés, vues ou heures de visionnage minimum, âge, pays) qui changent régulièrement.
Vérifie les conditions officielles à jour sur chaque plateforme.</p>
<p>Sois réaliste : les revenus par vue sont faibles pour les vidéos courtes. Ces programmes complètent tes revenus mais suffisent rarement seuls.</p>
""", "Note les conditions actuelles des programmes créateurs des plateformes où tu publies."),
        L("Les partenariats", """
<ul>
<li>Les marques cherchent des formats originaux : un sketch où ton personnage utilise un produit peut être drôle et efficace.</li>
<li>Prépare un petit dossier : ton personnage, ton audience, tes chiffres réels, deux idées de sketch pour la marque.</li>
<li>Indique toujours clairement qu'un contenu est sponsorisé : c'est une obligation légale dans la plupart des pays.</li>
</ul>
""", "Liste 5 marques dont les produits pourraient apparaître naturellement dans un épisode."),
        L("Vendre tes propres produits", """
<ul>
<li><b>Produits numériques</b> : packs de personnages, modèles CapCut, scripts, formations.</li>
<li><b>Produits physiques</b> : autocollants, tasses, t-shirts avec ton personnage et sa phrase fétiche.</li>
<li><b>Services</b> : créer des sketchs animés pour d'autres (commerces, marques, créateurs).</li>
</ul>
<div class="note">Ne promets jamais un résultat (abonnés, revenus) que tu ne peux pas garantir. C'est malhonnête, souvent
illégal, et ta communauté s'en rendra compte.</div>
""", "Imagine un produit simple lié à ton personnage et décris-le en 3 lignes."),
    ]),
]

CHECKLIST = [
    "Le hook se lit en 2 secondes, sans le son",
    "12 mots maximum par réplique",
    "La victime reste calme",
    "Une preuve concrète retourne la situation",
    "L'appel à s'abonner arrive vers 45 % de la vidéo",
    "La fin annonce l'épisode suivant",
    "Les sous-titres sont corrigés et lisibles",
    "Le son est équilibré sur le haut-parleur du téléphone",
    "La durée est entre 35 et 45 secondes",
    "La légende, les hashtags et le commentaire épinglé sont prêts",
]

FICHE_PERSO = ["Prénom", "Défaut (5 mots max)", "Phrase fétiche", "Look (3 éléments reconnaissables)",
               "Voix (type, nom de la voix CapCut)", "Personnages qui reviennent", "Recette de style (description IA)"]

MODELE_SCRIPT = ["Hook (6 mots max)", "Demande absurde", "Réponse calme", "Escalade", "Appel à s'abonner",
                 "Arrivée de l'autorité", "Preuve", "Réaction absurde", "Teaser de l'épisode suivant"]
