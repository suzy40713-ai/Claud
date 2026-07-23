const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

/**
 * Fetches a single AI-generated image from Pollinations.ai.
 * Pollinations is a free, keyless, no-account image generation API,
 * which is what makes this whole app free to run.
 */
async function fetchPollinationsImage(prompt, options = {}) {
  const { width = 1080, height = 1920, seed, model = 'flux', timeoutMs = 60000 } = options;

  const encodedPrompt = encodeURIComponent(prompt.slice(0, 800));
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    safe: 'true',
    model,
  });
  if (seed !== undefined && seed !== null) {
    params.set('seed', String(seed));
  }

  const url = `${POLLINATIONS_BASE}/${encodedPrompt}?${params.toString()}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`Le service de generation d'images a repondu ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error("Le service de generation d'images n'a pas renvoye une image valide");
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { fetchPollinationsImage };
