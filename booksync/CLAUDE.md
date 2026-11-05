@AGENTS.md

# BookSync — règles du projet

- Interface 100 % en français (textes, erreurs, emails, formats de date `fr-FR`).
- Avancer étape par étape : chaque fonctionnalité est testée (Vitest + Playwright) avant la suivante.
- Logique métier pure dans `src/domain/` (pas d'accès base ni réseau), testée unitairement.
- Toute table du schéma `public` doit avoir la RLS activée (`ENABLE ROW LEVEL SECURITY`).
- Avant de pousser : `pnpm check`, puis `pnpm build && pnpm test:e2e`.
