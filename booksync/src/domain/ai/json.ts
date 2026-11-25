/** Lecture robuste d'une réponse JSON de modèle (blocs de code, texte autour). Logique pure. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Premier objet équilibré dans le texte.
    const start = cleaned.indexOf("{");
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    for (let i = start; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (inString) {
        if (c === "\\") i++;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

/** Jour UTC (AAAA-MM-JJ) : les quotas gratuits des fournisseurs se remettent à zéro à minuit UTC. */
export function utcDay(now: Date) {
  return now.toISOString().slice(0, 10);
}
