# Tu préfères — générateur de vidéos TikTok

Vidéos 1080×1920 « Tu préfères » prêtes à poster, construites pour le **watch time** et avec un **CTA follow** intégré.

## Utilisation

```bash
npm install
npm run dev                                   # aperçu dans Remotion Studio
npx remotion render TuPreferes-Partie1 out/partie1.mp4
```

Pour créer un nouvel épisode : ajoute un objet dans `src/questions.ts` (`EPISODES`). Il apparaît tout seul dans la sidebar du Studio.

## Structure d'une vidéo (~39 s avec 6 questions)

| Moment | Durée | Rôle |
|---|---|---|
| Accroche | 1,5 s | Promesse + boucle ouverte (« seulement 1% réussit la dernière ») |
| Question × 6 | 5,6 s chacune | Entrée 0,4 s → chrono 3 s → % révélés 2,2 s |
| CTA milieu | pendant la révélation de la Q3 | « Abonne-toi pour la partie 2 👀 » |
| Dernière question | — | Étiquetée « 🔥 LA PLUS DURE » (barre jaune) : raison de rester jusqu'au bout |
| CTA final | 3,5 s | Bouton « S'abonner » cliqué + « Commente ton score 👇 » |

Les timings se règlent dans `src/config.ts`.

## Pourquoi ça retient

- **Pas de temps mort** : la 1re question arrive à 1,5 s, tout bouge en permanence (chrono qui pulse, textes qui respirent).
- **Participation active** : le chrono de 3 s force le spectateur à choisir → il attend le résultat.
- **Barre de progression** : on voit qu'il reste des questions, et que la dernière est « la plus dure ».
- **Écarts serrés** (49/51, 52/48) : ça fait débattre → commentaires → plus de reach.
- **Série « Partie 1, 2, 3… »** : le CTA « la partie 2 arrive demain » donne une vraie raison de s'abonner.
- **Safe zones TikTok** respectées (rien sous les boutons à droite ni sous la légende en bas).

## Conseils de publication

- Ajoute un **son tendance** dans l'app TikTok (volume bas) au moment de poster.
- Légende : « Tu choisis quoi pour la dernière ? 👇 #tupreferes #wouldyourather #choix #fyp ».
- Poste **1 à 2 fois par jour**, toujours au même format, et numérote les parties.
- Épingle un commentaire du type « Score ? Moi 4/6 😅 » pour lancer les réponses.
- Regarde la courbe de rétention dans les stats : si ça décroche à une question, remplace-la.

Police : TheBoldFont (voir `public/theboldfont-license.rtf`).
