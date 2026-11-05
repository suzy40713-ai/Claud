/**
 * Illustration du tableau de bord (données d'exemple, purement visuelles).
 */
const EVENTS = [
  { day: 0, start: 1, len: 1.5, name: "Coupe femme", who: "Julie", color: "#3563E9" },
  { day: 0, start: 4, len: 1, name: "Brushing", who: "Amina", color: "#7C3AED" },
  { day: 1, start: 0.5, len: 1, name: "Coupe homme", who: "Thomas", color: "#0891B2" },
  { day: 1, start: 3, len: 2, name: "Couleur", who: "Claire", color: "#DB2777" },
  { day: 2, start: 2, len: 1, name: "Coupe femme", who: "Sarah", color: "#3563E9" },
  { day: 3, start: 1, len: 1, name: "Barbe", who: "Karim", color: "#16A34A" },
  { day: 3, start: 3.5, len: 1.5, name: "Coupe + barbe", who: "Lucas", color: "#0891B2" },
  { day: 4, start: 0, len: 1, name: "Brushing", who: "Emma", color: "#7C3AED" },
  { day: 4, start: 2.5, len: 1.5, name: "Coupe femme", who: "Inès", color: "#3563E9" },
];
const DAYS = ["Lun 16", "Mar 17", "Mer 18", "Jeu 19", "Ven 20"];
const HOURS = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

export function DashboardPreview() {
  return (
    <div
      className="relative"
      aria-label="Aperçu illustratif du tableau de bord BookSync"
      role="img"
    >
      <div className="absolute -inset-x-8 -top-8 -bottom-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_40%,var(--primary-soft),transparent)]" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="flex items-center gap-1.5 border-b bg-subtle px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded-md bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            booksync.fr/tableau-de-bord/calendrier
          </span>
        </div>
        <div className="grid sm:grid-cols-[150px_1fr]">
          <div className="hidden border-r p-3 sm:block">
            {[
              "Vue générale",
              "Calendrier",
              "Réservations",
              "Clients",
              "Services",
              "Employés",
              "Statistiques",
            ].map((l, i) => (
              <div
                key={l}
                className={`mb-1 rounded-md px-2 py-1.5 text-[11px] font-medium ${i === 1 ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground"}`}
              >
                {l}
              </div>
            ))}
          </div>
          <div className="p-3">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                ["Aujourd'hui", "8"],
                ["Cette semaine", "34"],
                ["CA du mois", "2 480 €"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-2">
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[34px_repeat(5,1fr)] text-[10px]">
              <div />
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="border-l px-1 pb-1 text-center font-medium text-muted-foreground"
                >
                  {d}
                </div>
              ))}
              <div className="relative" style={{ height: 6 * 30 }}>
                {HOURS.map((h, i) => (
                  <span
                    key={h}
                    className="absolute right-1 text-muted-foreground"
                    style={{ top: i * 30 - 5 }}
                  >
                    {i ? h : ""}
                  </span>
                ))}
              </div>
              {DAYS.map((d, di) => (
                <div key={d} className="relative border-l" style={{ height: 6 * 30 }}>
                  {HOURS.map((h, i) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-border/60"
                      style={{ top: i * 30 }}
                    />
                  ))}
                  {EVENTS.filter((e) => e.day === di).map((e) => (
                    <div
                      key={e.name + e.start}
                      className="absolute inset-x-0.5 overflow-hidden rounded border-l-2 px-1 py-0.5 leading-tight"
                      style={{
                        top: e.start * 30 + 1,
                        height: e.len * 30 - 2,
                        borderLeftColor: e.color,
                        backgroundColor: `color-mix(in oklab, ${e.color} 14%, var(--card))`,
                      }}
                    >
                      <p className="truncate font-semibold">{e.who}</p>
                      <p className="truncate opacity-75">{e.name}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-2 hidden w-56 rounded-xl border bg-card p-3 shadow-lg sm:block">
        <p className="text-[11px] font-semibold text-success">● Nouvelle réservation</p>
        <p className="mt-1 text-xs font-medium">Claire D. — Couleur</p>
        <p className="text-[11px] text-muted-foreground">Mardi 17 à 12:00 · confirmée par email</p>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground sm:mt-8">
        Illustration — données d&apos;exemple
      </p>
    </div>
  );
}
