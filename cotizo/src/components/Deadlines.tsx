import { useState } from "react";

type Rythme = "mensuel" | "trimestriel";

export function Deadlines() {
  const [rythme, setRythme] = useState<Rythme>("mensuel");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Echeances de declaration</h2>
      <div className="mt-3 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setRythme("mensuel")}
          className={`rounded-full px-4 py-1.5 transition-colors ${rythme === "mensuel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setRythme("trimestriel")}
          className={`rounded-full px-4 py-1.5 transition-colors ${rythme === "trimestriel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Trimestriel
        </button>
      </div>

      {rythme === "mensuel" ? (
        <p className="mt-4 text-sm text-slate-600">
          Tu declares et payes chaque mois ton chiffre d'affaires du mois precedent, en general avant le{" "}
          <span className="font-semibold text-slate-900">dernier jour du mois suivant</span> (ex : le CA de janvier se
          declare avant fin fevrier).
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Tu declares et payes chaque trimestre le CA du trimestre precedent, avant le{" "}
          <span className="font-semibold text-slate-900">dernier jour du mois suivant le trimestre</span> — soit fin
          avril, fin juillet, fin octobre et fin janvier.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Dates a titre indicatif — les echeances exactes sont visibles sur ton espace autoentrepreneur.urssaf.fr.
      </p>
    </div>
  );
}
