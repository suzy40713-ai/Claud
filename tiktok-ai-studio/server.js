const express = require('express');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');

const { fetchPollinationsImage } = require('./src/pollinations');
const { buildScenes, STYLE_PRESETS } = require('./src/scenes');
const { buildSlideshow } = require('./src/videoBuilder');

const app = express();
const PORT = process.env.PORT || 3000;
const GENERATED_DIR = path.join(__dirname, 'generated');

const MAX_PROMPT_LENGTH = 500;
const MIN_SCENES = 2;
const MAX_SCENES = 6;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(GENERATED_DIR));

function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return 'Le prompt ne peut pas etre vide.';
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `Le prompt est trop long (max ${MAX_PROMPT_LENGTH} caracteres).`;
  }
  return null;
}

app.get('/api/styles', (req, res) => {
  res.json({ styles: Object.keys(STYLE_PRESETS) });
});

app.post('/api/generate/image', async (req, res) => {
  const { prompt, style = 'none' } = req.body || {};
  const promptError = validatePrompt(prompt);
  if (promptError) {
    return res.status(400).json({ error: promptError });
  }

  try {
    const styleSuffix = STYLE_PRESETS[style] || '';
    const finalPrompt = [prompt.trim(), styleSuffix].filter(Boolean).join(', ');
    const seed = Math.floor(Math.random() * 1_000_000);

    const imageBuffer = await fetchPollinationsImage(finalPrompt, { width: 1080, height: 1920, seed });

    const fileName = `image-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
    await fs.writeFile(path.join(GENERATED_DIR, fileName), imageBuffer);

    res.json({ type: 'image', url: `/generated/${fileName}` });
  } catch (err) {
    console.error('Erreur generation image:', err);
    res.status(502).json({
      error:
        "La generation d'image a echoue. Verifiez la connexion internet du serveur (le service gratuit Pollinations.ai doit etre joignable).",
      detail: err.message,
    });
  }
});

// Video generation runs several sequential Pollinations.ai calls plus
// several ffmpeg passes, which can easily take longer than the request
// timeout enforced by most hosting proxies (Render, Vercel, etc.). Holding
// a single HTTP request open for the whole pipeline gets that connection
// cut mid-response. Instead, the job runs in the background and the client
// polls GET /api/generate/video/:jobId for its status.
const videoJobs = new Map();
const JOB_TTL_MS = 10 * 60 * 1000;

function scheduleJobCleanup(jobId) {
  setTimeout(() => videoJobs.delete(jobId), JOB_TTL_MS).unref();
}

async function runVideoJob(jobId, { prompt, style, scenes, withMusic, withCaptions }) {
  let workingFiles = [];
  try {
    const sceneDescriptions = buildScenes(prompt, scenes, style);

    const scenesWithImages = [];
    for (let i = 0; i < sceneDescriptions.length; i += 1) {
      const scene = sceneDescriptions[i];
      const imageBuffer = await fetchPollinationsImage(scene.imagePrompt, {
        width: 1080,
        height: 1920,
        seed: scene.seed,
      });
      const tempImagePath = path.join(GENERATED_DIR, `.tmp-${jobId}-${i}.jpg`);
      await fs.writeFile(tempImagePath, imageBuffer);
      workingFiles.push(tempImagePath);
      scenesWithImages.push({ imagePath: tempImagePath, caption: scene.caption });
    }

    const fileName = `video-${Date.now()}-${jobId.slice(0, 8)}.mp4`;
    const outPath = path.join(GENERATED_DIR, fileName);

    await buildSlideshow({
      scenes: scenesWithImages,
      outPath,
      withMusic: Boolean(withMusic),
      withCaptions: Boolean(withCaptions),
    });

    videoJobs.set(jobId, { status: 'done', url: `/generated/${fileName}`, sceneCount: scenes });
  } catch (err) {
    console.error('Erreur generation video:', err);
    videoJobs.set(jobId, {
      status: 'error',
      error:
        "La generation de video a echoue. Verifiez que ffmpeg est installe sur le serveur et que la connexion internet permet de joindre Pollinations.ai.",
      detail: err.message,
    });
  } finally {
    scheduleJobCleanup(jobId);
    await Promise.all(workingFiles.map((f) => fs.rm(f, { force: true }).catch(() => {})));
  }
}

app.post('/api/generate/video', (req, res) => {
  const {
    prompt,
    style = 'none',
    sceneCount = 4,
    withMusic = true,
    withCaptions = true,
  } = req.body || {};

  const promptError = validatePrompt(prompt);
  if (promptError) {
    return res.status(400).json({ error: promptError });
  }

  const scenes = Math.min(MAX_SCENES, Math.max(MIN_SCENES, Number(sceneCount) || 4));
  const jobId = crypto.randomUUID();
  videoJobs.set(jobId, { status: 'pending' });

  runVideoJob(jobId, { prompt: prompt.trim(), style, scenes, withMusic, withCaptions });

  res.status(202).json({ jobId, sceneCount: scenes });
});

app.get('/api/generate/video/:jobId', (req, res) => {
  const job = videoJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job introuvable ou expire.' });
  }
  res.json({ type: 'video', ...job });
});

async function ensureDirs() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
}

ensureDirs().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`TikTok AI Studio pret sur http://localhost:${PORT}`);
  });
  server.requestTimeout = 5 * 60 * 1000;
  server.headersTimeout = 5 * 60 * 1000 + 5000;
});
