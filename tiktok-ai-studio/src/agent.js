const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');

const { fetchPollinationsImage } = require('./pollinations');
const { buildSlideshow } = require('./videoBuilder');
const { STYLE_PRESETS } = require('./scenes');
const { generateStory } = require('./storyIdeas');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');

// Longer than the manual UI's per-scene duration: a full ~12-14 sentence
// story at this pace lands around 60-90s, which is TikTok's minimum video
// length for Creativity Program (monetization) eligibility.
const SCENE_DURATION_SEC = 4.5;

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'histoire';
}

function randomSeed(offset) {
  return Math.floor(Math.random() * 1_000_000) + offset;
}

/**
 * Generates one full TikTok-ready story video end to end: picks a story
 * (title, scenes, hashtags), renders one AI image per scene, assembles the
 * slideshow with ffmpeg, and writes a caption sidecar file so the result is
 * ready to copy-paste into TikTok at publish time.
 */
async function generateStoryVideo({ style, genre } = {}) {
  const story = generateStory(genre);
  const chosenStyle = style && STYLE_PRESETS[style] !== undefined ? style : story.suggestedStyle;
  const styleSuffix = STYLE_PRESETS[chosenStyle] || '';

  const scenes = story.sentences.map((caption, i) => ({
    caption,
    imagePrompt: [caption, styleSuffix].filter(Boolean).join(', '),
    seed: randomSeed(i),
  }));

  const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const baseName = `${slugify(story.title)}-${id}`;

  const workingFiles = [];
  const scenesWithImages = [];

  try {
    for (let i = 0; i < scenes.length; i += 1) {
      const scene = scenes[i];
      const imageBuffer = await fetchPollinationsImage(scene.imagePrompt, {
        width: 1080,
        height: 1920,
        seed: scene.seed,
      });
      const tempImagePath = path.join(GENERATED_DIR, `.tmp-agent-${id}-${i}.jpg`);
      await fs.writeFile(tempImagePath, imageBuffer);
      workingFiles.push(tempImagePath);
      scenesWithImages.push({ imagePath: tempImagePath, caption: scene.caption });
    }

    const videoFileName = `${baseName}.mp4`;
    const videoPath = path.join(GENERATED_DIR, videoFileName);

    await buildSlideshow({
      scenes: scenesWithImages,
      outPath: videoPath,
      sceneDurationSec: SCENE_DURATION_SEC,
      withMusic: true,
      withCaptions: true,
    });

    const durationSec = scenes.length * SCENE_DURATION_SEC;

    const postText = [story.title, '', story.description, '', story.hashtags.join(' ')].join('\n');
    await fs.writeFile(path.join(GENERATED_DIR, `${baseName}.txt`), postText, 'utf8');
    await fs.writeFile(
      path.join(GENERATED_DIR, `${baseName}.json`),
      JSON.stringify({ ...story, style: chosenStyle, sceneCount: scenes.length, durationSec, video: videoFileName }, null, 2),
      'utf8'
    );

    return {
      video: videoFileName,
      caption: `${baseName}.txt`,
      title: story.title,
      genre: story.genre,
      durationSec,
      sceneCount: scenes.length,
    };
  } finally {
    await Promise.all(workingFiles.map((f) => fs.rm(f, { force: true }).catch(() => {})));
  }
}

module.exports = { generateStoryVideo };
