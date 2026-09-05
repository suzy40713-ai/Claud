#!/usr/bin/env node
const fs = require('node:fs/promises');
const path = require('node:path');

const { generateStoryVideo } = require('./src/agent');
const { GENRES } = require('./src/storyIdeas');

function parseArgs(argv) {
  const args = { count: 1 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--count' || arg === '-n') {
      args.count = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--style') {
      args.style = argv[i + 1];
      i += 1;
    } else if (arg === '--genre') {
      args.genre = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`
Agent de contenu TikTok Story (100% gratuit, sans cle API)
------------------------------------------------------------
Genere en lot des videos d'histoires courtes pretes a publier :
images IA (Pollinations.ai), montage + sous-titres + ambiance sonore
(ffmpeg), et un fichier .txt avec titre/description/hashtags.

Usage :
  node agent-cli.js [--count N] [--genre horreur|mystere|temoignage] [--style cinematic|realistic|...]

Options :
  --count, -n   Nombre de videos a generer (defaut : 1, max : 20)
  --genre       Genre force (par defaut : tire au hasard a chaque video)
  --style       Style visuel force (par defaut : choisi selon le genre)
  --help, -h    Affiche cette aide

Genres disponibles : ${Object.keys(GENRES).join(', ')}

Rappel monetisation TikTok (Creativity Program) :
  - Compte de 18 ans ou plus, dans un pays eligible
  - Au moins 1000 abonnes et 10 000 vues sur les 30 derniers jours
  - Videos de plus d'1 minute (ce script vise ~60-90s par video)
  - Respect des regles de la communaute TikTok
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.genre && !GENRES[args.genre]) {
    console.error(`Genre inconnu "${args.genre}". Genres disponibles : ${Object.keys(GENRES).join(', ')}`);
    process.exit(1);
  }

  const total = Math.min(20, Math.max(1, Number.isFinite(args.count) ? args.count : 1));
  await fs.mkdir(path.join(__dirname, 'generated'), { recursive: true });

  console.log(`Generation de ${total} video(s) d'histoire courte...`);

  const results = [];
  for (let i = 0; i < total; i += 1) {
    console.log(`\n[${i + 1}/${total}] Generation en cours (images IA + montage video)...`);
    try {
      const result = await generateStoryVideo({ style: args.style, genre: args.genre });
      console.log(`  -> "${result.title}"`);
      console.log(`  -> genre: ${result.genre} | ~${Math.round(result.durationSec)}s | ${result.sceneCount} scenes`);
      console.log(`  -> generated/${result.video}`);
      console.log(`  -> generated/${result.caption} (titre + description + hashtags a copier-coller)`);
      results.push(result);
    } catch (err) {
      console.error(`  Echec de la generation ${i + 1}/${total}: ${err.message}`);
    }
  }

  console.log(`\nTermine : ${results.length}/${total} video(s) generee(s) dans tiktok-ai-studio/generated/.`);
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
