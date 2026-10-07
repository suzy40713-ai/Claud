# Vidéos TikTok en motion design

Deux vidéos prêtes à publier (1080×1920, volume normalisé à -14 LUFS, plus d'une minute) :

| Fichier | Sujet | Durée | Présentateur |
| --- | --- | --- | --- |
| `out/tiktok-animaux.mp4` | 7 animaux avec de vrais super-pouvoirs (vraies photos, voix d'homme) | 76 s | Dr Bestiole (voix d'homme) |
| `out/tiktok-cerveau.mp4` | 7 choses que ton cerveau te cache | 67 s | Dr Neurone |

Style **motion design** : transitions en cercle de couleur, texte qui apparaît mot à mot au rythme de la voix et stickers animés. La vidéo **cerveau** utilise des illustrations vectorielles animées ; la vidéo **animaux** utilise de **vraies photos** en plein écran (léger zoom continu, montage rapide des 7 photos dans l'intro). Le présentateur (scientifique animé) parle depuis son avatar en haut à gauche, bouche synchronisée sur la voix.

## Légendes à copier

**Animaux**

```
Le n°7 est presque immortelle 😳🪼 Lequel tu voudrais être ?
#animaux #lesaviezvous #nature #faitsinteressants #apprendresurtiktok #pourtoi #fyp
📸 Photos iNaturalist : desertnaturalist, Daniel Levitis, Robert Martin, Christine Loew, Kai Squires, Luca Davenport-Thomas (CC BY) ; Jean-Paul Boerekamps, Jesse Rorabaugh (CC0)
```

Les photos viennent d'iNaturalist et sont sous licence **CC BY** ou **CC0**, qui autorisent l'usage commercial (donc une vidéo monétisée). La licence CC BY exige de **créditer l'auteur** : le nom s'affiche sur chaque photo dans la vidéo, et la ligne 📸 ci-dessus le répète dans la description. Garde-la.

| Animal | Photo | Auteur | Licence |
| --- | --- | --- | --- |
| Poulpe | inaturalist.org/photos/40406294 | desertnaturalist | CC BY |
| Loutres de mer | inaturalist.org/photos/105718279 | Daniel Levitis | CC BY |
| Tardigrade | inaturalist.org/photos/424231986 | Robert Martin | CC BY |
| Crocodile | inaturalist.org/photos/39911749 | Christine Loew | CC BY |
| Flamant rose | inaturalist.org/photos/125236638 | Jean-Paul Boerekamps | CC0 |
| Wombats | inaturalist.org/photos/59536104 | Kai Squires | CC BY |
| Crottes de wombat | inaturalist.org/photos/43525070 | Jesse Rorabaugh | CC0 |
| Méduse Turritopsis | inaturalist.org/photos/137795033 | Luca Davenport-Thomas | CC BY |

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

- `script.json` : le texte à l'écran (`title`, `text`…) et ce que dit la voix (`titleSay`, `textSay`…, avec les chiffres écrits en toutes lettres), plus le nom de la présentatrice et le mot tapé dans la bulle de fin (`outro.typed`) ;
- `index.tsx` : les couleurs de chaque scène, l'illustration animée de chaque fait (dans `src/motion/`) ou une vraie photo (dans `public/photos/`) avec des stickers animés par-dessus, et l'avatar (`look: "man"` ou `"woman"`).

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
