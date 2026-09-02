# Cotizo

Calculateur de charges et suivi des seuils pour micro-entrepreneurs (France).

App 100% statique, sans backend : les données (activité, chiffre d'affaires
mensuel) restent dans le `localStorage` du navigateur, rien n'est envoyé à
un serveur.

Taux et seuils basés sur le barème officiel URSSAF — voir `src/lib/rates.ts`
(date de mise à jour indiquée dans `RATES_UPDATED_AT`, à vérifier/actualiser
chaque année).

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
