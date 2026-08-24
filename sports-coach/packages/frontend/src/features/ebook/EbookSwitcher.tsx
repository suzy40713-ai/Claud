import { Link } from "react-router";

const EBOOKS = [
  {
    to: "/ebook",
    id: "transformation-90-jours",
    emoji: "💪",
    titre: "Transformation 90 Jours",
    description: "Le programme complet.",
  },
  {
    to: "/recettes-regime",
    id: "recettes-regime",
    emoji: "🥗",
    titre: "Recettes Régime",
    description: "20 recettes riches en protéines pour la perte de poids.",
  },
  {
    to: "/recettes-prise-de-masse",
    id: "recettes-prise-de-masse",
    emoji: "💪",
    titre: "Recettes Prise de Masse",
    description: "20 recettes caloriques et riches en protéines pour le surplus.",
  },
  {
    to: "/guide-musculation-debutant",
    id: "guide-musculation-debutant",
    emoji: "🏋️",
    titre: "Bases de la Musculation",
    description: "Le programme simple pour bien débuter, sans te blesser.",
  },
  {
    to: "/programme-maison-sans-materiel",
    id: "programme-maison-sans-materiel",
    emoji: "🏠",
    titre: "Cardio & Renfo Sans Matériel",
    description: "4 semaines à la maison, sans matériel, 20-30 min par séance.",
  },
  {
    to: "/guide-sommeil-recuperation",
    id: "guide-sommeil-recuperation",
    emoji: "😴",
    titre: "Dors Mieux, Progresse Plus Vite",
    description: "Le guide pratique du sommeil et de la récupération.",
  },
];

export function EbookSwitcher({ current }: { current: string }) {
  return (
    <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Nos ebooks</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {EBOOKS.map((ebook) =>
          ebook.id === current ? (
            <div key={ebook.id} className="flex flex-col gap-1.5 rounded-xl border border-indigo-200 bg-white p-4">
              <span aria-hidden className="text-xl">
                {ebook.emoji}
              </span>
              <h3 className="text-sm font-semibold text-slate-900">{ebook.titre}</h3>
              <p className="text-xs leading-relaxed text-slate-500">Tu es dessus.</p>
            </div>
          ) : (
            <Link
              key={ebook.id}
              to={ebook.to}
              className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/5"
            >
              <span aria-hidden className="text-xl">
                {ebook.emoji}
              </span>
              <h3 className="text-sm font-semibold text-slate-900">{ebook.titre}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{ebook.description}</p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
