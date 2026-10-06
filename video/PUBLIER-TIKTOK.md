# Vidéo TikTok : « 7 choses que ton cerveau te cache »

Fichier : `out/tiktok-cerveau.mp4` (1080×1920, 67 s, volume normalisé à -14 LUFS).

Style **motion design** : chaque fait a sa propre illustration vectorielle animée (barres 2 % / 20 %, coupe de l'œil et point aveugle, ondes prédiction/sensation, loupe qui trouve le même mot partout, visages qui bâillent en chaîne…), des transitions en cercle de couleur et du texte qui apparaît mot à mot au rythme de la voix. La **Dr Neurone** (scientifique animée) explique depuis son avatar en haut à gauche, avec la bouche synchronisée sur la voix off.

## Légende à copier

```
La Dr Neurone t'explique ce que ton cerveau te cache 🧠 Le n°7 va marcher sur toi 😳
#cerveau #lesaviezvous #psychologie #faitsinteressants #apprendresurtiktok #pourtoi #fyp
```

## Avant de publier

1. **Ajoute un son tendance en fond** dans l'éditeur TikTok (onglet « Sons » → tendances) et mets-le **très bas (5–10 %)** pour que la voix off reste claire. Laisse le son d'origine à 100 %.
2. Publie entre **18 h et 21 h** (heure de ton public).
3. Pendant la première heure, **réponds à chaque commentaire** « BAILLÉ » (ça relance l'algorithme).
4. Épingle ton propre commentaire : « Partie 2 demain ? 👀 ».
5. Active **« Contenu généré par l'IA »** dans les paramètres de publication (« Plus d'options »). La voix et la présentatrice sont générées : TikTok exige cette mention et peut retirer la vidéo ou la priver de rémunération si elle manque.

## Pour gagner de l'argent

- **Creator Rewards Program** : il faut ≥ 18 ans, ≥ 10 000 abonnés, ≥ 100 000 vues sur 30 jours, et des vidéos de **plus d'une minute**. Cette vidéo dure 67 s, elle est donc éligible.
- Le format « partie 1 / partie 2 » sert à fidéliser : publie une série (1 vidéo par jour) plutôt qu'une seule vidéo.

## Générer une nouvelle vidéo

Tout le texte est dans `src/script.json` : le texte à l'écran (`title`, `text`…) et ce que dit la voix (`titleSay`, `textSay`…, avec les chiffres écrits en toutes lettres).

```console
# 1. Voix off + mouvements de bouche (Kokoro, voix ff_siwis). Installation : voir l'en-tête du script
python3 scripts/voiceover.py --models ~/kokoro
# 2. Rendu de la vidéo (le timing suit automatiquement la durée de la voix)
npx remotion render MyComp out/raw.mp4 --codec=h264 --crf=18
# 3. Volume au standard TikTok
ffmpeg -i out/raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5 -c:a aac -b:a 192k out/tiktok-cerveau.mp4
```

La vidéo dure toujours au moins 61,5 s (la fin est allongée si besoin) pour rester éligible au Creator Rewards Program.
