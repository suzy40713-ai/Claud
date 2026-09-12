export interface LlmProvider {
  name: string;
  generate(system: string, user: string): Promise<string>;
}

export class LlmProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LlmProviderError";
  }
}
