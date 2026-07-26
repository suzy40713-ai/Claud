"use client";

import { useMemo, useRef, useState } from "react";
import {
  IMPORT_ENTITIES,
  type ImportEntityKey,
} from "@/lib/import/entities";
import { parseCsvFile, type ParsedCsv } from "@/lib/import/csv";
import {
  validateRows,
  type ColumnMapping,
  type ValidationReport,
} from "@/lib/import/validate";
import { importRows, type ImportReport } from "@/lib/import/actions";

const ENTITY_KEYS = Object.keys(IMPORT_ENTITIES) as ImportEntityKey[];

function buildTemplateCsv(entity: ImportEntityKey): string {
  const fields = IMPORT_ENTITIES[entity].fields;
  return fields.map((f) => f.key).join(",") + "\n";
}

function downloadTemplate(entity: ImportEntityKey) {
  const csv = buildTemplateCsv(entity);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `modele-${entity}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function guessMapping(entity: ImportEntityKey, headers: string[]): ColumnMapping {
  const fields = IMPORT_ENTITIES[entity].fields;
  const mapping: ColumnMapping = {};
  for (const field of fields) {
    const match = headers.find(
      (h) => h.trim().toLowerCase() === field.key.toLowerCase(),
    );
    mapping[field.key] = match ?? null;
  }
  return mapping;
}

export function ImportWizard({ storeId }: { storeId: string }) {
  const [entity, setEntity] = useState<ImportEntityKey>("orders");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const entityDef = IMPORT_ENTITIES[entity];

  function resetWizard(nextEntity: ImportEntityKey) {
    setEntity(nextEntity);
    setCsv(null);
    setMapping({});
    setReport(null);
    setImportReport(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setReport(null);
    setImportReport(null);
    try {
      const parsed = await parseCsvFile(file);
      if (parsed.rows.length === 0) {
        setFileError("Le fichier CSV ne contient aucune ligne de données.");
        setCsv(null);
        return;
      }
      setCsv(parsed);
      setMapping(guessMapping(entity, parsed.headers));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Impossible de lire ce fichier.");
      setCsv(null);
    }
  }

  function handleMappingChange(fieldKey: string, column: string) {
    setMapping((prev) => ({ ...prev, [fieldKey]: column || null }));
    setReport(null);
    setImportReport(null);
  }

  function handleValidate() {
    if (!csv) return;
    setReport(validateRows(entity, csv.rows, mapping));
    setImportReport(null);
  }

  async function handleImport() {
    if (!report || report.validRows.length === 0) return;
    setIsImporting(true);
    try {
      const result = await importRows(entity, storeId, report.validRows);
      setImportReport(result);
    } finally {
      setIsImporting(false);
    }
  }

  const requiredFieldsMapped = useMemo(() => {
    if (!csv) return false;
    return entityDef.fields
      .filter((f) => f.required)
      .every((f) => Boolean(mapping[f.key]));
  }, [csv, entityDef, mapping]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b border-neutral-200">
        {ENTITY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => resetWizard(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              entity === key
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {IMPORT_ENTITIES[key].label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-sm text-neutral-600">{entityDef.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-sm"
          />
          <button
            onClick={() => downloadTemplate(entity)}
            className="text-sm font-medium text-neutral-700 underline underline-offset-2"
          >
            Télécharger un modèle CSV
          </button>
        </div>
        {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
      </div>

      {csv && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            Correspondance des colonnes
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            {csv.rows.length} ligne(s) détectée(s) dans le fichier.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entityDef.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-neutral-700">
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>
                <select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                >
                  <option value="">— Ignorer —</option>
                  {csv.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {field.helpText && (
                  <p className="text-xs text-neutral-400">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleValidate}
            disabled={!requiredFieldsMapped}
            className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            Valider les données
          </button>
          {!requiredFieldsMapped && (
            <p className="mt-2 text-xs text-neutral-500">
              Associez toutes les colonnes obligatoires (*) avant de valider.
            </p>
          )}
        </div>
      )}

      {report && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            Résultat de la validation
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            <span className="font-medium text-green-700">
              {report.validRows.length} ligne(s) valide(s)
            </span>{" "}
            ·{" "}
            <span className="font-medium text-red-700">
              {report.invalidRows.length} ligne(s) en erreur
            </span>
          </p>

          {report.invalidRows.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-red-100 bg-red-50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-red-100 text-red-800">
                    <th className="px-2 py-1.5">Ligne</th>
                    <th className="px-2 py-1.5">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invalidRows.map((row) => (
                    <tr key={row.rowIndex} className="border-b border-red-100/60">
                      <td className="px-2 py-1.5 align-top text-red-700">
                        {row.rowIndex}
                      </td>
                      <td className="px-2 py-1.5 text-red-700">
                        {row.errors.join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={report.validRows.length === 0 || isImporting}
            className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {isImporting
              ? "Import en cours..."
              : `Importer ${report.validRows.length} ligne(s) valide(s)`}
          </button>
        </div>
      )}

      {importReport && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            Résultat de l&apos;import
          </h3>
          <p className="mt-1 text-sm text-green-700">
            {importReport.insertedCount} ligne(s) importée(s) avec succès.
          </p>
          {importReport.errors.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-amber-100 bg-amber-50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-100 text-amber-800">
                    <th className="px-2 py-1.5">Ligne</th>
                    <th className="px-2 py-1.5">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {importReport.errors.map((err, i) => (
                    <tr key={`${err.rowIndex}-${i}`} className="border-b border-amber-100/60">
                      <td className="px-2 py-1.5 align-top text-amber-800">
                        {err.rowIndex}
                      </td>
                      <td className="px-2 py-1.5 text-amber-800">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
