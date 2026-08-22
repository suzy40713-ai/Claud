import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import type { GroceryItemDTO, GroceryListDTO, MealScanDTO } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

const CONFIANCE_LABEL: Record<MealScanDTO["confiance"], string> = {
  faible: "Estimation approximative",
  moyenne: "Estimation raisonnable",
  haute: "Estimation fiable",
};

const ADEQUATION_STYLE: Record<MealScanDTO["adequationObjectif"], { label: string; className: string }> = {
  adapte: { label: "✓ Adapte a ton objectif", className: "bg-emerald-100 text-emerald-700" },
  a_moderer: { label: "◐ A moderer", className: "bg-amber-100 text-amber-700" },
  a_eviter: { label: "✕ A eviter pour ton objectif", className: "bg-red-100 text-red-700" },
};

function UpsellBanner({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm">
      <span className="text-slate-600">{text}</span>
      <Link to="/abonnement">
        <Button variant="secondary">Passer premium</Button>
      </Link>
    </div>
  );
}

export function NutritionPage() {
  const [premium, setPremium] = useState<boolean | null>(null);
  const [list, setList] = useState<GroceryListDTO | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [scans, setScans] = useState<MealScanDTO[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getBillingStatus().then((s) => setPremium(s.premium));
    api.getGroceryList().then((r) => setList(r.list));
    api.getMealScans().then((r) => setScans(r.scans));
  }, []);

  async function handleGenerateList() {
    setListLoading(true);
    setListError(null);
    try {
      const { list } = await api.generateGroceryList();
      setList(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setPremium(false);
      } else {
        setListError(err instanceof ApiError ? err.message : "Impossible de generer la liste");
      }
    } finally {
      setListLoading(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    setScanLoading(true);
    try {
      const { scan } = await api.scanMeal(file);
      setScans((prev) => [scan, ...prev]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setPremium(false);
      } else {
        setScanError(err instanceof ApiError ? err.message : "Impossible d'analyser cette photo");
      }
    } finally {
      setScanLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const itemsByCategorie = (list?.items ?? []).reduce<Record<string, GroceryItemDTO[]>>((acc, item) => {
    (acc[item.categorie] ??= []).push(item);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-pink-600">Premium</p>
        <h1 className="mt-1 text-2xl font-bold">🥗 Nutrition IA</h1>
        <p className="text-base text-slate-500">Liste de courses generee et calories de tes repas, en un instant.</p>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">🛒 Liste de courses de la semaine</h2>
          <Button
            variant="secondary"
            disabled={listLoading || premium === false}
            onClick={handleGenerateList}
          >
            {listLoading ? "Generation..." : list ? "Regenerer" : "Generer ma liste"}
          </Button>
        </div>

        {premium === false && (
          <UpsellBanner text="La liste de courses generee par IA est une fonctionnalite premium." />
        )}
        {listError && <p className="text-sm text-red-600">{listError}</p>}

        {list ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(itemsByCategorie).map(([categorie, items]) => (
              <div key={categorie} className="rounded-xl bg-slate-50 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-600">{categorie}</h3>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                  {items.map((item) => (
                    <li key={item.nom} className="flex justify-between gap-2">
                      <span>{item.nom}</span>
                      <span className="text-slate-400">{item.quantite}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          premium !== false && (
            <p className="text-sm text-slate-400">
              Genere une liste de courses adaptee a ton objectif et tes sports pratiques.
            </p>
          )
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">📸 Scanner un plat</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            id="meal-photo-input"
            onChange={handleFileSelected}
          />
          <Button
            variant="secondary"
            disabled={scanLoading || premium === false}
            onClick={() => fileInputRef.current?.click()}
          >
            {scanLoading ? "Analyse..." : "Prendre une photo"}
          </Button>
        </div>

        {premium === false && <UpsellBanner text="Le scan de plats par IA est une fonctionnalite premium." />}
        {scanError && <p className="text-sm text-red-600">{scanError}</p>}

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {scans.map((scan) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{scan.description}</p>
                    <p className="text-xs text-slate-400">{CONFIANCE_LABEL[scan.confiance]}</p>
                  </div>
                  <p className="text-gradient-kadence shrink-0 text-2xl font-extrabold">{scan.calories} kcal</p>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-slate-600">
                  <span>🥩 {scan.proteinesG} g proteines</span>
                  <span>🍞 {scan.glucidesG} g glucides</span>
                  <span>🥑 {scan.lipidesG} g lipides</span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${ADEQUATION_STYLE[scan.adequationObjectif].className}`}
                  >
                    {ADEQUATION_STYLE[scan.adequationObjectif].label}
                  </span>
                  <p className="text-sm text-slate-600">{scan.commentaireObjectif}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {scans.length === 0 && premium !== false && (
            <p className="text-sm text-slate-400">
              Prends une photo de ton assiette pour estimer ses calories, macronutriments, et savoir si ce repas est
              adapte a ton objectif.
            </p>
          )}
        </div>
      </section>
    </motion.div>
  );
}
