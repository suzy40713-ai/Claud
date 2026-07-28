declare module "fit-file-parser" {
  export default class FitParser {
    constructor(options?: Record<string, unknown>);
    parse(content: Buffer, callback: (error: unknown, data: any) => void): void;
  }
}
