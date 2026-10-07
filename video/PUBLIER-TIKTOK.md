# Vidéos TikTok en motion design

Deux vidéos prêtes à publier (1080×1920, volume normalisé à -14 LUFS, plus d'une minute) :

| Fichier | Sujet | Durée | Présentatrice |
| --- | --- | --- | --- |
| `out/tiktok-animaux.mp4` | 7 animaux avec de vrais super-pouvoirs | 73 s | Dr Bestiole |
| `out/tiktok-cerveau.mp4` | 7 choses que ton cerveau te cache | 67 s | Dr Neurone |

Style **motion design** : chaque fait a sa propre illustration vectorielle animée, synchronisée sur la voix off, des transitions en cercle de couleur et du texte qui apparaît mot à mot. La présentatrice (scientifique animée) parle depuis son avatar en haut à gauche, bouche synchronisée sur la voix.

## Légendes à copier

**Animaux**

```
Le n°7 est presque immortelle 😳🪼 Lequel tu voudrais être ?
#animaux #lesaviezvous #nature #faitsinteressants #apprendresurtiktok #pourtoi #fyp
```

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
- `index.tsx` : les couleurs de chaque scène et l'illustration animée de chaque fait (dans `src/motion/`).

Ajoute ensuite le sujet dans `src/Root.tsx`, puis :

```console
# 1. Voix off + mouvements de bouche (Kokoro, voix ff_siwis). Installation : voir l'en-tête du script
python3 scripts/voiceover.py animaux --models ~/kokoro
# 2. Rendu (Animaux ou Cerveau ; le timing suit automatiquement la durée de la voix)
npx remotion render Animaux out/raw.mp4 --codec=h264 --crf=18
# 3. Volume au standard TikTok
ffmpeg -i out/raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5 -c:a aac -b:a 192k out/tiktok-animaux.mp4
```

La vidéo dure toujours au moins 61,5 s (la fin est allongée si besoin) pour rester éligible au Creator Rewards Program.
