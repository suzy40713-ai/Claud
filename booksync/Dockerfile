# syntax=docker/dockerfile:1.7
# ── BookSync — image de production (Render) ───────────────────

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# 1. Dépendances complètes (build)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 2. Build Next.js (les secrets ne sont pas nécessaires au build)
FROM deps AS build
# Variables publiques intégrées au build (Render les transmet comme arguments de build).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LEGAL_COMPANY
ARG NEXT_PUBLIC_LEGAL_FORM
ARG NEXT_PUBLIC_LEGAL_ADDRESS
ARG NEXT_PUBLIC_LEGAL_SIREN
ARG NEXT_PUBLIC_LEGAL_VAT
ARG NEXT_PUBLIC_LEGAL_DIRECTOR
ARG NEXT_PUBLIC_LEGAL_EMAIL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL SKIP_ENV_VALIDATION=1 \
    NEXT_PUBLIC_LEGAL_COMPANY=$NEXT_PUBLIC_LEGAL_COMPANY NEXT_PUBLIC_LEGAL_FORM=$NEXT_PUBLIC_LEGAL_FORM \
    NEXT_PUBLIC_LEGAL_ADDRESS=$NEXT_PUBLIC_LEGAL_ADDRESS NEXT_PUBLIC_LEGAL_SIREN=$NEXT_PUBLIC_LEGAL_SIREN \
    NEXT_PUBLIC_LEGAL_VAT=$NEXT_PUBLIC_LEGAL_VAT NEXT_PUBLIC_LEGAL_DIRECTOR=$NEXT_PUBLIC_LEGAL_DIRECTOR \
    NEXT_PUBLIC_LEGAL_EMAIL=$NEXT_PUBLIC_LEGAL_EMAIL
COPY . .
RUN pnpm build

# 3. Dépendances de production uniquement
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 4. Image finale
FROM node:22-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=10000
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/package.json /app/next.config.ts ./
COPY --from=build --chown=app:app /app/src/db ./src/db
USER app
EXPOSE 10000
# Applique les migrations puis démarre le serveur.
CMD ["sh", "-c", "node --import tsx src/db/migrate.ts && node_modules/.bin/next start -p ${PORT}"]
