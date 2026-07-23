const STYLE_PRESETS = {
  none: '',
  cinematic: 'cinematic lighting, dramatic composition, film grain, ultra detailed, 8k',
  anime: 'anime style, vibrant colors, studio quality illustration, sharp lineart',
  realistic: 'photorealistic, sharp focus, natural lighting, high detail, 4k photography',
  cyberpunk: 'cyberpunk style, neon lights, futuristic city, moody atmosphere',
  render3d: '3d render, octane render, studio lighting, high detail, subsurface scattering',
  fantasy: 'epic fantasy art, magical atmosphere, painterly, dramatic sky',
};

const CAMERA_ANGLES = [
  'wide establishing shot',
  'dynamic close-up shot',
  'low angle dramatic shot',
  'aerial drone shot',
  'over-the-shoulder shot',
  'macro detail shot',
  'slow motion action shot',
  'portrait shot, shallow depth of field',
];

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function randomSeed(offset) {
  return Math.floor(Math.random() * 1_000_000) + offset;
}

/**
 * Turns one free-form prompt into a list of scenes for a slideshow video.
 * - If the prompt already reads like a short script (several sentences),
 *   each sentence becomes its own scene/caption.
 * - Otherwise the same subject is reframed under different camera angles
 *   so the video still has visual movement from scene to scene.
 */
function buildScenes(prompt, sceneCount, style) {
  const styleSuffix = STYLE_PRESETS[style] ?? '';
  const sentences = splitIntoSentences(prompt);
  const scenes = [];

  if (sentences.length >= 2) {
    for (let i = 0; i < sceneCount; i += 1) {
      const caption = sentences[i % sentences.length];
      scenes.push({
        caption,
        imagePrompt: [caption, styleSuffix].filter(Boolean).join(', '),
        seed: randomSeed(i),
      });
    }
  } else {
    for (let i = 0; i < sceneCount; i += 1) {
      const angle = CAMERA_ANGLES[i % CAMERA_ANGLES.length];
      scenes.push({
        caption: prompt,
        imagePrompt: [prompt, angle, styleSuffix].filter(Boolean).join(', '),
        seed: randomSeed(i),
      });
    }
  }

  return scenes;
}

module.exports = { buildScenes, STYLE_PRESETS };
