# FAITSTORY AI — image de production
# Inclut ffmpeg et espeak-ng (gratuits, sans cle API) requis par le pipeline video.

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    espeak-ng \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Applique les migrations puis demarre le serveur. DATABASE_URL doit deja
# pointer vers une base Postgres accessible (voir .env.example / README).
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
