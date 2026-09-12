import { LlmProviderError, type LlmProvider } from "./types";

export function createOpenAiProvider(): LlmProvider {
  return {
    name: "openai",
    async generate(system: string, user: string) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new LlmProviderError("OPENAI_API_KEY is not set", "openai");
      }

      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new LlmProviderError(`OpenAI API error (${response.status}): ${text}`, "openai");
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new LlmProviderError("OpenAI response missing message content", "openai");
      }
      return text;
    },
  };
}
