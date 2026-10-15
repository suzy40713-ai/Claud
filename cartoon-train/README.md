# Sketch animé : « Refus de céder sa place côté fenêtre »

Mini-dessin animé vertical (1080x1920, 30 i/s, ~97 s) façon « histoires de passagers pénibles » :
un père exige qu'une passagère cède sa place côté fenêtre à sa fille… jusqu'à l'arrivée du contrôleur.

- `script.py` : dialogues, humeurs des personnages, plans de caméra
- `tts.py` : voix françaises hors-ligne (Piper) + ambiance sonore du train
- `render.py` : décor, personnages, lip-sync, caméra, sous-titres → MP4

```bash
pip install piper-tts cairosvg pillow numpy   # + ffmpeg
python3 render.py                 # rendu complet -> refus-place-fenetre-train.mp4
python3 render.py --frames 2,40   # images fixes de contrôle dans build/
```

Pour un autre sketch : modifier `TITLE` et `LINES` dans `script.py`.
