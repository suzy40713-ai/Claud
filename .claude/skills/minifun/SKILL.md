---
name: minifun
description: Chaîne d'animation MiniFun (TikTok @good.animation / YouTube MiniFun). Utiliser pour toute demande de nouvelles vidéos, d'idées, d'analyse de niche ou de « percer » : ce qui marche, comment faire la veille avec vidIQ, et comment produire les vidéos avec le moteur cartoon-train.
---

# MiniFun — mémo de la chaîne

Lien en bio : https://beacons.ai/minifun. Public : francophone, 12-25 ans. Tout en français (les vidéos en anglais ont fait un flop).

## Ce qui a marché sur la chaîne (à refaire en priorité)
- **« Refus de… »** (sketchs courts, un personnage refuse une règle absurde) : meilleures vues TikTok (~3 500).
- **« FAUX, espèce de fils de pute »** sur l'HISTOIRE : une idée reçue par vidéo, un seul thème par vidéo, l'insulte vise le SPECTATEUR (pas un personnage). Égypte ≈ 1 000 vues. Thèmes faits : Vikings, Égypte 1-2, Grèce, Romains, pirates. Prêt : Révolution française (faux.py, fx09).
- **« Et si tu… »** et **galères** : meilleurs formats YouTube.
- Défis argent : « Dépenser 1 milliard en 1 journée » (milliard.py).

## Ce qui ne marche pas
- Vidéos en anglais, reposts de vidéos déjà publiées, intro lente sans accroche.

## Veille de niche (vidIQ, connecteur)
Quand on demande quoi faire ensuite, d'abord :
1. `vidiq_instagram_tiktok_outlier_search` (platforms tiktok, descriptionLanguage fr, audienceQuery `Culture/Region: France/francophone; Global: false; Demographics: ados et jeunes adultes 12-25, humour, animation, storytime;`).
2. `vidiq_outliers` (contentType short, language fr, mots-clés : « et si tu », « dans ce monde », « animation histoire »).
3. Garder les vidéos à fort multiplicateur (≥ 5x la médiane du créateur), en tirer le FORMAT (pas copier le contenu), et l'adapter à notre style.

Tendances vues le 27/11/2026 :
- **« Dans ce monde, [règle absurde]… »** (ex. « tout ce que tu dessines devient réel », « nous sautons toutes les 9 secondes », « celui qui touche la statue prend sa place ») : 28x à 3 000x, en plusieurs parties.
- **Défi argent absurde en animation** (« 300 000 € à qui rasera sa barbe… » PARTIE 1) : 36x.
- **Clichés d'une ville/région en animation** (« Voici le Clermontois ») : 7x, fait commenter et taguer.
- **Conte avec fin inattendue** (« Le roi promet sa fille… mais la fin est incroyable ») : 12x.
- **« Et si [conséquence absurde sur le corps] »** (« Et si mentir te rendait chauve ? ») : ~1 M de vues.

## Règles de fabrication
- Accroche texte géante dès la 1re seconde (`hook_text`), 45-75 s, découpé en « Partie 1 / 2 » quand ça marche.
- Fin : question en commentaire OU « Abonne-toi pour la partie 2 ».
- Fichier `publication.txt` à côté des vidéos : légende, hashtags, commentaire à épingler.

## Production (cartoon-train/)
- Histoires narrées : `story.py` (`B(texte, scène, cast, plan, **fx)`), un module par série avec `STORIES`, sélecteur ajouté dans `story.main()`. Rendu : `python3 story.py --story <préfixe>` ; test : `--frames 1.5,9,30`.
- fx utiles : `money`/`clock` (compteur d'argent), `bills`, `stamp`, `quiz`, `shake`, `crowd`, `notif`, `dark`, `red`, `rings`, `cta`.
- Voix : ElevenLabs Léo (`jsScnYkNNda9Q1NES5nn`, eleven_v4, generations_count 1, flow `pDxw1uHkC6B1Jc6ijjhF`) : toutes les répliques en un seul appel, séparées par ` [long pause] `, puis `eleven_split.py fetch jobs.json` et `check`. Ne jamais relancer une génération pour réessayer (ça coûte des crédits). Sans crédits : voix Piper `("fr_FR-miro-high", None, 0.82, 0.0)`.
- Si le conteneur a été remplacé : `pip install cairosvg kokoro-onnx piper-tts`.
