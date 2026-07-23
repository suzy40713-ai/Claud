# TikTok AI Studio

Application web **100% gratuite** qui genere des images et des videos au format TikTok (9:16) a partir d'un simple prompt texte. Aucune cle API, aucun compte, aucun service payant.

## Comment c'est gratuit

- **Images** : generees via [Pollinations.ai](https://pollinations.ai), une API publique de text-to-image, sans cle et sans compte.
- **Videos** : construites localement avec **ffmpeg** a partir de plusieurs images generees (effet Ken Burns/zoom, sous-titres incrustes, transitions). L'ambiance sonore optionnelle est un fond audio synthetise en direct par ffmpeg (deux tonalites douces) — donc sans droits d'auteur, contrairement a un vrai morceau de musique. Une fois la video exportee, tu peux lui ajouter un son tendance directement dans l'app TikTok.

## Prerequis

- [Node.js](https://nodejs.org) >= 18
- [ffmpeg](https://ffmpeg.org/download.html) installe et disponible dans le PATH (`ffmpeg -version` doit fonctionner)
- Une connexion internet sortante (pour appeler Pollinations.ai)

## Installation et lancement

```bash
cd tiktok-ai-studio
npm install
npm start
```

Puis ouvre [http://localhost:3000](http://localhost:3000).

## Utilisation

1. Ecris un prompt (ex: *"un chat astronaute qui flotte dans l'espace, style cyberpunk"*).
2. Choisis le mode **Image** ou **Video**.
3. (Video) Regle le nombre de scenes, active/desactive les sous-titres et l'ambiance sonore.
4. Clique sur **Generer**, attends le rendu, puis telecharge le resultat pret pour TikTok.

Astuce script : si ton prompt contient plusieurs phrases (ex: *"Le hero se leve. Il traverse la foret. Il decouvre un tresor."*), chaque phrase devient une scene distincte avec sa propre image et son propre sous-titre.

## Structure du projet

```
tiktok-ai-studio/
├── server.js              # API Express (/api/generate/image, /api/generate/video)
├── src/
│   ├── pollinations.js    # Appel a l'API gratuite Pollinations.ai
│   ├── scenes.js          # Decoupage du prompt en scenes + presets de style
│   └── videoBuilder.js    # Montage ffmpeg (zoom, sous-titres, concat, audio)
├── public/                # Interface web (HTML/CSS/JS vanilla)
├── assets/fonts/          # Police DejaVu Sans Bold (licence libre, pour les sous-titres)
└── generated/             # Images et videos generees (non versionnees)
```

## Limites connues

- Pollinations.ai peut etre lent ou indisponible ponctuellement (service gratuit tiers) : le serveur renvoie un message d'erreur clair dans ce cas.
- Il n'existe pas aujourd'hui de generateur video IA gratuit et sans cle equivalent a un vrai modele text-to-video : cette app cree des videos par montage d'images IA (slideshow anime), ce qui reste totalement gratuit et fonctionnel pour du contenu TikTok.
