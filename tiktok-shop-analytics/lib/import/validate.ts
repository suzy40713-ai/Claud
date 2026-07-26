import {
  IMPORT_ENTITIES,
  type ImportEntityKey,
  type ImportFieldDef,
} from "@/lib/import/entities";

export interface FieldResult {
  value: string | number | null;
  error?: string;
}

function parseText(raw: string | undefined, field: ImportFieldDef): FieldResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    if (field.required) return { value: null, error: `${field.label} est requis` };
    return { value: field.defaultValue ?? null };
  }
  return { value: trimmed };
}

function parseNumber(raw: string | undefined, field: ImportFieldDef): FieldResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    if (field.required) return { value: null, error: `${field.label} est requis` };
    if (field.defaultValue !== undefined) return { value: Number(field.defaultValue) };
    return { value: null };
  }
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num)) {
    return { value: null, error: `${field.label} doit être un nombre (reçu "${raw}")` };
  }
  if (num < 0) {
    return { value: null, error: `${field.label} ne peut pas être négatif` };
  }
  return { value: num };
}

function parseDate(raw: string | undefined, field: ImportFieldDef): FieldResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    if (field.required) return { value: null, error: `${field.label} est requis` };
    return { value: null };
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return { value: `${y}-${m}-${d}` };
  }

  const euMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return { value: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` };
  }

  return {
    value: null,
    error: `${field.label} doit être au format AAAA-MM-JJ ou JJ/MM/AAAA (reçu "${raw}")`,
  };
}

function parseEnum(raw: string | undefined, field: ImportFieldDef): FieldResult {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (!trimmed) {
    if (field.required) return { value: null, error: `${field.label} est requis` };
    return { value: field.defaultValue ?? null };
  }
  const allowed = field.enumValues ?? [];
  if (!allowed.includes(trimmed)) {
    return {
      value: null,
      error: `${field.label} doit être l'une des valeurs : ${allowed.join(", ")} (reçu "${raw}")`,
    };
  }
  return { value: trimmed };
}

function parseField(raw: string | undefined, field: ImportFieldDef): FieldResult {
  switch (field.type) {
    case "number":
      return parseNumber(raw, field);
    case "date":
      return parseDate(raw, field);
    case "enum":
      return parseEnum(raw, field);
    case "text":
    default:
      return parseText(raw, field);
  }
}

export type ColumnMapping = Record<string, string | null>;

export interface ValidatedRow {
  rowIndex: number;
  values: Record<string, string | number | null>;
}

export interface InvalidRow {
  rowIndex: number;
  errors: string[];
}

export interface ValidationReport {
  validRows: ValidatedRow[];
  invalidRows: InvalidRow[];
}

/**
 * Applies the column mapping to raw CSV rows and runs per-field format
 * validation (required-ness, numeric/date/enum parsing). Does not touch the
 * database — foreign-key resolution (SKU, order number) happens server-side.
 */
export function validateRows(
  entity: ImportEntityKey,
  csvRows: Record<string, string>[],
  mapping: ColumnMapping,
): ValidationReport {
  const fields = IMPORT_ENTITIES[entity].fields;
  const validRows: ValidatedRow[] = [];
  const invalidRows: InvalidRow[] = [];

  csvRows.forEach((csvRow, i) => {
    const rowIndex = i + 2; // +1 for header row, +1 for 1-based display
    const values: Record<string, string | number | null> = {};
    const errors: string[] = [];

    for (const field of fields) {
      const column = mapping[field.key];
      const raw = column ? csvRow[column] : undefined;
      const result = parseField(raw, field);
      if (result.error) {
        errors.push(result.error);
      } else {
        values[field.key] = result.value;
      }
    }

    if (entity === "platform_fees") {
      const hasOrder = Boolean(values.external_order_id);
      const hasPeriod = Boolean(values.period_start) && Boolean(values.period_end);
      if (!hasOrder && !hasPeriod) {
        errors.push(
          "Un n° de commande ou une période complète (début + fin) est requis",
        );
      }
    }

    if (errors.length > 0) {
      invalidRows.push({ rowIndex, errors });
    } else {
      validRows.push({ rowIndex, values });
    }
  });

  return { validRows, invalidRows };
}
