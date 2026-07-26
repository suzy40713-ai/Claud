import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        resolve({
          headers: results.meta.fields ?? [],
          rows: results.data,
        });
      },
      error: (error: Error) => reject(error),
    });
  });
}
