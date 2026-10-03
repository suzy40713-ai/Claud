const STOPWORDS = new Set(
  `a à au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma mais me même mes moi mon ne nos notre nous on ou où par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y été être avoir fait faire plus moins très tout tous toute toutes comme sans sous chez dès entre depuis aussi bien encore ici là alors donc car ni si est sont es suis sera ont as ai avez avons peut peux veux jour jours fois chaque leurs cela ça the and for you your with our are this that from have has was were will can all any not but get just more now new out its it's of to in on at by an or as be is we us my me so do no if up off www com http https
  découvrir découvre profitez profite offre gratuit gratuite livraison commander acheter achète shop now`
    .split(/\s+/)
    .filter(Boolean)
);

/** Extracts candidate keywords (lower-case, ≥4 letters, no stopwords) from free text. */
export function extractKeywords(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^\p{L}\p{N}'-]+/u)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

export function topCounts<T extends string>(items: T[], limit: number) {
  const counts = new Map<T, number>();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}
