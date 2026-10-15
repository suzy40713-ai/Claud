# Sketch animé : « Refus de céder sa place côté fenêtre »

Mini-dessin animé vertical (1080x1920, 30 i/s, ~97 s) façon « histoires de passagers pénibles » :
un père exige qu'une passagère cède sa place côté fenêtre à sa fille… jusqu'à l'arrivée du contrôleur.

- `script.py` : dialogues, humeurs des personnages, plans de caméra
- `tts.py` : voix françaises hors-ligne (Piper) + ambiance sonore du train
- voix de la série : Piper « medium » récentes (tom, pierre, siwis, jessica), téléchargées depuis les releases GitHub de sherpa-onnx
- `render.py` : décor, personnages, lip-sync, caméra, sous-titres → MP4

```bash
pip install piper-tts cairosvg pillow numpy   # + ffmpeg
python3 render.py                 # rendu complet -> refus-place-fenetre-train.mp4
python3 render.py --frames 2,40   # images fixes de contrôle dans build/
```

Pour un autre sketch : modifier `TITLE` et `LINES` dans `script.py`.

## Série de 10 sketchs (≤ 1 min 10 chacun)

`sketches.py` décrit 10 sketchs (décor, personnages, voix, dialogues) et `engine.py` les rend tous :

| # | Sketch | Décor |
|---|--------|-------|
| 01 | Refus de partager ses frites | restaurant |
| 02 | Refus de céder sa place au cinéma | cinéma |
| 03 | Refus de prêter son parasol | plage |
| 04 | Refus de laisser passer à la caisse | supermarché |
| 05 | Refus de prêter son chargeur | bus |
| 06 | Refus de céder son transat | piscine d'hôtel |
| 07 | Refus de prêter son casque dans l'avion | avion |
| 08 | Refus de prêter son ordinateur au café | café |
| 09 | Refus de céder son tour chez le médecin | salle d'attente |
| 10 | Refus de partager sa glace au parc | parc |

```bash
python3 engine.py            # rend les 10 vidéos dans videos/
python3 engine.py 03 07      # seulement certains sketchs
python3 engine.py 05 --frames 2,30   # images de contrôle
```

La durée est vérifiée automatiquement : si un sketch dépasse 69,5 s, les voix sont accélérées.
