# Vidéos TikTok en motion design

Deux vidéos prêtes à publier (1080×1920, volume normalisé à -14 LUFS, plus d'une minute) :

| Fichier | Sujet | Durée | Présentateur |
| --- | --- | --- | --- |
| `out/tiktok-animaux.mp4` | 7 animaux avec de vrais super-pouvoirs : commence par « Le savais-tu ? », vraies photos, un cut par seconde | 74 s | Voix off d'homme, sans présentateur à l'écran |
| `out/tiktok-cerveau.mp4` | 7 choses que ton cerveau te cache | 67 s | Dr Neurone |

Style **motion design** : transitions en cercle de couleur, texte qui apparaît mot à mot au rythme de la voix et stickers animés. La vidéo **cerveau** utilise des illustrations vectorielles animées ; la vidéo **animaux** s'ouvre sur « Le savais-tu ? » en gros au milieu de l'écran, puis enchaîne de **vraies photos** en plein écran avec **un cut toutes les secondes** (photo suivante ou zoom brutal, petit flash) et un montage ultra-rapide dans l'intro ; voix off seule, sans présentateur. La vidéo cerveau garde sa présentatrice animée (avatar en haut à gauche, bouche synchronisée sur la voix).

## Légendes à copier

**Animaux**

```
Le n°7 est presque immortelle 😳🪼 Lequel tu voudrais être ?
#animaux #lesaviezvous #nature #faitsinteressants #apprendresurtiktok #pourtoi #fyp
📸 Photos iNaturalist (CC BY) : desertnaturalist, Erin McKittrick, Daniel Levitis, Caleb Krueger, marmottled, Robert Martin, Zihao Wang, Mark Stluka, Christine Loew, Yves Bas, Louis Imbeau, M Rutherford, Daniel Benefiel, Paul Hoekman, Kai Squires, Tony Ladson, Andrew Thornhill, Luca Davenport-Thomas, Lisa Bennett, Jacqui Geux ; (CC0) : Jean-Paul Boerekamps, Jesse Rorabaugh
```

Les photos viennent d'iNaturalist et sont sous licence **CC BY** ou **CC0**, qui autorisent l'usage commercial (donc une vidéo monétisée). La licence CC BY exige de **créditer l'auteur** : le nom s'affiche sur chaque photo dans la vidéo, et la ligne 📸 ci-dessus le répète dans la description. Garde-la.

| Animal | Photo | Auteur | Licence |
| --- | --- | --- | --- |
| Poulpe | inaturalist.org/photos/40406294 | desertnaturalist | CC BY |
| Poulpe | inaturalist.org/photos/104745723 | Erin McKittrick | CC BY |
| Loutres de mer | inaturalist.org/photos/105718279 | Daniel Levitis | CC BY |
| Loutre de mer | inaturalist.org/photos/147772168 | Caleb Krueger | CC BY |
| Loutres de mer | inaturalist.org/photos/136638195 | marmottled | CC BY |
| Tardigrade | inaturalist.org/photos/424231986 | Robert Martin | CC BY |
| Tardigrade | inaturalist.org/photos/387667023 | Zihao Wang | CC BY |
| Tardigrade | inaturalist.org/photos/416112919 | Mark Stluka | CC BY |
| Crocodile | inaturalist.org/photos/39911749 | Christine Loew | CC BY |
| Crocodile | inaturalist.org/photos/58937303 | Yves Bas | CC BY |
| Crocodile | inaturalist.org/photos/29304044 | Louis Imbeau | CC BY |
| Crocodile | inaturalist.org/photos/60857207 | M Rutherford | CC BY |
| Flamant rose | inaturalist.org/photos/125236638 | Jean-Paul Boerekamps | CC0 |
| Flamant rose | inaturalist.org/photos/113140897 | Daniel Benefiel | CC BY |
| Flamants roses | inaturalist.org/photos/135662332 | Paul Hoekman | CC BY |
| Wombats | inaturalist.org/photos/59536104 | Kai Squires | CC BY |
| Crottes de wombat | inaturalist.org/photos/43525070 | Jesse Rorabaugh | CC0 |
| Wombat | inaturalist.org/photos/5097824 | Tony Ladson | CC BY |
| Wombat | inaturalist.org/photos/47708572 | Andrew Thornhill | CC BY |
| Méduse Turritopsis | inaturalist.org/photos/137795033 | Luca Davenport-Thomas | CC BY |
| Méduse Turritopsis | inaturalist.org/photos/7431719 | Lisa Bennett | CC BY |
| Méduse Turritopsis | inaturalist.org/photos/6789172 | Jacqui Geux | CC BY |

**Cerveau**

```
La Dr Neurone t'explique ce que ton cerveau te cache 🧠 Le n°7 va marcher sur toi 😳
#cerveau #lesaviezvous #psychologie #faitsinteressants #apprendresurtiktok #pourtoi #fyp
```

## Avant de publier

1. **Ajoute un son tendance en fond** dans l'éditeur TikTok (onglet « Sons » → tendances) et mets-le **très bas (5–10 %)** pour que la voix off reste claire. Laisse le son d'origine à 100 %.
2. Publie entre **18 h et 21 h** (heure de ton public), une vidéo par jour plutôt que les deux le même jour.
3. Pendant la première heure, **réponds aux commentaires** (« Le 7 ! », « BAILLÉ »…) : ça relance l'algorithme.
4. Épingle ton propre commentaire : « Partie 2 demain ? 👀 ».
5. Active **« Contenu généré par l'IA »** dans les paramètres de publication (« Plus d'options »). La voix et la présentatrice sont générées : TikTok exige cette mention et peut retirer la vidéo ou la priver de rémunération si elle manque.

## Pour gagner de l'argent

- **Creator Rewards Program** : il faut ≥ 18 ans, ≥ 10 000 abonnés, ≥ 100 000 vues sur 30 jours, et des vidéos de **plus d'une minute** (les deux vidéos le sont).
- Le format « partie 1 / partie 2 » sert à fidéliser : publie une série (1 vidéo par jour) plutôt qu'une seule vidéo.

## Créer une vidéo sur un nouveau sujet

Chaque sujet est un dossier `src/topics/<sujet>/` :

- `script.json` : le texte à l'écran (`title`, `text`…) et ce que dit la voix (`titleSay`, `textSay`…, avec les chiffres écrits en toutes lettres), plus le nom du présentateur, l'accroche d'ouverture (`hook.intro`, ex. « Le savais-tu ? ») et le mot tapé dans la bulle de fin (`outro.typed`) ;
- `index.tsx` : les couleurs de chaque scène, l'illustration animée de chaque fait (dans `src/motion/`) ou de vraies photos (dans `public/photos/`, plusieurs par fait pour les cuts) avec des stickers animés par-dessus, l'avatar (`look: "man"` ou `"woman"`, ou `host: false` pour une voix off seule) et le rythme des cuts (`cutEvery`, en images).

Ajoute ensuite le sujet dans `src/Root.tsx`, puis :

```console
# 1. Voix off + mouvements de bouche. Le champ "voice" de script.json choisit la voix :
#    "ff_siwis" (femme, Kokoro) ou "piper:fr_FR-tom-medium" (homme). Installation : voir l'en-tête du script
python3 scripts/voiceover.py animaux
# 2. Rendu (Animaux ou Cerveau ; le timing suit automatiquement la durée de la voix)
npx remotion render Animaux out/raw.mp4 --codec=h264 --crf=18
# 3. Volume au standard TikTok
ffmpeg -i out/raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5 -c:a aac -b:a 192k out/tiktok-animaux.mp4
```

La vidéo dure toujours au moins 61,5 s (la fin est allongée si besoin) pour rester éligible au Creator Rewards Program.
