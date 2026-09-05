export interface ResearchSource {
  title: string;
  url: string;
  extract: string;
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  // false when no source could be found/reached: the script must then say so
  // instead of presenting unverified content as a confirmed fact.
  verified: boolean;
}

const WIKIPEDIA_LANG = "fr";
const FETCH_TIMEOUT_MS = 10_000;

async function searchWikipediaTitles(query: string, limit = 3): Promise<string[]> {
  const url = `https://${WIKIPEDIA_LANG}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Wikipedia opensearch a repondu ${res.status}`);
  const data = (await res.json()) as [string, string[], string[], string[]];
  return data[1] ?? [];
}

async function fetchWikipediaSummary(title: string): Promise<ResearchSource | null> {
  const url = `https://${WIKIPEDIA_LANG}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  if (!data.extract) return null;
  return {
    title: data.title ?? title,
    url: data.content_urls?.desktop?.page ?? `https://${WIKIPEDIA_LANG}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    extract: data.extract,
  };
}

/**
 * Grounds a subject in real, citable sources using the free public Wikipedia
 * API (no key, generous rate limits). Returns verified: false rather than
 * inventing content when nothing reliable is found, so the script generator
 * can flag the video as unverified instead of presenting guesses as facts.
 */
export async function researchSubject(subject: string): Promise<ResearchResult> {
  try {
    const titles = await searchWikipediaTitles(subject);
    const sources: ResearchSource[] = [];
    for (const title of titles.slice(0, 2)) {
      const summary = await fetchWikipediaSummary(title);
      if (summary) sources.push(summary);
    }
    return { query: subject, sources, verified: sources.length > 0 };
  } catch {
    return { query: subject, sources: [], verified: false };
  }
}
