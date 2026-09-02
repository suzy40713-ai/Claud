import { ACTIVITIES, computeCharges, formatEuros } from "../lib/rates";
import type { CotizoData } from "../lib/storage";

const MOIS_LABELS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

export function PrintableRecap({ data }: { data: CotizoData }) {
  if (!data.activity) return null;
  const info = ACTIVITIES[data.activity];

  const byYear = new Map<string, typeof data.entries>();
  for (const entry of data.entries) {
    const year = entry.month.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), entry]);
  }
  const years = [...byYear.keys()].sort();

  return (
    <div className="hidden print:block print:p-8">
      <h1 className="text-2xl font-bold">Cotizo — Recapitulatif</h1>
      <p className="mt-1 text-sm text-slate-600">
        Activite : {info.label} — Genere le {new Date().toLocaleDateString("fr-FR")}
      </p>

      {years.map((year) => {
        const entries = (byYear.get(year) ?? []).sort((a, b) => a.month.localeCompare(b.month));
        const yearTotal = entries.reduce((s, e) => s + e.chiffreAffaires, 0);
        const charges = computeCharges(data.activity!, yearTotal, data.versementLiberatoire);
        return (
          <div key={year} className="mt-6 break-inside-avoid">
            <h2 className="text-lg font-bold">{year}</h2>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-1">Mois</th>
                  <th className="py-1 text-right">Chiffre d'affaires</th>
                  <th className="py-1 text-right">Cotisations sociales</th>
                  <th className="py-1 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const c = computeCharges(data.activity!, e.chiffreAffaires, data.versementLiberatoire);
                  return (
                    <tr key={e.month} className="border-b border-slate-100">
                      <td className="py-1">{MOIS_LABELS[Number(e.month.slice(5, 7)) - 1]}</td>
                      <td className="py-1 text-right">{formatEuros(e.chiffreAffaires)}</td>
                      <td className="py-1 text-right">{formatEuros(c.cotisationsSociales)}</td>
                      <td className="py-1 text-right">{formatEuros(c.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="pt-2">Total {year}</td>
                  <td className="pt-2 text-right">{formatEuros(yearTotal)}</td>
                  <td className="pt-2 text-right">{formatEuros(charges.cotisationsSociales)}</td>
                  <td className="pt-2 text-right">{formatEuros(charges.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      <p className="mt-8 text-xs text-slate-400">
        Estimation basee sur le bareme officiel URSSAF — verifie toujours les montants exacts sur ton espace
        autoentrepreneur.urssaf.fr avant declaration. Document genere par Cotizo, non contractuel.
      </p>
    </div>
  );
}
