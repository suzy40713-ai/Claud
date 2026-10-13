# ⚽ Football Facts — générateur de vidéos TikTok

Génère automatiquement des vidéos verticales 1080×1920 sur le football : voix off française, sous-titres synchronisés (mots clés en vert néon), animations, musique et effets sonores libres de droits, logo Football Facts. Sans visage, sans abonnement payant.

**Première vidéo :** `output/ronaldo-legende.mp4` — « Pourquoi Cristiano Ronaldo est-il devenu une légende du football ? » (40 s, sans voix off)

| Fichier | Contenu |
|---------|---------|
| `output/ronaldo-legende.mp4` | La vidéo prête à publier |
| `output/ronaldo-legende_publication.txt` | Titre, description et 5 hashtags à copier-coller |
| `output/ronaldo-legende.srt` | Sous-titres séparés (si tu veux les réimporter dans CapCut) |
| `output/logo_football_facts.png` | Logo (utilisable comme photo de profil) |
| `docs/script-et-scenes.md` | Script, liste des scènes, faits vérifiés, sources, droits |
| `projects/ronaldo.json` | Le script modifiable de la vidéo |

## Voix off

La vidéo actuelle est **sans voix** : la musique, les effets sonores et les grands sous-titres racontent l'histoire. La voix robotique (espeak-ng) a été retirée, et le mode automatique ne l'utilise plus.

Pour ajouter une voix naturelle gratuite :

1. **Sur ordinateur (recommandé)** : `pip install edge-tts`, puis relance `python3 generate.py projects/ronaldo.json`. Si Internet est accessible, le script utilise automatiquement la voix neuronale `fr-FR-HenriNeural` (gratuite, sans clé API) et cale les sous-titres sur la voix.
2. **Sur téléphone avec CapCut (gratuit)** : importe le MP4, ajoute *Texte → Texte en voix* avec une voix française, et colle le texte de `docs/script-et-scenes.md`.

## Installation (ordinateur : Windows, macOS, Linux)

```bash
# 1. FFmpeg
#    Linux : sudo apt install ffmpeg   ·   macOS : brew install ffmpeg   ·   Windows : winget install ffmpeg
# 2. Python 3.9+ et les dépendances (toutes gratuites)
pip install -r requirements.txt
# 3. Générer
python3 generate.py projects/ronaldo.json
```

Options :

```bash
python3 generate.py projects/ronaldo.json --preview          # 10 images PNG d'aperçu en ~5 s
python3 generate.py projects/ronaldo.json --engine none      # sans voix (sous-titres + musique)
python3 generate.py projects/ronaldo.json --engine espeak    # voix hors ligne robotique (déconseillée)
python3 generate.py projects/ronaldo.json --engine edge      # forcer la voix neuronale
```

Rendu complet : environ 1 à 2 minutes sur un ordinateur récent.

## Depuis un téléphone Android (Termux, gratuit)

```bash
pkg install python ffmpeg git
pip install numpy pillow edge-tts
git clone <url-de-ce-dépôt> && cd Claud/football-facts
python generate.py projects/ronaldo.json --workers 2
```

Le rendu prend plusieurs minutes sur téléphone. Sur iPhone, le plus simple est de générer sur ordinateur (ou de télécharger le MP4 depuis GitHub) puis de finir dans CapCut.

## Créer une nouvelle vidéo

Copie `projects/ronaldo.json` et modifie :

- `lines[].text` : le sous-titre ; entoure les mots importants d'astérisques → `*Ballon d'Or*` s'affiche en vert néon.
- `lines[].say` (optionnel) : ce que la voix prononce, si ça diffère du texte (« 12 ans » → « douze ans »).
- `duration` : durée de la scène. Si la narration est trop longue, la voix est légèrement accélérée (jusqu'à ×1,45), puis la scène est allongée.
- `on_screen` : grand titre du hook et de la conclusion.
- `publish` : titre, description, hashtags.

Les visuels animés (`visual` : `hook`, `debuts`, `explosion`, `records`, `outro`) sont codés dans `generate.py` (fonctions `scene_*`) ; pour un autre joueur, adapte les textes des cartes dans ces fonctions.

## Comment ça marche

1. **Voix** : chaque phrase est synthétisée séparément avec edge-tts → les sous-titres tombent exactement sur la voix. Sans voix disponible, chaque sous-titre reçoit une durée de lecture calculée sur sa longueur.
2. **Audio** : musique 124 BPM (batterie, basse, nappe, arpège) et effets (impact, whoosh, pops) générés en Python ; la musique baisse automatiquement quand la voix parle ; normalisation autour de −14 LUFS.
3. **Image** : chaque image 1080×1920 est dessinée avec Pillow (zooms, transitions diagonales néon, compteurs animés), en parallèle sur tous les cœurs.
4. **Export** : FFmpeg encode en H.264/AAC, MP4 avec `faststart`, prêt pour TikTok.
