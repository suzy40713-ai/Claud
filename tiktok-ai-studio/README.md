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

## Deployer en ligne (obtenir un vrai lien public)

L'app est prete pour [Render](https://render.com) (hebergeur avec un plan gratuit, Docker + ffmpeg supportes nativement).

1. Cree un compte gratuit sur [render.com](https://render.com) (inscription via GitHub, aucune carte bancaire requise pour le plan gratuit).
2. Clique sur ce bouton, ou vas dans le dashboard Render sur **New > Blueprint** :

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/suzy40713-ai/Claud)
3. Autorise Render a acceder au repo GitHub `suzy40713-ai/Claud` quand c'est demande.
4. Render detecte automatiquement `render.yaml` a la racine du repo et configure le service `tiktok-ai-studio` (Docker, plan gratuit). Clique sur **Apply**.
5. Attends la fin du build (quelques minutes la premiere fois). Render te donne une URL du type `https://tiktok-ai-studio-xxxx.onrender.com` — c'est ton site, accessible depuis n'importe quel navigateur.

**A savoir sur le plan gratuit Render** :
- Le service s'endort apres ~15 minutes sans visite ; la premiere requete apres une pause reveille le serveur en 30-60 secondes.
- Le stockage est ephemere : les images/videos generees disparaissent a chaque redemarrage ou redeploiement (pas de base de donnees, ce n'est pas necessaire pour un usage ponctuel).
- Contrairement a cet environnement de developpement, les serveurs Render ont un acces internet normal : les appels a Pollinations.ai fonctionnent sans restriction particuliere.

## Agent de contenu automatique (mode "story", pour la monetisation)

En plus de l'interface web (une video a la fois), le projet inclut un agent en ligne de commande qui invente et genere en lot des videos d'histoires courtes (horreur, mystere, temoignage) pretes a publier sur TikTok :

```bash
cd tiktok-ai-studio
npm run agent -- --count 5
```

Options :
- `--count, -n` : nombre de videos a generer (defaut 1, max 20)
- `--genre` : force `horreur`, `mystere` ou `temoignage` (sinon tire au hasard a chaque video)
- `--style` : force un style visuel (`cinematic`, `realistic`, `anime`, ...)

Pour chaque video generee dans `generated/`, l'agent produit aussi :
- un fichier `.txt` avec le titre, la description et les hashtags, prets a copier-coller au moment de publier ;
- un fichier `.json` avec les memes infos (utile pour un calendrier de publication).

Les histoires sont generees par un moteur de templates (aucune cle API, aucun cout) : personnage, lieu et objet sont tires au hasard dans une trame narrative fixe par genre, avec accords grammaticaux corrects. Chaque video vise ~60-90 secondes (plusieurs scenes de 4,5s) pour respecter la duree minimale du programme de monetisation TikTok.

**Conditions de monetisation TikTok (Creativity Program)**, a verifier de ton cote sur TikTok :
- avoir 18 ans ou plus et un compte dans un pays eligible ;
- au moins 1000 abonnes et 10 000 vues sur les 30 derniers jours ;
- des videos de plus d'1 minute ;
- respecter les regles de la communaute TikTok.

Cet agent genere le contenu ; publier les videos, engager la communaute et respecter les regles TikTok reste une demarche manuelle de ton cote.

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
├── generated/             # Images et videos generees (non versionnees)
└── Dockerfile             # Image pour deploiement (Render, ou tout hebergeur Docker)
```

Le fichier `render.yaml` a la racine du repo decrit le service pour un deploiement Render en un clic (voir section precedente).

## Limites connues

- Pollinations.ai peut etre lent ou indisponible ponctuellement (service gratuit tiers) : le serveur renvoie un message d'erreur clair dans ce cas.
- Il n'existe pas aujourd'hui de generateur video IA gratuit et sans cle equivalent a un vrai modele text-to-video : cette app cree des videos par montage d'images IA (slideshow anime), ce qui reste totalement gratuit et fonctionnel pour du contenu TikTok.
