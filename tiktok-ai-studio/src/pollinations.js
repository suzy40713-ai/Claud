const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

const MAX_ATTEMPTS = 4;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a single AI-generated image from Pollinations.ai.
 * Pollinations is a free, keyless, no-account image generation API, which
 * is what makes this whole app free to run — but being free and shared, it
 * rate-limits aggressively (429) under bursts of traffic. Retry with
 * backoff before giving up, since a 429 is expected to clear quickly.
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error("Le service de generation d'images n'a pas renvoye une image valide");
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    const canRetry = RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS;
    if (!canRetry) {
      throw new Error(`Le service de generation d'images a repondu ${res.status}`);
    }
    await sleep(2 ** attempt * 1000);
  }
}

module.exports = { fetchPollinationsImage };
