import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CalendarClock, MapPin, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { DIRECTORY_ACTIVITIES } from "@/domain/activities";
import { capitalize, formatCents, formatDuration, formatInTz } from "@/lib/format";
import {
  directorySearchSchema,
  searchDirectory,
  type DirectoryResult,
  type DirectorySearch,
} from "@/server/directory";

export const metadata: Metadata = {
  title: "Trouver un professionnel",
  description:
    "Trouvez un coiffeur, un barbier, une esthéticienne, un coach ou un garage près de chez vous et réservez en ligne.",
};

type Params = Record<string, string | string[] | undefined>;

function ResultCard({ r }: { r: DirectoryResult }) {
  return (
    <li
      className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs sm:p-5"
      data-testid="directory-result"
    >
      <div className="flex items-start gap-3">
        {r.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logoUrl}
            alt=""
            className="size-12 shrink-0 rounded-xl border bg-white object-contain p-0.5"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            {r.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{r.name}</h2>
          <p className="text-sm text-muted-foreground">{r.activity}</p>
          {r.city ? (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {[r.postalCode, r.city].filter(Boolean).join(" ")}
            </p>
          ) : null}
        </div>
      </div>
      {r.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
      ) : null}
      {r.services.length ? (
        <ul className="mt-3 grid gap-1 text-sm">
          {r.services.map((s) => (
            <li key={s.name} className="flex justify-between gap-3">
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatDuration(s.durationMinutes)}
                {s.priceCents ? ` · ${formatCents(s.priceCents)}` : ""}
              </span>
            </li>
          ))}
          {r.servicesCount > r.services.length ? (
            <li className="text-[13px] text-muted-foreground">
              + {r.servicesCount - r.services.length} autre
              {r.servicesCount - r.services.length > 1 ? "s" : ""} prestation
              {r.servicesCount - r.services.length > 1 ? "s" : ""}
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="mt-auto pt-4">
        <p className="mb-3 flex items-center gap-1.5 text-[13px]">
          <CalendarClock className="size-4 text-primary" />
          {r.nextSlot ? (
            <span>
              Prochain créneau :{" "}
              <strong>
                {capitalize(formatInTz(r.nextSlot, r.timezone, "EEE d MMM 'à' HH:mm"))}
              </strong>
            </span>
          ) : (
            <span className="text-muted-foreground">Aucun créneau libre cette semaine</span>
          )}
        </p>
        <Button asChild className="w-full">
          <Link href={`/${r.slug}`}>Prendre rendez-vous</Link>
        </Button>
      </div>
    </li>
  );
}

function SearchForm({ s }: { s: DirectorySearch }) {
  return (
    <form
      action="/professionnels"
      role="search"
      className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium">Que cherchez-vous ?</span>
        <Input name="q" defaultValue={s.q} placeholder="Nom, prestation…" aria-label="Recherche" />
      </label>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium">Métier</span>
        <NativeSelect name="metier" defaultValue={s.metier ?? ""} aria-label="Métier">
          <option value="">Tous les métiers</option>
          {DIRECTORY_ACTIVITIES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium">Ville ou code postal</span>
        <Input
          name="lieu"
          defaultValue={s.lieu}
          placeholder="Dijon, 21000…"
          aria-label="Ville ou code postal"
        />
      </label>
      <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium">Prix maximum</span>
          <NativeSelect
            name="prixMax"
            defaultValue={s.prixMax ? String(s.prixMax) : ""}
            aria-label="Prix maximum"
          >
            <option value="">Indifférent</option>
            {[20, 30, 50, 80, 120].map((p) => (
              <option key={p} value={p}>
                Dès {p} € ou moins
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium">Disponibilité</span>
          <NativeSelect name="dispo" defaultValue={s.dispo ?? ""} aria-label="Disponibilité">
            <option value="">Indifférent</option>
            <option value="aujourdhui">Aujourd&apos;hui</option>
            <option value="semaine">Cette semaine</option>
          </NativeSelect>
        </label>
        <Button type="submit" size="lg" className="col-span-2 lg:col-span-1">
          <Search /> Rechercher
        </Button>
      </div>
    </form>
  );
}

function pageHref(params: Params, page: number): Route {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (typeof v === "string" && v && k !== "page") sp.set(k, v);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/professionnels${qs ? `?${qs}` : ""}` as Route;
}

async function Results({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const s = directorySearchSchema.parse(params);
  const { results, hasMore } = await searchDirectory(s);
  const filtered = Boolean(s.q || s.metier || s.lieu || s.prixMax || s.dispo);
  return (
    <div className="grid gap-6">
      <SearchForm s={s} />
      {results.length ? (
        <>
          <p className="text-sm text-muted-foreground" data-testid="directory-count">
            {results.length}
            {hasMore ? "+" : ""} professionnel{results.length > 1 ? "s" : ""}
            {filtered ? " correspondant à votre recherche" : " sur BookSync"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <ResultCard key={r.slug} r={r} />
            ))}
          </ul>
          {s.page > 1 || hasMore ? (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {s.page > 1 ? (
                <Button asChild variant="secondary">
                  <Link href={pageHref(params, s.page - 1)}>Précédent</Link>
                </Button>
              ) : null}
              {hasMore ? (
                <Button asChild variant="secondary">
                  <Link href={pageHref(params, s.page + 1)}>Suivant</Link>
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : (
        <div
          className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center"
          data-testid="directory-empty"
        >
          <Store className="mb-3 size-8 text-muted-foreground" />
          <p className="font-semibold">
            {filtered
              ? "Aucun professionnel ne correspond à votre recherche"
              : "Aucun professionnel n'est encore inscrit dans l'annuaire"}
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            BookSync est une nouvelle plateforme : les professionnels de votre secteur arrivent
            progressivement.{filtered ? " Essayez d'élargir votre recherche." : ""}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {filtered ? (
              <Button asChild variant="secondary">
                <Link href="/professionnels">Voir tous les professionnels</Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/inscription?pro=1">Je suis un professionnel</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DirectoryPage(props: PageProps<"/professionnels">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
          Trouver un professionnel
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Consultez les prestations, les tarifs et les disponibilités, puis réservez en quelques
          secondes. Sans compte, gratuitement.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Results searchParams={props.searchParams as Promise<Params>} />
      </Suspense>
    </main>
  );
}
