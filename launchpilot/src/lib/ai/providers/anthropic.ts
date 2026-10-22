import { LlmProviderError, type LlmProvider } from "./types";

export function createAnthropicProvider(): LlmProvider {
  return {
    name: "anthropic",
    async generate(system: string, user: string) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new LlmProviderError("ANTHROPIC_API_KEY is not set", "anthropic");
      }

      const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 16000,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new LlmProviderError(`Anthropic API error (${response.status}): ${text}`, "anthropic");
      }

      const data = await response.json();
      // Current models think by default, so the first block may be a thinking
      // block — pick the first text block instead of content[0].
      const text = Array.isArray(data?.content)
        ? data.content.find((block: { type?: string }) => block?.type === "text")?.text
        : undefined;
      if (typeof text !== "string") {
        throw new LlmProviderError("Anthropic response missing text content", "anthropic");
      }
      return text;
    },
  };
}
