import "server-only";
import { checkScript, SCRIPT_SYSTEM, scriptPrompt, scriptSchema, type VideoRequest, type VideoScript } from "@/lib/script";
import { z } from "zod";
import { env } from "./env";

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Script écrit par l'IA gratuite (Groq). Deux essais ; null si aucun script valide. */
export async function writeScript(r: VideoRequest, fetchImpl: typeof fetch = fetch): Promise<VideoScript | null> {
  const e = env();
  if (!e.GROQ_API_KEY) return null;
  const system = `${SCRIPT_SYSTEM}

Réponds UNIQUEMENT avec un objet JSON valide qui respecte ce schéma :
${JSON.stringify(z.toJSONSchema(scriptSchema))}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${e.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: e.GROQ_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: scriptPrompt(r) },
          ],
          max_tokens: 2000,
          temperature: 0.8,
          response_format: { type: "json_object" },
          ...(e.GROQ_MODEL.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const parsed = scriptSchema.safeParse(extractJson(data.choices?.[0]?.message?.content ?? ""));
      if (!parsed.success) continue;
      if (r.cta) parsed.data.cta = r.cta;
      const problem = checkScript(parsed.data);
      if (!problem) return parsed.data;
      console.warn("[vidaia] script refusé", problem);
    } catch (error) {
      console.error("[vidaia] Groq en échec", error);
    }
  }
  return null;
}
